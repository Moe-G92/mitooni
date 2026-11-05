"""Export strict backend wire schemas without network or fixture activation."""

import json
from pathlib import Path
from app.contracts import study

NAMES = [
    "JourneyResponse",
    "WorkspaceResponse",
    "DraftOut",
    "AttemptOut",
    "TurnOut",
    "TurnResponse",
    "ProposalOut",
    "ProposalAcceptOut",
    "ResolveIn",
    "DraftIn",
    "SubmitIn",
    "AssistanceIn",
    "ChildAttemptIn",
    "TurnIn",
    "CancelIn",
    "AcceptProposalIn",
]
if __name__ == "__main__":
    Path(__file__).with_name("study-contract.json").write_text(
        json.dumps(
            {name: getattr(study, name).model_json_schema() for name in NAMES}, indent=2
        )
        + "\n"
    )
