from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.models.user import User
from app.security import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS: dict[str, Any] = {
    "theme": "light",
    "language": "zh-CN",
    "font_size": 16,
    "send_key": "Enter",
    "enable_sound": True,
    "enable_notification": True,
    "enable_voice_input": False,
    "auto_play_voice": False,
    "chat_bubble_style": "default",
    "default_model": "gpt-3.5-turbo",
}


class UserSettings(BaseModel):
    theme: str = "light"
    language: str = "zh-CN"
    font_size: int = Field(default=16, ge=12, le=24)
    send_key: str = "Enter"
    enable_sound: bool = True
    enable_notification: bool = True
    enable_voice_input: bool = False
    auto_play_voice: bool = False
    chat_bubble_style: str = "default"
    default_model: str = "gpt-3.5-turbo"


class LLMModel(BaseModel):
    id: str
    name: str
    provider: str
    description: str
    max_tokens: int
    is_free: bool = False


AVAILABLE_MODELS: list[dict[str, Any]] = [
    {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "provider": "OpenAI",
        "description": "速度快、性价比高的模型",
        "max_tokens": 4096,
        "is_free": True,
    },
    {
        "id": "gpt-4",
        "name": "GPT-4",
        "provider": "OpenAI",
        "description": "最强大的推理能力",
        "max_tokens": 8192,
        "is_free": False,
    },
    {
        "id": "gpt-4-turbo",
        "name": "GPT-4 Turbo",
        "provider": "OpenAI",
        "description": "GPT-4的快速版本，支持更长上下文",
        "max_tokens": 128000,
        "is_free": False,
    },
    {
        "id": "claude-3-sonnet",
        "name": "Claude 3 Sonnet",
        "provider": "Anthropic",
        "description": "均衡的智能与速度",
        "max_tokens": 200000,
        "is_free": False,
    },
    {
        "id": "deepseek-chat",
        "name": "DeepSeek Chat",
        "provider": "DeepSeek",
        "description": "国产高性能大模型",
        "max_tokens": 32768,
        "is_free": True,
    },
    {
        "id": "qwen-turbo",
        "name": "通义千问 Turbo",
        "provider": "Alibaba",
        "description": "阿里云大模型，中文能力突出",
        "max_tokens": 8192,
        "is_free": True,
    },
]


@router.get("")
def get_settings(current_user: User = Depends(get_current_user)):
    return {**DEFAULT_SETTINGS}


@router.put("")
def update_settings(
    body: UserSettings,
    current_user: User = Depends(get_current_user),
):
    updated = body.model_dump()
    return updated


@router.get("/llm-models", response_model=list[LLMModel])
def list_llm_models():
    return AVAILABLE_MODELS
