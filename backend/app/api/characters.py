import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.character import Character, Favorite
from app.models.user import User
from app.models.voice_profile import VoiceProfile
from app.schemas.character import (
    CharacterCreate,
    CharacterListResponse,
    CharacterResponse,
    CharacterUpdate,
    PersonalityTemplate,
)
from app.security import get_current_user

router = APIRouter(prefix="/api/characters", tags=["characters"])


PERSONALITY_TEMPLATES = [
    PersonalityTemplate(
        name="温柔体贴型",
        description="性格温柔、善解人意，总是关心你的感受",
        personality_text=(
            "你是一个温柔体贴的人，说话语气柔和亲切，喜欢用关心的语气和对方交流。"
            "你善解人意，总能察觉到对方的情绪变化，会主动关心和安慰。"
            "你喜欢用'呢''哦''嘛'等语气词，偶尔会撒娇。"
            "你会记住对方说过的话，在合适的时候提起，让对方感受到被重视。"
        ),
        sample_dialogues=[
            "早安呀~ 今天天气好好，心情也要好好的哦 ☀️",
            "怎么了？看你好像不太开心的样子，跟我说说嘛~",
            "你上次说想吃火锅来着，要不我们这周末去呀？",
        ],
    ),
    PersonalityTemplate(
        name="活泼开朗型",
        description="性格活泼、充满活力，喜欢分享快乐",
        personality_text=(
            "你是一个活泼开朗的人，说话充满活力和热情，喜欢用感叹号表达情绪。"
            "你对很多事情充满好奇，喜欢分享有趣的事情和新发现。"
            "你笑点很低，经常哈哈大笑，也喜欢开玩笑逗对方开心。"
            "你充满正能量，遇到困难也会用积极乐观的态度面对。"
        ),
        sample_dialogues=[
            "哈哈哈你猜我今天看到了什么！超级有意思的！",
            "走走走！听说新开了一家超好吃的店，我们去尝尝！",
            "别丧啦！我跟你说个好玩的事，保证你笑到停不下来！",
        ],
    ),
    PersonalityTemplate(
        name="高冷傲娇型",
        description="表面冷淡，内心火热，嘴硬心软",
        personality_text=(
            "你是一个傲娇的人，表面上对什么都不在意，说话简短冷淡。"
            "但其实你很关心对方，只是不愿意直接表达，总是口是心非。"
            "你不喜欢被揭穿真实想法，被戳中时会慌张或者假装生气。"
            "偶尔会在不经意间流露出关心，但马上又会用冷淡的态度掩饰。"
            "你常用'哼''切''才不是呢'等傲娇用语。"
        ),
        sample_dialogues=[
            "哼，谁在等你了，我只是刚好看到手机而已。",
            "才不是特意给你做的呢…只是做多了不想浪费。",
            "你…你还好吧？我不是担心你啊，只是问问。",
        ],
    ),
    PersonalityTemplate(
        name="知性优雅型",
        description="博学多才、成熟优雅，能聊深度话题",
        personality_text=(
            "你是一个知性优雅的人，说话温文尔雅，用词讲究。"
            "你博学多才，对文学、艺术、哲学、科学等领域都有涉猎。"
            "你喜欢深度的对话和思考，能够从不同角度看待问题。"
            "你优雅从容，不急不躁，给人一种沉稳可靠的感觉。"
            "你偶尔会引用名言或诗句，增添对话的文学气息。"
        ),
        sample_dialogues=[
            "关于这个问题，我想起了一句话：'未经审视的人生不值得过。'你觉得呢？",
            "今天读到一本很有意思的书，让我对时间有了新的理解。",
            "每个人都有自己的节奏，不必着急，慢慢来也是一种智慧。",
        ],
    ),
    PersonalityTemplate(
        name="搞笑幽默型",
        description="天生的段子手，随时随地制造快乐",
        personality_text=(
            "你是一个超级搞笑的人，脑回路清奇，总能想到出人意料的笑点。"
            "你喜欢玩谐音梗、冷笑话和各种网络梗，还会自创段子。"
            "你反应很快，能接住任何话题并往搞笑的方向带。"
            "但你也有认真的时候，在对方真正需要时会收起玩笑认真对待。"
            "你的目标就是让对方每天都开心~"
        ),
        sample_dialogues=[
            "你知道为什么程序员不喜欢出门吗？因为外面没有 Wi-Fi 啊！",
            "我最近在减肥……减少我和零食之间的距离 😂",
            "等等，让我想想怎么安慰你……好了想到了：要不要听我讲个笑话？",
        ],
    ),
]


def _resolve_voice_profile_id(
    voice_profile_id: str | None,
    current_user: User,
    db: Session,
) -> uuid.UUID | None:
    if not voice_profile_id:
        return None

    try:
        voice_uuid = uuid.UUID(voice_profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="voice_profile_id 格式无效")

    voice_profile = (
        db.query(VoiceProfile)
        .filter(VoiceProfile.id == voice_uuid, VoiceProfile.creator_id == current_user.id)
        .first()
    )
    if not voice_profile:
        raise HTTPException(status_code=400, detail="音色不存在或无权使用")
    return voice_uuid


