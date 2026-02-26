from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    PasswordChange,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)
from app.security import (
    create_tokens,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        nickname=body.nickname or body.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    tokens = create_tokens(str(user.id))
    return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    tokens = create_tokens(str(user.id))
    return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: TokenRefresh):
    user_id = decode_token(body.refresh_token, expected_type="refresh")
    tokens = create_tokens(user_id)
    return tokens


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/me/password")
def change_password(
    body: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="旧密码错误")
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "密码修改成功"}
