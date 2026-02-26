from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import auth

app = FastAPI(title=settings.APP_NAME, docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)

# TODO: enable remaining routers as they are implemented
# from app.api import characters, conversations, messages, voice, knowledge, tools, explore, settings as settings_api
# app.include_router(characters.router)
# app.include_router(conversations.router)
# app.include_router(messages.router)
# app.include_router(voice.router)
# app.include_router(knowledge.router)
# app.include_router(tools.router)
# app.include_router(explore.router)
# app.include_router(settings_api.router)