@router.get("/personality-templates", response_model=list[PersonalityTemplate])
def get_personality_templates():
    return PERSONALITY_TEMPLATES


@router.post("", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
def create_character(
    body: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.tags and len(body.tags) > 5:
        raise HTTPException(status_code=400, detail="标签最多5个")

    valid_genders = {"male", "female", "other"}
    if body.gender not in valid_genders:
        raise HTTPException(status_code=400, detail=f"性别必须是 {valid_genders} 之一")

    valid_types = {"girlfriend", "boyfriend", "friend", "custom"}
    if body.relationship_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"关系类型必须是 {valid_types} 之一")

    character = Character(
        name=body.name,
        gender=body.gender,
        relationship_type=body.relationship_type,
        description=body.description,
        personality=body.personality,
        backstory=body.backstory,
        greeting_message=body.greeting_message,
        system_prompt=body.system_prompt or "",
        tags=body.tags,
        avatar_url=body.avatar_url,
        cover_image_url=body.cover_image_url,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
        creator_id=current_user.id,
        status="draft",
    )
    resolved_voice_profile_id = _resolve_voice_profile_id(body.voice_profile_id, current_user, db)
    if resolved_voice_profile_id:
        character.voice_profile_id = resolved_voice_profile_id

    db.add(character)
    db.commit()
    db.refresh(character)
    return CharacterResponse.model_validate(character)


@router.get("", response_model=CharacterListResponse)
def list_characters(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Character).filter(Character.creator_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                Character.name.ilike(f"%{search}%"),
                Character.description.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    pages = math.ceil(total / page_size) if total > 0 else 1
    items = (
        query.order_by(Character.updated_at.desc())
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


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    if character.creator_id != current_user.id and not character.is_public:
        raise HTTPException(status_code=403, detail="无权访问此角色")

    return CharacterResponse.model_validate(character)


@router.put("/{character_id}", response_model=CharacterResponse)
def update_character(
    character_id: str,
    body: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    if character.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此角色")

    update_data = body.model_dump(exclude_unset=True)

    if "tags" in update_data and update_data["tags"] and len(update_data["tags"]) > 5:
        raise HTTPException(status_code=400, detail="标签最多5个")

    if "gender" in update_data:
        valid_genders = {"male", "female", "other"}
        if update_data["gender"] not in valid_genders:
            raise HTTPException(status_code=400, detail=f"性别必须是 {valid_genders} 之一")

    if "relationship_type" in update_data:
        valid_types = {"girlfriend", "boyfriend", "friend", "custom"}
        if update_data["relationship_type"] not in valid_types:
            raise HTTPException(status_code=400, detail=f"关系类型必须是 {valid_types} 之一")

    if "voice_profile_id" in update_data:
        character.voice_profile_id = _resolve_voice_profile_id(
            update_data["voice_profile_id"],
            current_user,
            db,
        )
        update_data.pop("voice_profile_id")

    for key, value in update_data.items():
        setattr(character, key, value)

    db.commit()
    db.refresh(character)
    return CharacterResponse.model_validate(character)


@router.delete("/{character_id}")
def delete_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    if character.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此角色")

    db.delete(character)
    db.commit()
    return {"message": "角色已删除"}


@router.post("/{character_id}/publish", response_model=CharacterResponse)
def toggle_publish(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    if character.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此角色")

    if character.status == "published":
        character.status = "draft"
        character.is_public = False
    else:
        character.status = "published"
        character.is_public = True

    db.commit()
    db.refresh(character)
    return CharacterResponse.model_validate(character)


@router.post("/{character_id}/clone", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
def clone_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original = db.query(Character).filter(Character.id == character_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="角色不存在")

    if not original.is_public and original.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权克隆此角色")

    clone = Character(
        name=original.name,
        gender=original.gender,
        relationship_type=original.relationship_type,
        description=original.description,
        personality=original.personality,
        backstory=original.backstory,
        greeting_message=original.greeting_message,
        system_prompt=original.system_prompt,
        tags=original.tags,
        avatar_url=original.avatar_url,
        cover_image_url=original.cover_image_url,
        temperature=original.temperature,
        max_tokens=original.max_tokens,
        creator_id=current_user.id,
        status="draft",
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return CharacterResponse.model_validate(clone)


@router.get("/{character_id}/stats")
def get_character_stats(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    return {
        "like_count": character.like_count,
        "chat_count": character.chat_count,
        "share_count": character.share_count,
        "conversation_count": character.conversation_count,
    }


@router.post("/{character_id}/like")
def like_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.character_id == character.id)
        .first()
    )
    if existing:
        return {"message": "已经点赞过了", "liked": True}

    fav = Favorite(user_id=current_user.id, character_id=character.id)
    db.add(fav)
    character.like_count = (character.like_count or 0) + 1
    db.commit()
    return {"message": "点赞成功", "liked": True}


@router.delete("/{character_id}/like")
def unlike_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.character_id == character.id)
        .first()
    )
    if not existing:
        return {"message": "尚未点赞", "liked": False}

    db.delete(existing)
    character.like_count = max((character.like_count or 0) - 1, 0)
    db.commit()
    return {"message": "已取消点赞", "liked": False}
