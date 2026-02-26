"""Portable column types that work across SQLite and PostgreSQL."""

import json
import uuid

from sqlalchemy import String, TypeDecorator
from sqlalchemy.types import JSON


class GUID(TypeDecorator):
    """Platform-independent UUID type.
    Uses PostgreSQL's native UUID when available, otherwise stores as CHAR(32).
    """

    impl = String(32)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        return uuid.UUID(str(value)).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID

            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(32))


class JSONType(TypeDecorator):
    """Portable JSON type. Uses JSONB on PostgreSQL, JSON elsewhere."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import JSONB

            return dialect.type_descriptor(JSONB)
        return dialect.type_descriptor(JSON)
