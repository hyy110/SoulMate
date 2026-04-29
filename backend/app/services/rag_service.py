from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from app.models.knowledge_base import Document, KnowledgeBase


class RAGService:
    SUPPORTED_TYPES = {"txt", "md", "pdf", "docx"}

    def __init__(self) -> None:
        self.upload_root = Path(__file__).resolve().parents[2] / "uploads"

    def _resolve_local_path(self, file_url: str) -> Path:
        relative = file_url.removeprefix("/uploads/").replace("/", "\\")
        return self.upload_root / relative

    def _normalize_tokens(self, text: str) -> list[str]:
        return re.findall(r"[\u4e00-\u9fff]+|[a-zA-Z0-9_]+", text.lower())

    def _split_text(self, text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
        clean_text = re.sub(r"\s+", " ", text).strip()
        if not clean_text:
            return []

        chunks: list[str] = []
        start = 0
        step = max(chunk_size - chunk_overlap, 1)
        while start < len(clean_text):
            end = min(start + chunk_size, len(clean_text))
            chunks.append(clean_text[start:end])
            if end >= len(clean_text):
                break
            start += step
        return chunks

    def _extract_text(self, file_path: Path, file_type: str) -> str:
        if file_type in {"txt", "md"}:
            try:
                return file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                return file_path.read_text(encoding="gb18030")

        if file_type == "pdf":
            try:
                from pypdf import PdfReader
            except ImportError as exc:
                raise ValueError("解析 PDF 需要安装 pypdf") from exc

            reader = PdfReader(str(file_path))
            return "\n".join((page.extract_text() or "") for page in reader.pages)

        if file_type == "docx":
            try:
                import docx
            except ImportError as exc:
                raise ValueError("解析 DOCX 需要安装 python-docx") from exc

            document = docx.Document(str(file_path))
            return "\n".join(paragraph.text for paragraph in document.paragraphs)

        raise ValueError("不支持的文档类型")

    def index_document(self, doc: Document, kb: KnowledgeBase) -> int:
        file_path = self._resolve_local_path(doc.file_url)
        if not file_path.exists():
            raise ValueError("文档文件不存在")

        raw_text = self._extract_text(file_path, doc.file_type.lower())
        chunks = self._split_text(raw_text, kb.chunk_size, kb.chunk_overlap)
        tokenized_chunks = [self._normalize_tokens(c) for c in chunks]

        doc.metadata_json = {
            "raw_length": len(raw_text),
            "chunks": chunks,
            "tokenized_chunks": tokenized_chunks,
        }
        doc.chunk_count = len(chunks)
        doc.status = "indexed" if chunks else "error"
        return doc.chunk_count

    def search(self, kb: KnowledgeBase, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        query_tokens = set(self._normalize_tokens(query))
        if not query_tokens:
            return []

        results: list[dict[str, Any]] = []
        for doc in kb.documents:
            if doc.status != "indexed" or not doc.metadata_json:
                continue

            chunks = doc.metadata_json.get("chunks", [])
            tokenized_chunks = doc.metadata_json.get("tokenized_chunks", [])
            for idx, chunk_tokens in enumerate(tokenized_chunks):
                token_set = set(chunk_tokens)
                if not token_set:
                    continue
                overlap = query_tokens.intersection(token_set)
                if not overlap:
                    continue

                score = len(overlap) / max(len(query_tokens), 1)
                results.append(
                    {
                        "document_id": str(doc.id),
                        "filename": doc.filename,
                        "chunk_index": idx,
                        "score": round(score, 4),
                        "content": chunks[idx][:1000],
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]


rag_service = RAGService()
