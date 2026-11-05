"""Explicit local test runner. Never a production provider fallback."""

import asyncio
from app.contracts.tutor_runtime import RunnerEvent


class SyntheticRunner:
    kind = "synthetic"

    def prepare(self, bound, tools):
        if bound.assistance_mode == "independent":
            raise ValueError("Restricted context")
        return bound, tools

    async def stream(self, prepared):
        b, tools = prepared
        await tools.call("learning_snapshot", {})
        yield RunnerEvent("tool_status", "checking")
        await asyncio.sleep(0.15)
        # Raw private test marker must never be exposed by HTTP.
        yield RunnerEvent("text_delta", "PRIVATE CANDIDATE NOT FOR DISPLAY")
        reading = b.bundle["objectiveId"].startswith("reading")
        if reading:
            text = (
                "Your choice is supported. The passage reports increased walking but does not identify its cause. Explain why sequence alone cannot establish causation."
                if b.work_text.strip().upper() == "B"
                else "Separate the observation from its cause. The passage reports increased walking after the path opened, but the survey did not establish why. Compare the causal claim with the limited survey evidence, then revise your choice."
            )
        else:
            words = b.work_text.split()
            text = (
                "Your draft gives us a position to examine. Connect one specific library example to the reason it supports, then explain the consequence for your position."
                if len(words) > 25
                else "Start with a clear position. Choose one reason for digital access or physical books, add a specific library example, and explain how that example supports the reason. Write that chain before expanding the essay."
            )
        proposal = None
        if b.intent == "propose_next":
            options = (await tools.call("next_options", {}))["options"]
            if options:
                proposal = options[0]
        spans = (
            []
            if not b.work_text
            else [
                dict(start=0, end=min(len(b.work_text), 150), quote=b.work_text[:150])
            ]
        )
        yield RunnerEvent(
            "candidate",
            dict(
                kind="feedback" if b.intent == "feedback" else "question",
                text=text,
                citations=[{"anchorId": b.anchors[0]["id"]}],
                workSpans=spans,
                observations=[
                    dict(
                        criterionId=b.criterion_ids[0],
                        text="Check the link between the response and the stated evidence or reason.",
                        workSpanIndexes=[0],
                    )
                ]
                if b.intent == "feedback" and spans
                else [],
                proposal=proposal,
            ),
        )
        yield RunnerEvent("usage", {"total_tokens": 250})
        yield RunnerEvent("finished")

    async def cancel(self, turn_id):
        pass
