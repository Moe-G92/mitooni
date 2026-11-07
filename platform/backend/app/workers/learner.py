"""Durable candidate jobs: authority/fence and budget commit precede provider IO."""
import asyncio
from app.dependencies import CurrentUser
from app.providers.learner import LearnerFailure


class LearnerWorker:
    def __init__(self, repo, runner):
        self.repo, self.runner = repo, runner
        if hasattr(repo, 'bind_execution_configuration'):
            repo.bind_execution_configuration({'text': runner.text_model, 'audio': runner.audio_model})
        self.stop = asyncio.Event()

    async def process(self, row):
        if row.get('issuer') != self.repo.config.issuer:
            return
        user, job_id = CurrentUser(str(row['subjectId'])), str(row['jobId'])
        claimed = generation = monitor = None
        dispatched = False
        interrupted = False
        async def fail(error):
            try:
                await asyncio.to_thread(self.repo.worker, user, job_id, 'fail',
                    fence=claimed['fence'], error=error)
            except Exception:
                pass  # Durable dispatched marker is recovered as unknown, not retried.
        try:
            claimed = await asyncio.to_thread(self.repo.worker, user, job_id, 'claim')
            if not claimed:
                return
            prepared = self.runner.prepare(claimed['payload'], claimed.get('audio'))
            await asyncio.to_thread(self.repo.worker, user, job_id, 'dispatch', fence=claimed['fence'])
            dispatched = True
            generation = asyncio.create_task(self.runner.run(prepared))
            async def watch():
                nonlocal interrupted
                while not generation.done():
                    try:
                        allowed = await asyncio.to_thread(self.repo.worker, user, job_id, 'check', fence=claimed['fence'])
                        if not allowed:
                            raise ValueError()
                    except Exception:
                        interrupted = True
                        await self.runner.cancel(job_id)
                        generation.cancel()
                        return
                    await asyncio.sleep(.1)
            monitor = asyncio.create_task(watch())
            try:
                async with asyncio.timeout(125):
                    result = await generation
            except asyncio.CancelledError:
                if interrupted:
                    raise LearnerFailure('dispatch_unknown') from None
                raise
            await asyncio.to_thread(self.repo.worker, user, job_id, 'complete',
                fence=claimed['fence'], result=result)
        except asyncio.CancelledError:
            if claimed:
                await self.runner.cancel(job_id)
                await fail(LearnerFailure('dispatch_unknown' if dispatched else 'provider_unavailable'))
            raise
        except Exception as error:
            if claimed:
                if not isinstance(error, LearnerFailure):
                    error = LearnerFailure('dispatch_unknown' if dispatched else 'provider_unavailable')
                elif dispatched and error.code in ('provider_timeout', 'provider_unavailable'):
                    error = LearnerFailure('dispatch_unknown', usage=error.usage,
                        model=error.model, response_id=error.response_id)
                await fail(error)
        finally:
            for task in (generation, monitor):
                if task:
                    task.cancel()
            await asyncio.gather(*(t for t in (generation, monitor) if t), return_exceptions=True)

    async def run(self):
        while not self.stop.is_set():
            try:
                for row in await asyncio.to_thread(self.repo.queue):
                    if self.stop.is_set():
                        break
                    await self.process(row)
            except Exception:
                pass  # No private SQL, learner work or remote exception logging.
            try:
                await asyncio.wait_for(self.stop.wait(), timeout=.25)
            except TimeoutError:
                pass
