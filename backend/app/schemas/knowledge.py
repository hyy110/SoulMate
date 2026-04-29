from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    chunk_size: int = Field(default=500, ge=100, le=4000)
    chunk_overlap: int = Field(default=50, ge=0, le=1000)
    embedding_model: str = Field(default="simple-local")


class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    description: str | None
    creator_id: str
    document_count: int
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    metadata_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: str
    knowledge_base_id: str
    filename: str
    file_type: str
    file_size: int
    file_url: str
    chunk_count: int
    status: str
    metadata_json: dict[str, Any] | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeSearchResult(BaseModel):
    document_id: str
    filename: str
    chunk_index: int
    score: float
    content: str


class ReindexResponse(BaseModel):
    message: str
    indexed_documents: int
