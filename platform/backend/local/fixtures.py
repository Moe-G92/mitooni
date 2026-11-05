"""Synthetic identities only; never registered by production application code."""
from app.dependencies import AuthenticationUnavailable, CurrentUser

SUBJECTS={name: f'{number:08d}-0000-4000-8000-000000000000' for number,name in enumerate(['a','b','inactive','nonmember','readonly'],1)}


class LocalSyntheticVerifier:
    def verify(self,token):
        if token=='local-unavailable':
            raise AuthenticationUnavailable()
        name=token.removeprefix('local-') if token.startswith('local-') else ''
        if name not in SUBJECTS:
            raise ValueError('Invalid synthetic credential')
        return CurrentUser(SUBJECTS[name],f'{name}@example.invalid')
