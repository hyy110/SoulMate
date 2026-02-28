import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Text, Integer, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import GUID, JSONType


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    greeting_message: Mapped[str | None] = mapped_column(Text)
    personality_tags: Mapped[dict | None] = mapped_column(JSONType)
    model_config_json: Mapped[dict | None] = mapped_column(JSONType)
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=2048)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    category: Mapped[str | None] = mapped_column(String(50))
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    conversation_count: Mapped[int] = mapped_column(Integer, default=0)
    creator_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    voice_profile_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("voice_profiles.id"))
    knowledge_base_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("knowledge_bases.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", back_populates="characters")
    voice_profile = relationship("VoiceProfile", back_populates="characters")
    knowledge_base = relationship("KnowledgeBase", back_populates="characters")
    conversations = relationship("Conversation", back_populates="character", lazy="selectin")
    tools = relationship("Tool", back_populates="character", lazy="selectin")


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    character_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("characters.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
