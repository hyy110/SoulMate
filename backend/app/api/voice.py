import io
import math
import struct
import uuid
import wave
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.character import Character
from app.models.user import User
from app.models.voice_profile import VoiceProfile
from app.schemas.voice import VoicePreviewRequest, VoiceResponse, VoiceTrainStatusResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/voices", tags=["voices"])

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".webm", ".ogg"}
MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024

PRESET_VOICES: list[dict] = [
    {
        "id": "preset-zh-female-soft",
        "name": "晓雪（中文女声）",
        "language": "zh",
        "provider": "preset",
        "voice_type": "preset",
    },
    {
        "id": "preset-zh-male-warm",
        "name": "晨宇（中文男声）",
        "language": "zh",
        "provider": "preset",
        "voice_type": "preset",
    },
    {
        "id": "preset-en-female-clear",
        "name": "Ava（English Female）",
        "language": "en",
        "provider": "preset",
        "voice_type": "preset",
    },
    {
        "id": "preset-en-male-deep",
        "name": "Leo（English Male）",
        "language": "en",
        "provider": "preset",
        "voice_type": "preset",
    },
]


def _voice_to_response(voice: VoiceProfile) -> VoiceResponse:
    return VoiceResponse(
        id=str(voice.id),
        name=voice.name,
        language=voice.language,
        provider=voice.provider,
        voice_type=voice.voice_type,
        status=voice.status,
        training_progress=voice.training_progress,
        estimated_time=voice.estimated_time,
        reference_audio_url=voice.sample_audio_url,
        created_at=voice.created_at,
        is_preset=False,
    )


def _preset_to_response(item: dict) -> VoiceResponse:
    return VoiceResponse(
        id=item["id"],
        name=item["name"],
        language=item["language"],
        provider=item["provider"],
        voice_type=item["voice_type"],
        status="ready",
        training_progress=1.0,
        estimated_time=None,
        reference_audio_url=None,
        created_at=None,
        is_preset=True,
    )


def _is_preset_voice(voice_id: str) -> bool:
    return any(v["id"] == voice_id for v in PRESET_VOICES)


def _get_custom_voice_or_404(voice_id: str, current_user: User, db: Session) -> VoiceProfile:
    try:
        voice_uuid = uuid.UUID(voice_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="音色不存在")

    voice = (
        db.query(VoiceProfile)
        .filter(VoiceProfile.id == voice_uuid, VoiceProfile.creator_id == current_user.id)
        .first()
    )
    if not voice:
        raise HTTPException(status_code=404, detail="音色不存在")
    return voice


def _build_preview_wav(text: str) -> bytes:
    sample_rate = 16000
    duration_seconds = max(0.8, min(2.5, len(text) * 0.08))
    frame_count = int(sample_rate * duration_seconds)
    frequency = 440.0
    amplitude = 12000

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        frames = bytearray()
        for idx in range(frame_count):
            value = int(amplitude * math.sin(2.0 * math.pi * frequency * (idx / sample_rate)))
            frames.extend(struct.pack("<h", value))
        wav_file.writeframes(bytes(frames))
    buffer.seek(0)
    return buffer.read()


@router.get("", response_model=list[VoiceResponse])
def list_voices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    custom_voices = (
        db.query(VoiceProfile)
        .filter(VoiceProfile.creator_id == current_user.id)
        .order_by(VoiceProfile.created_at.desc())
        .all()
    )
    preset_items = [_preset_to_response(item) for item in PRESET_VOICES]
    return [*preset_items, *[_voice_to_response(voice) for voice in custom_voices]]


@router.get("/presets", response_model=list[VoiceResponse])
def list_preset_voices():
    return [_preset_to_response(item) for item in PRESET_VOICES]


