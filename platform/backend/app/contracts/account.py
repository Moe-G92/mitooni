"""Mo-facing account contract; source BarEx profile/bootstrap separation adapted."""
from datetime import date
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Band = Annotated[float, Field(strict=True, ge=0, le=9, multiple_of=0.5)]


class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True, str_max_length=4096)


class Targets(Strict):
    overall: Band
    listening: Band
    reading: Band
    writing: Band
    speaking: Band


class Notifications(Strict):
    email: bool = False
    reminders: bool = False


class EditableProfile(Strict):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    locale: Literal['fa', 'en'] = 'fa'
    theme: Literal['system', 'light', 'dark'] = 'system'
    targets: Targets
    testDate: str | None = None
    currentLevel: Band | None = None
    weeklyHours: Annotated[int, Field(ge=0, le=60)]
    showFlag: bool = False
    notifications: Notifications = Field(default_factory=Notifications)

    @model_validator(mode='after')
    def check_date(self):
        if self.testDate is not None:
            if date.fromisoformat(self.testDate).isoformat() != self.testDate:
                raise ValueError('Invalid ISO date')
        return self


class TargetChanges(Strict):
    overall: Band | None = None
    listening: Band | None = None
    reading: Band | None = None
    writing: Band | None = None
    speaking: Band | None = None


class NotificationChanges(Strict):
    email: bool | None = None
    reminders: bool | None = None


class ProfileChanges(Strict):
    name: str | None = None
    locale: Literal['fa', 'en'] | None = None
    theme: Literal['system', 'light', 'dark'] | None = None
    targets: TargetChanges | None = None
    testDate: str | None = None
    currentLevel: Band | None = None
    weeklyHours: Annotated[int, Field(ge=0, le=60)] | None = None
    showFlag: bool | None = None
    notifications: NotificationChanges | None = None

    @model_validator(mode='after')
    def reject_empty_or_null_nonnullable(self):
        values = self.model_dump(exclude_unset=True)
        if not values or any(v is None and k not in {'testDate', 'currentLevel'} for k, v in values.items()):
            raise ValueError('Empty changes or invalid null')
        for k in ('targets', 'notifications'):
            if k in values and (not values[k] or any(v is None for v in values[k].values())):
                raise ValueError('Empty nested changes or invalid null')
        return self


class ProfilePatch(Strict):
    expectedRevision: Annotated[int, Field(ge=1)]
    changes: ProfileChanges


class Onboarding(Strict):
    expectedRevision: Annotated[int, Field(ge=0, le=0)]
    profile: EditableProfile


class ProfileOut(EditableProfile):
    onboarded: Literal[True]
    revision: Annotated[int, Field(ge=1)]


class IdentityOut(Strict):
    id: str
    email: str | None


class MembershipOut(Strict):
    status: Literal['none', 'active', 'inactive']
    roles: list[str]
    entitlements: list[str]


class AccountOut(Strict):
    identity: IdentityOut
    membership: MembershipOut
    state: Literal['access-required', 'setup-required', 'ready']
    profile: ProfileOut | None
