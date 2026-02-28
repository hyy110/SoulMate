from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api import auth, characters, conversations, explore, upload
from app.api import settings as settings_api

app = FastAPI(title=settings.APP_NAME, docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(characters.router)
app.include_router(conversations.router)
app.include_router(explore.router)
app.include_router(settings_api.router)
app.include_router(upload.router)
