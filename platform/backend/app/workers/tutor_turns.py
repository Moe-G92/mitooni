"""BarEx revision_job_runtime lifespan/poll pattern, receiving fenced turns.

No source global client/env switch/exception logging. Provider side effects are
outside transactions; dispatch markers deliberately prevent blind retry.
"""

import asyncio
from app.dependencies import CurrentUser
from app.contracts.tutor_runtime import RunnerFailure
from app.repositories.account import AccountError


class AuthorizedTools:
    def __init__(self, repo, user, bound):
        self.repo, self.user, self.bound = repo, user, bound
        self.count = 0

    async def call(self, name, args):
        self.count += 1
        b = self.bound
        if self.count > b.limits.tool_calls:
            raise RunnerFailure("tool_limit")
        if name not in {"approved_anchor", "learning_snapshot", "next_options"}:
            raise RunnerFailure("tool_denied")
        if name == "approved_anchor":
            if set(args) != {"anchorId"}:
                raise RunnerFailure("tool_denied")
            anchor = next((a for a in b.anchors if a["id"] == args["anchorId"]), None)
            if anchor is None:
                raise RunnerFailure("tool_denied")
        elif args:
            raise RunnerFailure("tool_denied")
        # Current membership + fence checked before every tool; exposure commit
        # precedes release to runner. No caller-selected actor/workspace IDs.
        return await asyncio.to_thread(
            self.repo.worker,
            self.user,
            b.turn_id,
            "tool",
            fence=b.fence,
            candidate={"name": name, "arguments": args},
        )


class TutorWorker:
    def __init__(self, repo, runner):
        self.repo, self.runner = repo, runner
        self.stop = asyncio.Event()

    async def process(self, row):
        user = CurrentUser(str(row["subject_id"]))
        tid = str(row["turn_id"])
        bound = None
        dispatched = False
        try:
            bound = await asyncio.to_thread(self.repo.worker, user, tid, "claim")
            if bound is None:
                return
            tools = AuthorizedTools(self.repo, user, bound)
            prepared = self.runner.prepare(bound, tools)  # strictly no provider IO
            await asyncio.to_thread(
                self.repo.worker,
                user,
                tid,
                "dispatch",
                fence=bound.fence,
                candidate=bound.dispatch_id,
            )
            dispatched = True
            interrupted = None

            async def consume():
                candidate = None
                finished = False
                count = 0
                async with asyncio.timeout(bound.limits.timeout_seconds):
                    async for event in self.runner.stream(prepared):
                        if event.kind == "candidate":
                            candidate = event.data
                            count += 1
                        elif event.kind == "refusal":
                            raise RunnerFailure("provider_refused")
                        elif event.kind == "finished":
                            finished = True
                if not finished or count != 1:
                    raise RunnerFailure("invalid_output")
                return candidate

            generation = asyncio.create_task(consume())

            async def watch():
                nonlocal interrupted
                while not generation.done():
                    try:
                        status = await asyncio.to_thread(
                            self.repo.worker, user, tid, "check", fence=bound.fence
                        )
                    except AccountError as exc:
                        interrupted = (
                            "authority_unavailable"
                            if exc.status == 403
                            else "dispatch_unknown"
                        )
                        await self.runner.cancel(tid)
                        generation.cancel()
                        return
                    if status == "cancel-requested":
                        interrupted = "turn_canceled"
                        await self.runner.cancel(tid)
                        generation.cancel()
                        return
                    await asyncio.sleep(0.1)

            monitor = asyncio.create_task(watch())
            try:
                candidate = await generation
            except asyncio.CancelledError:
                if interrupted:
                    raise RunnerFailure(interrupted) from None
                raise
            finally:
                monitor.cancel()
                await asyncio.gather(monitor, return_exceptions=True)
            await asyncio.to_thread(
                self.repo.worker,
                user,
                tid,
                "complete",
                fence=bound.fence,
                candidate=candidate,
            )
        except asyncio.CancelledError:
            if bound:
                await self.runner.cancel(tid)
                try:
                    await asyncio.to_thread(
                        self.repo.worker,
                        user,
                        tid,
                        "fail",
                        fence=bound.fence,
                        error="dispatch_unknown"
                        if dispatched
                        else "provider_unavailable",
                    )
                except AccountError:
                    pass
            raise
        except Exception as exc:
            if bound:
                code = (
                    exc.code
                    if isinstance(exc, (RunnerFailure, AccountError))
                    else "dispatch_unknown"
                    if dispatched
                    else "provider_unavailable"
                )
                if dispatched and code in {
                    "provider_timeout",
                    "provider_unavailable",
                    "turn_lease_expired",
                }:
                    code = "dispatch_unknown"
                if isinstance(exc, TimeoutError):
                    await self.runner.cancel(tid)
                    code = "dispatch_unknown"
                # Exception data is never logged or returned.
                try:
                    await asyncio.to_thread(
                        self.repo.worker,
                        user,
                        tid,
                        "fail",
                        fence=bound.fence,
                        error=code,
                    )
                except AccountError:
                    pass

    async def run(self):
        while not self.stop.is_set():
            try:
                rows = await asyncio.to_thread(self.repo.queue)
                for row in rows:
                    if self.stop.is_set():
                        break
                    await self.process(row)
            except AccountError:
                pass
            try:
                await asyncio.wait_for(self.stop.wait(), timeout=0.25)
            except TimeoutError:
                pass
