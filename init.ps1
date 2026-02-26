Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SoulMate - 虚拟伙伴创作分享平台" -ForegroundColor Cyan
Write-Host "  环境初始化脚本 (Windows)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

function Check-Command {
    param([string]$Name)
    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        Write-Host "[OK] $Name 已安装" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[ERROR] $Name 未安装，请先安装 $Name" -ForegroundColor Red
        return $false
    }
}

Write-Host ">>> 检查系统依赖..." -ForegroundColor Yellow
Check-Command "node"
Check-Command "npm"
Check-Command "git"

$pythonCmd = $null
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
    $ver = & python --version 2>&1
    Write-Host "[OK] Python: $ver" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Python 未安装，请先安装 Python 3.11+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ">>> 设置后端环境..." -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "创建 Python 虚拟环境..."
    & $pythonCmd -m venv venv
}

Write-Host "激活虚拟环境..."
& .\venv\Scripts\Activate.ps1

Write-Host "安装 Python 依赖..."
pip install -r requirements.txt --quiet

if (-not (Test-Path ".env")) {
    Write-Host "创建 .env 配置文件（请根据实际情况修改）..." -ForegroundColor Yellow
    @"
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
"@ | Out-File -Encoding utf8 .env
    Write-Host "[WARN] 已创建 .env 文件，请修改其中的 API Key 等配置" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host ">>> 设置前端环境..." -ForegroundColor Yellow
Push-Location frontend

Write-Host "安装 Node.js 依赖..."
npm install --silent

Pop-Location

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  环境初始化完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "启动方式："
Write-Host "  后端: cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
Write-Host "  前端: cd frontend; npm run dev"
Write-Host ""
Write-Host "访问地址："
Write-Host "  前端: http://localhost:5173"
Write-Host "  后端 API: http://localhost:8000"
Write-Host "  API 文档: http://localhost:8000/docs"
Write-Host ""
Write-Host "提醒: 请确保 PostgreSQL 和 Redis 已启动，并修改 backend\.env 中的配置" -ForegroundColor Yellow
