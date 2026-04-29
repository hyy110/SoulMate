import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.character import Character
from app.models.knowledge_base import Document, KnowledgeBase
from app.models.user import User
from app.schemas.knowledge import (
    DocumentResponse,
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeSearchResult,
    ReindexResponse,
)
from app.security import get_current_user
from app.services.rag_service import RAGService, rag_service

router = APIRouter(tags=["knowledge"])

KNOWLEDGE_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "knowledge"
MAX_DOC_SIZE = 20 * 1024 * 1024


def _get_character_or_404(character_id: str, db: Session) -> Character:
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")
    return character


def _get_kb_or_404(kb_id: str, db: Session) -> KnowledgeBase:
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return kb


def _ensure_owner(owner_id: uuid.UUID, current_user: User) -> None:
    if owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作")


def _save_uploaded_file(file: UploadFile, user_id: uuid.UUID) -> tuple[str, int, str]:
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    if ext not in RAGService.SUPPORTED_TYPES:
        raise HTTPException(status_code=400, detail="仅支持 PDF/TXT/MD/DOCX")

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="文件为空")
    if len(data) > MAX_DOC_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过20MB")

    KNOWLEDGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{user_id}_{uuid.uuid4().hex[:10]}_{Path(file.filename or 'doc').name}"
    local_path = KNOWLEDGE_UPLOAD_DIR / filename
    local_path.write_bytes(data)

    return f"/uploads/knowledge/{filename}", len(data), ext


@router.post(
    "/api/characters/{character_id}/knowledge-base",
    response_model=KnowledgeBaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_knowledge_base(
    character_id: str,
    body: KnowledgeBaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = _get_character_or_404(character_id, db)
    _ensure_owner(character.creator_id, current_user)

    if character.knowledge_base_id:
        existing = db.query(KnowledgeBase).filter(KnowledgeBase.id == character.knowledge_base_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="该角色已绑定知识库")

    kb = KnowledgeBase(
        name=body.name,
        description=body.description,
        creator_id=current_user.id,
        chunk_size=body.chunk_size,
        chunk_overlap=body.chunk_overlap,
        embedding_model=body.embedding_model,
    )
    db.add(kb)
    db.flush()
    character.knowledge_base_id = kb.id
    db.commit()
    db.refresh(kb)
    return KnowledgeBaseResponse.model_validate(kb)


@router.get("/api/characters/{character_id}/knowledge-base", response_model=KnowledgeBaseResponse)
def get_character_knowledge_base(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = _get_character_or_404(character_id, db)
    if character.creator_id != current_user.id and not character.is_public:
        raise HTTPException(status_code=403, detail="无权访问")
    if not character.knowledge_base_id:
        raise HTTPException(status_code=404, detail="该角色尚未创建知识库")

    kb = _get_kb_or_404(str(character.knowledge_base_id), db)
    return KnowledgeBaseResponse.model_validate(kb)


@router.delete("/api/characters/{character_id}/knowledge-base")
def delete_character_knowledge_base(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    character = _get_character_or_404(character_id, db)
    _ensure_owner(character.creator_id, current_user)
    if not character.knowledge_base_id:
        raise HTTPException(status_code=404, detail="该角色尚未创建知识库")

    kb = _get_kb_or_404(str(character.knowledge_base_id), db)
    character.knowledge_base_id = None
    db.delete(kb)
    db.commit()
    return {"message": "知识库已删除"}


@router.get("/api/knowledge-bases/{knowledge_base_id}/documents", response_model=list[DocumentResponse])
def list_documents(
    knowledge_base_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = _get_kb_or_404(knowledge_base_id, db)
    _ensure_owner(kb.creator_id, current_user)
    docs = (
        db.query(Document)
        .filter(Document.knowledge_base_id == kb.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [DocumentResponse.model_validate(d) for d in docs]


@router.post(
    "/api/knowledge-bases/{knowledge_base_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    knowledge_base_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = _get_kb_or_404(knowledge_base_id, db)
    _ensure_owner(kb.creator_id, current_user)

    file_url, file_size, file_type = _save_uploaded_file(file, current_user.id)
    doc = Document(
        knowledge_base_id=kb.id,
        filename=file.filename or "document",
        file_type=file_type,
        file_size=file_size,
        file_url=file_url,
        status="pending",
        chunk_count=0,
    )
    db.add(doc)
    db.flush()

    try:
        rag_service.index_document(doc, kb)
    except ValueError as exc:
        doc.status = "error"
        doc.metadata_json = {"error": str(exc)}

    kb.document_count = (
        db.query(Document).filter(Document.knowledge_base_id == kb.id).count()
    )
    db.commit()
    db.refresh(doc)
    return DocumentResponse.model_validate(doc)


@router.delete("/api/knowledge-bases/{knowledge_base_id}/documents/{document_id}")
def delete_document(
    knowledge_base_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = _get_kb_or_404(knowledge_base_id, db)
    _ensure_owner(kb.creator_id, current_user)

    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.knowledge_base_id == kb.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    local_path = rag_service._resolve_local_path(doc.file_url)
    if local_path.exists():
        local_path.unlink(missing_ok=True)

    db.delete(doc)
    kb.document_count = max((kb.document_count or 1) - 1, 0)
    db.commit()
    return {"message": "文档已删除"}


@router.post("/api/knowledge-bases/{knowledge_base_id}/reindex", response_model=ReindexResponse)
def reindex_knowledge_base(
    knowledge_base_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = _get_kb_or_404(knowledge_base_id, db)
    _ensure_owner(kb.creator_id, current_user)

    indexed = 0
    docs = db.query(Document).filter(Document.knowledge_base_id == kb.id).all()
    for doc in docs:
        try:
            rag_service.index_document(doc, kb)
            indexed += 1
        except ValueError as exc:
            doc.status = "error"
            doc.metadata_json = {"error": str(exc)}

    db.commit()
    return ReindexResponse(message="重建完成", indexed_documents=indexed)


@router.get(
    "/api/knowledge-bases/{knowledge_base_id}/search",
    response_model=list[KnowledgeSearchResult],
)
def search_knowledge(
    knowledge_base_id: str,
    q: str = Query(..., min_length=1),
    top_k: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = _get_kb_or_404(knowledge_base_id, db)
    _ensure_owner(kb.creator_id, current_user)

    results = rag_service.search(kb, q, top_k=top_k)
    return [KnowledgeSearchResult.model_validate(r) for r in results]
