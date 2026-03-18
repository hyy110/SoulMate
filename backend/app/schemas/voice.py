import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class VoiceResponse(BaseModel):
    id: str
    name: str
    language: str
    provider: str
    voice_type: str
    status: str
    training_progress: float
    estimated_time: int | None = None
    reference_audio_url: str | None = None
    created_at: datetime | None = None
    is_preset: bool = False

    model_config = {"from_attributes": True}


class VoiceTrainStatusResponse(BaseModel):
    voice_id: uuid.UUID
    status: str
    progress: float = Field(ge=0.0, le=1.0)
    estimated_time: int | None = None


class VoiceCreateResponse(BaseModel):
    message: str
    voice: VoiceResponse


class VoicePreviewRequest(BaseModel):
    voice_id: str
    text: str = Field(min_length=1, max_length=500)
