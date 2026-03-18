import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.character import Character
from app.models.tool import Tool
from app.models.user import User
from app.security import get_current_user

router = APIRouter(prefix="/api/tools", tags=["tools"])

BUILTIN_TOOLS = [
    {
        "id": "builtin-weather",
        "name": "查询天气",
        "description": "查询指定城市的当前天气信息，包括温度、湿度、天气状况等",
        "tool_type": "builtin",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称，如 '北京'、'上海'"},
            },
            "required": ["city"],
        },
    },
    {
        "id": "builtin-calculator",
        "name": "计算器",
        "description": "执行数学计算，支持加减乘除、幂运算等",
        "tool_type": "builtin",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "数学表达式，如 '123 * 456'"},
            },
            "required": ["expression"],
        },
    },
    {
        "id": "builtin-datetime",
        "name": "日期时间查询",
        "description": "查询当前日期和时间信息",
        "tool_type": "builtin",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {"type": "string", "description": "时区，默认 Asia/Shanghai", "default": "Asia/Shanghai"},
            },
        },
    },
    {
        "id": "builtin-search",
        "name": "网络搜索",
        "description": "搜索互联网获取最新信息",
        "tool_type": "builtin",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索关键词"},
            },
            "required": ["query"],
        },
    },
    {
        "id": "builtin-reminder",
        "name": "设置提醒",
        "description": "为用户设置提醒事项",
        "tool_type": "builtin",
        "parameters": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "提醒内容"},
                "time": {"type": "string", "description": "提醒时间，如 '10分钟后'、'明天上午9点'"},
            },
            "required": ["message", "time"],
        },
    },
    {
        "id": "builtin-random",
        "name": "随机数/抽签",
        "description": "生成随机数或进行抽签选择",
        "tool_type": "builtin",
        "parameters": {
            "type": "object",
            "properties": {
                "min": {"type": "integer", "description": "最小值", "default": 1},
                "max": {"type": "integer", "description": "最大值", "default": 100},
                "choices": {"type": "array", "items": {"type": "string"}, "description": "抽签选项列表"},
            },
        },
    },
]


class ToolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    parameters: dict | None = None
    webhook_url: str | None = None


class ToolResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    tool_type: str
    parameters: dict | None = None
    is_enabled: bool = True

    model_config = {"from_attributes": True}


class ToolBindRequest(BaseModel):
    tool_ids: list[str] = Field(default_factory=list)


def _tool_to_response(tool: Tool) -> dict:
    return {
        "id": str(tool.id),
        "name": tool.name,
        "description": tool.description,
        "tool_type": tool.tool_type,
        "parameters": tool.config_json,
        "is_enabled": tool.is_enabled,
    }


@router.get("/builtin")
def get_builtin_tools():
    return BUILTIN_TOOLS


@router.post("", status_code=status.HTTP_201_CREATED)
def create_custom_tool(
    body: ToolCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tool = Tool(
        name=body.name,
        description=body.description,
        tool_type="custom",
        config_json={
            "parameters": body.parameters,
            "webhook_url": body.webhook_url,
        },
        is_enabled=True,
        character_id=None,
        creator_id=current_user.id,
    )
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return _tool_to_response(tool)


@router.get("/{tool_id}")
def get_tool(
    tool_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if tool_id.startswith("builtin-"):
        for bt in BUILTIN_TOOLS:
            if bt["id"] == tool_id:
                return bt
        raise HTTPException(status_code=404, detail="工具不存在")

    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    return _tool_to_response(tool)


@router.delete("/{tool_id}")
def delete_tool(
    tool_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if tool_id.startswith("builtin-"):
        raise HTTPException(status_code=400, detail="不能删除内置工具")

    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    db.delete(tool)
    db.commit()
    return {"message": "工具已删除"}
