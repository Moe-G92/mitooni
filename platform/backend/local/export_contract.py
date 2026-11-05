import json
from pathlib import Path
from app.contracts.account import AccountOut,Onboarding,ProfilePatch

if __name__=='__main__':
    target=Path(__file__).with_name('account-contract.json')
    target.write_text(json.dumps({model.__name__:model.model_json_schema() for model in (AccountOut,Onboarding,ProfilePatch)},indent=2)+'\n')
    print('Wrote local/account-contract.json')