@router.post("", response_model=VoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_voice(
    name: str = Form(...),
    language: str = Form("zh"),
    clone_mode: str = Form("zeroshot"),
    reference_audio: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mode = clone_mode.lower().strip()
    if mode not in {"zeroshot", "training"}:
        raise HTTPException(status_code=400, detail="clone_mode 仅支持 zeroshot 或 training")

    sample_audio_url: str | None = None
    if reference_audio and reference_audio.filename:
        suffix = Path(reference_audio.filename).suffix.lower()
        if suffix not in ALLOWED_AUDIO_EXTENSIONS:
            raise HTTPException(status_code=400, detail="仅支持 mp3/wav/m4a 音频文件")

        content = await reference_audio.read()
        if len(content) > MAX_AUDIO_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="音频文件过大（最大 20MB）")

        uploads_root = Path(__file__).resolve().parents[2] / "uploads" / "voices"
        uploads_root.mkdir(parents=True, exist_ok=True)
        file_name = f"{uuid.uuid4().hex}{suffix}"
        file_path = uploads_root / file_name
        file_path.write_bytes(content)
        sample_audio_url = f"/uploads/voices/{file_name}"

    voice = VoiceProfile(
        name=name.strip(),
        description=None,
        provider="custom",
        voice_id=f"custom-{uuid.uuid4().hex[:10]}",
        language=language.strip() or "zh",
        speed=1.0,
        pitch=1.0,
        voice_type="cloned_zeroshot" if mode == "zeroshot" else "cloned_trained",
        status="ready" if mode == "zeroshot" else "pending",
        training_progress=1.0 if mode == "zeroshot" else 0.0,
        estimated_time=None if mode == "zeroshot" else 300,
        settings_json={"clone_mode": mode},
        sample_audio_url=sample_audio_url,
        creator_id=current_user.id,
    )
    db.add(voice)
    db.commit()
    db.refresh(voice)
    return _voice_to_response(voice)


@router.get("/{voice_id}", response_model=VoiceResponse)
def get_voice(
    voice_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if _is_preset_voice(voice_id):
        preset = next(item for item in PRESET_VOICES if item["id"] == voice_id)
        return _preset_to_response(preset)
    return _voice_to_response(_get_custom_voice_or_404(voice_id, current_user, db))


@router.delete("/{voice_id}")
def delete_voice(
    voice_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if _is_preset_voice(voice_id):
        raise HTTPException(status_code=400, detail="预设音色不支持删除")

    voice = _get_custom_voice_or_404(voice_id, current_user, db)
    db.query(Character).filter(Character.voice_profile_id == voice.id).update(
        {Character.voice_profile_id: None},
        synchronize_session=False,
    )
    db.delete(voice)
    db.commit()
    return {"message": "音色已删除"}


@router.post("/{voice_id}/train", status_code=status.HTTP_202_ACCEPTED)
def start_voice_training(
    voice_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if _is_preset_voice(voice_id):
        raise HTTPException(status_code=400, detail="预设音色不需要训练")

    voice = _get_custom_voice_or_404(voice_id, current_user, db)
    voice.status = "training"
    voice.training_progress = max(voice.training_progress or 0.0, 0.05)
    voice.estimated_time = 300
    db.commit()
    return {"message": "训练任务已启动", "voice_id": str(voice.id)}


@router.get("/{voice_id}/train/status", response_model=VoiceTrainStatusResponse)
def get_voice_training_status(
    voice_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if _is_preset_voice(voice_id):
        raise HTTPException(status_code=400, detail="预设音色无训练状态")

    voice = _get_custom_voice_or_404(voice_id, current_user, db)

    if voice.status in {"pending", "training"} and voice.training_progress < 1.0:
        voice.status = "training"
        voice.training_progress = min(1.0, (voice.training_progress or 0.0) + 0.25)
        if voice.training_progress >= 1.0:
            voice.status = "ready"
            voice.training_progress = 1.0
            voice.estimated_time = None
        else:
            voice.estimated_time = int((1.0 - voice.training_progress) * 300)
        voice.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(voice)

    if voice.status == "ready":
        voice.estimated_time = None

    return VoiceTrainStatusResponse(
        voice_id=voice.id,
        status=voice.status,
        progress=voice.training_progress,
        estimated_time=voice.estimated_time,
    )


@router.post("/preview")
def preview_voice(
    body: VoicePreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    voice_id = body.voice_id.strip()
    if not _is_preset_voice(voice_id):
        _get_custom_voice_or_404(voice_id, current_user, db)

    wav_bytes = _build_preview_wav(body.text)
    return StreamingResponse(io.BytesIO(wav_bytes), media_type="audio/wav")
