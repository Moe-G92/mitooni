"""Opt-in separate synthetic reviewer; no roles inferred from claims or token."""
from app.dependencies import CurrentUser
from local.fixtures import LocalSyntheticVerifier

REVIEWER_ID = '00000006-0000-4000-8000-000000000000'

class LocalReviewVerifier(LocalSyntheticVerifier):
    def verify(self, token):
        if token == 'local-reviewer':
            return CurrentUser(REVIEWER_ID, 'reviewer@example.invalid')
        return super().verify(token)
