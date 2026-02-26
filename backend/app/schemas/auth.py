import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    nickname: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class TokenRefresh(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    nickname: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    nickname: str | None
    avatar_url: str | None
    bio: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
