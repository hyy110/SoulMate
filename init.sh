#!/bin/bash
set -e

echo "============================================"
echo "  SoulMate - 虚拟伙伴创作分享平台"
echo "  环境初始化脚本"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}[ERROR] $1 未安装，请先安装 $1${NC}"
        return 1
    fi
    echo -e "${GREEN}[OK] $1 已安装${NC}"
    return 0
}

echo ">>> 检查系统依赖..."
check_command "node"
check_command "npm"
check_command "git"

PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}[ERROR] Python 未安装，请先安装 Python 3.11+${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Python: $($PYTHON_CMD --version)${NC}"

echo ""
echo ">>> 设置后端环境..."
cd backend

if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    $PYTHON_CMD -m venv venv
fi

echo "激活虚拟环境..."
source venv/bin/activate

echo "安装 Python 依赖..."
pip install -r requirements.txt --quiet

if [ ! -f ".env" ]; then
    echo "创建 .env 配置文件（请根据实际情况修改）..."
    cp .env.example .env 2>/dev/null || cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soulmate
REDIS_URL=redis://localhost:6379/0
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL_NAME=gpt-4o
COSYVOICE_API_URL=http://localhost:9880
FUNASR_API_URL=ws://localhost:10095
MINIO_ENDPOINT=localhost:9000
JWT_SECRET=your-jwt-secret-change-in-production
CELERY_BROKER_URL=redis://localhost:6379/1
ENVEOF
    echo -e "${YELLOW}[WARN] 已创建 .env 文件，请修改其中的 API Key 等配置${NC}"
fi

cd ..

echo ""
echo ">>> 设置前端环境..."
cd frontend

echo "安装 Node.js 依赖..."
npm install --silent

cd ..

echo ""
echo "============================================"
echo -e "${GREEN}  环境初始化完成！${NC}"
echo "============================================"
echo ""
echo "启动方式："
echo "  后端: cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "  前端: cd frontend && npm run dev"
echo ""
echo "访问地址："
echo "  前端: http://localhost:5173"
echo "  后端 API: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}提醒: 请确保 PostgreSQL 和 Redis 已启动，并修改 backend/.env 中的配置${NC}"
