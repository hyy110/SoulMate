import math
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.character import Character
from app.models.user import User
from app.schemas.character import CharacterListResponse, CharacterResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/explore", tags=["explore"])

PUBLISHED = "published"


def _published_base(db: Session):
    return db.query(Character).filter(
        Character.status == PUBLISHED,
        Character.is_public.is_(True),
    )


@router.get("", response_model=CharacterListResponse)
def explore_characters(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    sort: str = Query("popular", regex="^(popular|newest)$"),
    db: Session = Depends(get_db),
):
    query = _published_base(db)

    if sort == "newest":
        query = query.order_by(Character.created_at.desc())
    else:
        query = query.order_by(
            (Character.like_count + Character.chat_count).desc(),
            Character.created_at.desc(),
        )

    total = query.count()
    pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return CharacterListResponse(
        items=[CharacterResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/trending", response_model=list[CharacterResponse])
def trending_characters(db: Session = Depends(get_db)):
    items = (
        _published_base(db)
        .order_by((Character.like_count + Character.chat_count).desc())
        .limit(10)
        .all()
    )
    return [CharacterResponse.model_validate(c) for c in items]


@router.get("/newest", response_model=list[CharacterResponse])
def newest_characters(db: Session = Depends(get_db)):
    items = (
        _published_base(db)
        .order_by(Character.created_at.desc())
        .limit(10)
        .all()
    )
    return [CharacterResponse.model_validate(c) for c in items]


@router.get("/tags")
def get_tags(db: Session = Depends(get_db)):
    characters = _published_base(db).all()
    counter: Counter[str] = Counter()
    for c in characters:
        if c.tags:
            for tag in c.tags:
                counter[tag] += 1

    top_tags = counter.most_common(20)
    return [{"tag": tag, "count": count} for tag, count in top_tags]


@router.get("/tags/{tag}", response_model=CharacterListResponse)
def characters_by_tag(
    tag: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    all_published = _published_base(db).all()
    matched = [c for c in all_published if c.tags and tag in c.tags]

    total = len(matched)
    pages = math.ceil(total / page_size) if total > 0 else 1
    start = (page - 1) * page_size
    items = matched[start : start + page_size]

    return CharacterListResponse(
        items=[CharacterResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/search", response_model=CharacterListResponse)
def search_characters(
    q: str = Query(..., min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = _published_base(db).filter(
        or_(
            Character.name.ilike(f"%{q}%"),
            Character.description.ilike(f"%{q}%"),
        )
    )

    total = query.count()
    pages = math.ceil(total / page_size) if total > 0 else 1
    items = (
        query.order_by(Character.like_count.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return CharacterListResponse(
        items=[CharacterResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/users/{user_id}/characters", response_model=list[CharacterResponse])
def user_public_characters(
    user_id: str,
    db: Session = Depends(get_db),
):
    items = (
        db.query(Character)
        .filter(
            Character.creator_id == user_id,
            Character.status == PUBLISHED,
            Character.is_public.is_(True),
        )
        .order_by(Character.created_at.desc())
        .all()
    )
    return [CharacterResponse.model_validate(c) for c in items]
