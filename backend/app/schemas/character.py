import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CharacterCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=20)
    gender: str = Field(default="female")
    relationship_type: str = Field(default="girlfriend")
    description: str = Field(..., min_length=10, max_length=500)
    personality: Optional[str] = None
    backstory: Optional[str] = None
    greeting_message: Optional[str] = None
    system_prompt: Optional[str] = ""
    tags: Optional[list[str]] = Field(default=None, max_length=5)
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    voice_profile_id: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=256, le=8192)


class CharacterUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=20)
    gender: Optional[str] = None
    relationship_type: Optional[str] = None
    description: Optional[str] = Field(default=None, min_length=10, max_length=500)
    personality: Optional[str] = None
    backstory: Optional[str] = None
    greeting_message: Optional[str] = None
    system_prompt: Optional[str] = None
    tags: Optional[list[str]] = Field(default=None, max_length=5)
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    voice_profile_id: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=256, le=8192)


class CharacterResponse(BaseModel):
    id: uuid.UUID
    name: str
    gender: str
    relationship_type: str
    description: Optional[str]
    personality: Optional[str]
    backstory: Optional[str]
    greeting_message: Optional[str]
    system_prompt: str
    tags: Optional[list[str]]
    avatar_url: Optional[str]
    cover_image_url: Optional[str]
    is_public: bool
    status: str
    like_count: int
    chat_count: int
    share_count: int
    conversation_count: int
    temperature: float
    max_tokens: int
    creator_id: uuid.UUID
    voice_profile_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CharacterListResponse(BaseModel):
    items: list[CharacterResponse]
    total: int
    page: int
    page_size: int
    pages: int


class PersonalityTemplate(BaseModel):
    name: str
    description: str
    personality_text: str
    sample_dialogues: list[str]
