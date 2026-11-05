"""Original synthetic engineering fixtures; no licensed source corpus.

No teacher/examiner validation or scoring efficacy is implied. Production
publication must be explicit; application code has no fixture fallback.
"""

import hashlib
import json


def packs():
    raw = [
        dict(
            stepId="reading-evidence",
            title="Reading evidence",
            skill="reading",
            kind="reading",
            taskId="reading-park",
            familyId="park-family",
            stimulus="A town opened a shaded walking path in May. A survey in June found that more residents walked at lunchtime. The survey did not ask why they chose to walk.",
            prompt="Choose the supported claim: A) Shade caused the increase in walking. B) More residents walked, but the cause is not established. Enter A or B.",
            privateKey="B",
            anchors=[
                dict(
                    id="reading-causation",
                    label="Evidence and causation",
                    text="A reported change following an event does not alone prove its cause. Distinguish the observed result from an unsupported causal claim.",
                )
            ],
            criteria=["evidence", "inference"],
        ),
        dict(
            stepId="writing-reasons",
            title="Writing a reasoned position",
            skill="writing",
            kind="task2",
            taskId="writing-libraries",
            familyId="library-family",
            stimulus="",
            prompt="Some people think public libraries should focus on digital services. Others think physical books remain their main purpose. Discuss both views and give your own opinion.",
            anchors=[
                dict(
                    id="writing-reason",
                    label="Position and support",
                    text="State a position, give a specific reason, and explain how an example supports it. A list of claims without explanation does not establish the reasoning.",
                )
            ],
            criteria=["position", "support", "organisation"],
        ),
    ]
    for index, p in enumerate(raw):
        p["bundleRef"] = dict(
            packId=p["stepId"],
            packVersion=1,
            contentHash=hashlib.sha256(
                json.dumps(p, sort_keys=True).encode()
            ).hexdigest(),
            objectiveId=p["stepId"],
            objectiveVersion=1,
            rubricVersion=1,
            policyVersion=1,
            familyRegistryVersion=1,
        )
        p["nextStepId"] = (
            raw[index + 1]["stepId"] if index + 1 < len(raw) else p["stepId"]
        )
        p["publication"] = "synthetic-engineering-only"
    return raw
