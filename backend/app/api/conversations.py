import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.character import Character
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.security import get_current_user


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ConversationCreate(BaseModel):
    character_id: str


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    audio_url: Optional[str] = None
    token_count: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str] = None
    user_id: uuid.UUID
    character_id: uuid.UUID
    character_name: str = ""
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageSend(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class MessageListResponse(BaseModel):
    items: list[MessageResponse]
    has_more: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_conversation_response(conv: Conversation) -> ConversationResponse:
    char_name = conv.character.name if conv.character else ""
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        user_id=conv.user_id,
        character_id=conv.character_id,
        character_name=char_name,
        message_count=conv.message_count,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


def _get_own_conversation(
    conversation_id: str,
    current_user: User,
    db: Session,
) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此对话")
    return conv


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    body: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == body.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    if not character.is_public and character.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权与此角色对话")

    conv = Conversation(
        title=f"与{character.name}的对话",
        user_id=current_user.id,
        character_id=character.id,
        message_count=0,
    )
    db.add(conv)
    db.flush()

    if character.greeting_message:
        greeting = Message(
            conversation_id=conv.id,
            role="assistant",
            content=character.greeting_message,
        )
        db.add(greeting)
        conv.message_count = 1

    character.chat_count = (character.chat_count or 0) + 1
    character.conversation_count = (character.conversation_count or 0) + 1

    db.commit()
    db.refresh(conv)
    return _build_conversation_response(conv)


@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [_build_conversation_response(c) for c in convs]


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)
    return _build_conversation_response(conv)


@router.put("/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)

    if body.title is not None:
        conv.title = body.title

    db.commit()
    db.refresh(conv)
    return _build_conversation_response(conv)


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)
    db.query(Message).filter(Message.conversation_id == conv.id).delete()
    db.delete(conv)
    db.commit()
    return {"message": "对话已删除"}


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
def list_messages(
    conversation_id: str,
    limit: int = Query(20, ge=1, le=100),
    before: str | None = Query(None, description="cursor: message id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)

    query = db.query(Message).filter(Message.conversation_id == conv.id)

    if before:
        cursor_msg = db.query(Message).filter(Message.id == before).first()
        if cursor_msg:
            query = query.filter(Message.created_at < cursor_msg.created_at)

    messages = (
        query.order_by(Message.created_at.desc())
        .limit(limit + 1)
        .all()
    )

    has_more = len(messages) > limit
    messages = messages[:limit]
    messages.reverse()

    return MessageListResponse(
        items=[MessageResponse.model_validate(m) for m in messages],
        has_more=has_more,
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def send_message(
    conversation_id: str,
    body: MessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)
    character = db.query(Character).filter(Character.id == conv.character_id).first()

    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)

    char_name = character.name if character else "AI"
    ai_reply = Message(
        conversation_id=conv.id,
        role="assistant",
        content=f"我是{char_name}，你说的是：{body.content}",
    )
    db.add(ai_reply)

    conv.message_count = (conv.message_count or 0) + 2
    conv.updated_at = func.now()

    db.commit()
    db.refresh(ai_reply)
    return MessageResponse.model_validate(ai_reply)


@router.delete("/{conversation_id}/messages/{message_id}")
def delete_message(
    conversation_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)

    msg = (
        db.query(Message)
        .filter(Message.id == message_id, Message.conversation_id == conv.id)
        .first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="消息不存在")

    db.delete(msg)
    conv.message_count = max((conv.message_count or 0) - 1, 0)
    db.commit()
    return {"message": "消息已删除"}


@router.post("/{conversation_id}/clear")
def clear_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_own_conversation(conversation_id, current_user, db)
    deleted = db.query(Message).filter(Message.conversation_id == conv.id).delete()
    conv.message_count = 0
    db.commit()
    return {"message": f"已清除{deleted}条消息"}
