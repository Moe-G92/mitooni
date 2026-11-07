"""Fenced one-shot audio dispatch. Uncertain external execution never auto-retries."""
import asyncio
from app.dependencies import CurrentUser
from app.repositories.account import AccountError

class SpeakingReviewWorker:
    def __init__(self,repo,runner):
        self.repo,self.runner=repo,runner
        self.stop=asyncio.Event()

    async def process(self,row):
        user=CurrentUser(str(row['subject_id']));job_id=str(row['job_id']);claimed=None
        generation=monitor=None
        interrupted=False
        try:
            claimed=await asyncio.to_thread(self.repo.worker,user,job_id,'claim')
            if not claimed:return
            prepared=self.runner.prepare(claimed['bound'],claimed['audio'])
            dispatched=await asyncio.to_thread(self.repo.worker,user,job_id,'dispatch',fence=claimed['fence'])
            if not dispatched:return
            generation=asyncio.create_task(self.runner.run(prepared))
            async def watch():
                nonlocal interrupted
                while not generation.done():
                    try:
                        ok=await asyncio.to_thread(self.repo.worker,user,job_id,'check',fence=claimed['fence'])
                        if not ok:raise ValueError()
                    except Exception:
                        interrupted=True
                        generation.cancel();return
                    await asyncio.sleep(.1)
            monitor=asyncio.create_task(watch())
            try:
                async with asyncio.timeout(125):result=await generation
            except asyncio.CancelledError:
                if interrupted:raise ValueError('Authority unavailable') from None
                raise
            await asyncio.to_thread(self.repo.worker,user,job_id,'complete',fence=claimed['fence'],result=result)
        except asyncio.CancelledError:
            if claimed:
                try:await asyncio.to_thread(self.repo.worker,user,job_id,'fail',fence=claimed['fence'])
                except AccountError:pass
            raise
        except Exception:
            if claimed:
                try:await asyncio.to_thread(self.repo.worker,user,job_id,'fail',fence=claimed['fence'])
                except AccountError:pass
        finally:
            for task in (generation,monitor):
                if task:task.cancel()
            await asyncio.gather(*(t for t in (generation,monitor) if t),return_exceptions=True)

    async def run(self):
        while not self.stop.is_set():
            try:
                for row in await asyncio.to_thread(self.repo.queue):
                    if self.stop.is_set():break
                    await self.process(row)
            except AccountError:pass
            try:await asyncio.wait_for(self.stop.wait(),timeout=.25)
            except TimeoutError:pass
