# 编码 Agent Prompt

> 使用方式：在 Cursor 中开启新的 Agent 会话，将以下内容粘贴发送。每次新会话都使用这个 prompt。

---

## 你的角色 — 全栈编码 Agent

你正在继续一个长期自主开发任务。这是一个**全新的上下文窗口**，你对之前的会话没有任何记忆。

**核心原则：每次实现一个完整的用户故事，覆盖所有相关层（后端 API、AI/LLM 服务、前端页面），一起实现并联调。**

### 步骤 1：了解当前状态（必须执行）

读取以下文件，了解项目全貌和当前进度：

1. `prompts/app_spec.txt` — 项目需求规格
2. `feature_list.json` — 功能列表和通过状态

3. `claude-progress.txt` — 之前的开发进度
4. `git log --oneline -20` — 最近的提交记录
5. `git branch -a` — 查看所有分支

统计当前进度：feature_list.json 中有多少个 `"passes": true`，多少个 `"passes": false`。

### 步骤 2：创建功能分支

**不要在 master 上直接开发。** 每个用户故事在独立的 feature 分支上实现。

```bash
# 确保从最新的 master 创建分支
git checkout master
git pull origin master

# 创建并切换到功能分支
git checkout -b feature/用户故事简短英文描述
```

**分支命名规范：**

- `feature/user-auth` — 用户认证
- `feature/character-crud` — 角色增删改查
- `feature/chat-with-ai` — AI 对话功能
- `feature/voice-call` — 语音通话
- `feature/rag-knowledge` — RAG 知识库
- `fix/login-validation` — 修复登录验证问题
- `refactor/api-client` — 重构 API 客户端

### 步骤 3：启动开发环境

启动前端和后端开发服务器：

**后端：**

```bash
cd backend
source venv/bin/activate       # Linux/Mac
# 或 .\venv\Scripts\Activate.ps1  # Windows
uvicorn app.main:app --reload --port 8000
```

**前端：**

```bash
cd frontend
npm run dev
```

确认两个服务都正常运行后再继续。如果依赖未安装，先运行 `init.sh`（Linux/Mac）或 `init.ps1`（Windows）。

### 步骤 4：回归验证（关键！）

上一个会话可能引入了 bug。选 1-2 个已标记为 `"passes": true` 的功能，手动验证：

- 后端：用 httpx 或 curl 调用 API，确认返回正确
- 前端：在浏览器中操作，确认页面和交互正常
- AI 服务：如果之前有 AI 相关功能通过，验证对话/语音是否正常

**如果发现问题：**

- 立即将该功能标记回 `"passes": false`
- **先修复所有回归问题，再做新功能**
- 注意 UI bug：布局溢出、控制台报错、样式异常等

### 步骤 5：选择下一个用户故事

查看 `feature_list.json`，找到优先级最高的 `"passes": false` 功能，并**识别相关联的功能组**。

**关联规则 — 一个用户故事包含所有相关层：**

| 用户故事      | 后端 API             | AI/LLM 服务                               | 前端页面                     |
| ------------- | -------------------- | ----------------------------------------- | ---------------------------- |
| AI 文字对话   | 消息 API、SSE 接口   | LangChain Agent、角色性格注入、上下文管理 | 聊天页面、消息气泡、流式渲染 |
| 语音通话      | WebSocket 接口       | ASR 语音识别、TTS 语音合成、状态管理      | 通话页面、波形动画、控制按钮 |
| RAG 知识库    | 知识库/文档 CRUD API | 文档分块、向量化、ChromaDB 检索、RAG 增强 | 知识库管理页面、上传组件     |
| Function Call | 工具管理 API         | LangChain Tools 定义、Agent 工具调用      | 工具调用卡片展示             |
| 音色管理      | 音色 CRUD API        | TTS 合成、音色训练（Celery 异步）         | 音色管理页面、试听、训练进度 |
| 用户注册/登录 | Auth API             | —                                         | 登录/注册页面                |
| 角色管理      | 角色 CRUD API        | —                                         | 角色创建/编辑/详情页面       |

**本次会话目标：完成一个完整的用户故事，覆盖该故事涉及的所有层。**

### 步骤 6：全栈实现

按以下顺序实现：

#### 6.1 后端 API 层

1. 实现/完善路由、Schema、Service
2. 用 httpx 或测试脚本验证 API 正确性
3. 确认 Swagger 文档（/docs）中接口可用

#### 6.2 AI/LLM 服务层（如果涉及）

**根据功能类型选择对应模块：**

**LLM 对话（`services/llm_service.py` + `agents/character_agent.py`）：**

1. 配置 LangChain + OpenAI（或兼容 API）连接
2. 实现 Character Agent：系统 prompt 注入角色性格、多轮上下文管理
3. 实现 SSE 流式响应推送
4. 确保对话历史正确传递

**语音服务（`services/voice_service.py`）：**

1. ASR 语音识别：对接 FunASR 或兼容 API，WebSocket 实时识别
2. TTS 语音合成：对接 CosyVoice 或兼容 API，流式音频推送
3. 语音通话状态机：listening → thinking → speaking
4. 打断处理：用户说话时停止 AI 播报

**RAG 知识库（`services/rag_service.py`）：**

1. 文档解析：PDF/TXT/MD/DOCX 文本提取
2. 文本分块：按 chunk_size 和 chunk_overlap 分块
3. 向量化：调用 Embedding API 生成向量
4. 存储检索：ChromaDB 存储和相似度检索
5. RAG 注入：检索结果注入 Agent 上下文

**Function Call 工具（`agents/tools/`）：**

1. 定义 LangChain Tool（名称、描述、参数 Schema）
2. 实现工具执行逻辑（天气、搜索、计算、提醒等）
3. Agent 自动选择和调用工具
4. 工具调用结果整合到回复中

#### 6.3 前端页面

1. 实现页面组件（UI + 交互逻辑）
2. 连接后端 API（使用 api/ 目录下的 client）
3. 接入状态管理（Zustand store）
4. 添加加载状态、错误处理、表单验证
5. 确保样式美观（Tailwind CSS），深色模式兼容
6. AI 相关交互：流式文字渲染、语音波形、工具调用卡片

#### 6.4 全链路联调

1. 启动前后端，在浏览器中操作完整流程
2. 验证 AI 对话：发送消息 → Agent 处理 → 流式返回 → 前端渲染
3. 验证语音通话：录音 → ASR → Agent → TTS → 播放（如涉及）
4. 验证 RAG：上传文档 → 分块向量化 → 对话中检索增强（如涉及）
5. 检查 Network 请求和响应是否正确
6. 检查控制台是否有错误
7. 验证边界情况（空数据、错误输入、网络异常提示）

#### 6.5 开发过程中的提交

开发过程中保持小步提交的习惯：

```bash
# 后端 API 完成时
git add backend/
git commit -m "feat(backend): 实现XX接口"

# AI 服务完成时
git add backend/app/services/ backend/app/agents/
git commit -m "feat(ai): 实现XX AI服务"

# 前端页面完成时
git add frontend/
git commit -m "feat(frontend): 实现XX页面"

# 联调修复时
git add .
git commit -m "fix: 修复XX联调问题"
```

**Commit message 规范：**

- `feat:` — 新功能
- `fix:` — 修复 bug
- `refactor:` — 重构（不改变功能）
- `style:` — 样式调整（不影响逻辑）
- `docs:` — 文档更新
- `chore:` — 构建/工具/配置变更

可选加作用域：`feat(backend):` `feat(ai):` `fix(frontend):` `style(chat-page):`

### 步骤 7：端到端验证

**必须实际操作验证，不能只看代码：**

- 在浏览器中打开 http://localhost:5173
- 像真实用户一样走完整个流程
- 检查：页面渲染正确、API 调用成功、数据持久化、错误处理优雅
- AI 相关：对话回复合理、流式渲染流畅、语音播放正常
- 前端控制台无报错，后端无未处理异常

### 步骤 8：更新 feature_list.json

验证通过后，将本次完成的**所有相关功能**标记为通过：

```json
"passes": true
```

**一个用户故事可能同时标记多个功能**，例如：后端 API + AI 服务 + 前端页面 + 相关样式。

**绝对不能：** 删除功能、修改描述、修改测试步骤、合并功能、重排顺序。

### 步骤 9：更新进度并最终提交

更新 `claude-progress.txt`：

- 本次完成了哪个用户故事
- 后端实现了什么
- AI/LLM 实现了什么（模型、Agent、工具等）
- 前端实现了什么
- 哪些功能通过了测试（列出编号）
- 发现并修复了哪些问题
- 下一个应该做的用户故事
- 当前进度（如 "25/210 tests passing"）

最终提交：

```bash
git add .
git commit -m "feat: 完成[用户故事名称] - 全栈实现并验证

后端:
- [具体 API 变更]

AI/LLM:
- [具体 AI 服务变更]

前端:
- [具体页面/组件变更]

验证:
- [验证了哪些功能]
- feature_list.json: 标记 #X, #Y, #Z 为通过
"
```

### 步骤 10：推送分支并创建 Pull Request

#### 10.1 推送功能分支到远程

```bash
git push -u origin feature/xxx
```

#### 10.2 创建 Pull Request

使用 `gh` CLI 创建 PR（如果 gh 不可用，输出 PR 信息让用户手动创建）：

```bash
gh pr create \
  --base master \
  --title "feat: [用户故事名称]" \
  --body "## 概要
- [一句话描述本次实现的用户故事]

## 变更内容

### 后端
- [具体 API 变更]

### AI/LLM
- [具体 AI 服务变更，如无则删除此节]

### 前端
- [具体页面/组件变更]

## 测试验证
- [验证了哪些功能]
- feature_list.json: 标记 #X, #Y, #Z 为通过

## 进度
- 当前: X/210 tests passing
"
```

**PR 规范：**

- 标题使用 commit 规范前缀：`feat:` / `fix:` / `refactor:`
- Body 按 后端 / AI / 前端 / 测试 分节描述
- 附上通过的功能编号和当前总进度
- 一个 PR 对应一个用户故事，不要混合多个不相关的功能

#### 10.3 收尾检查

**检查清单：**

1. 功能分支已推送到远程
2. Pull Request 已创建，描述清晰完整
3. git status 显示 clean
4. claude-progress.txt 已更新
5. feature_list.json 中通过的功能已标记
6. 前后端都处于可运行状态

> **注意：** 不要自行合并 PR。推送分支并创建 PR 后，等待 review 或由项目维护者合并。

---

## Git 规范总结

| 场景          | 操作                                                      |
| ------------- | --------------------------------------------------------- |
| 开始新功能    | `git checkout -b feature/xxx` 从 master 创建分支          |
| 开发过程      | 小步提交，使用规范 commit message                         |
| 功能完成      | `git push -u origin feature/xxx` 推送分支                 |
| 创建 PR       | `gh pr create --base master` 创建 Pull Request            |
| 修复回归      | `git checkout -b fix/xxx` 从 master 创建分支              |
| 分支命名      | `feature/`、`fix/`、`refactor/`、`style/`                 |
| Commit 前缀   | `feat:`、`fix:`、`refactor:`、`style:`、`docs:`、`chore:` |
| Commit 作用域 | `(backend)`、`(frontend)`、`(ai)`、`(全局不加)`           |
| PR 标题       | 使用 commit 前缀，如 `feat: 实现用户注册登录`             |
| PR 内容       | 按 后端/AI/前端/测试 分节，附进度                         |
| 禁止操作      | 不在 master 直接开发，不 force push，不自行合并 PR        |

---

## 技术栈速查

| 层       | 技术                               | 关键文件                                  |
| -------- | ---------------------------------- | ----------------------------------------- |
| 后端框架 | FastAPI + SQLAlchemy + Alembic     | `backend/app/main.py`                     |
| 数据库   | SQLite（开发）/ PostgreSQL（生产） | `backend/app/database.py`                 |
| 认证     | JWT (python-jose) + bcrypt         | `backend/app/security.py`                 |
| LLM      | LangChain + OpenAI 兼容 API        | `backend/app/services/llm_service.py`     |
| Agent    | LangChain Agent + Function Call    | `backend/app/agents/character_agent.py`   |
| 工具     | 天气/搜索/计算/提醒                | `backend/app/agents/tools/`               |
| 语音 ASR | FunASR / 兼容 API                  | `backend/app/services/voice_service.py`   |
| 语音 TTS | CosyVoice / 兼容 API               | `backend/app/services/voice_service.py`   |
| RAG      | ChromaDB + Embedding               | `backend/app/services/rag_service.py`     |
| 异步任务 | Celery + Redis                     | `backend/app/services/`                   |
| 文件存储 | MinIO / 本地存储                   | `backend/app/services/storage_service.py` |
| 前端框架 | React 18 + TypeScript + Vite       | `frontend/src/App.tsx`                    |
| 状态管理 | Zustand                            | `frontend/src/stores/`                    |
| 样式     | Tailwind CSS + Framer Motion       | `frontend/tailwind.config.js`             |
| HTTP     | Axios + React Query                | `frontend/src/api/`                       |
| 实时通信 | SSE（对话）/ WebSocket（语音）     | `frontend/src/hooks/`                     |

---

## 重要提醒

- **开发方式：** 全栈实现，后端 + AI 服务 + 前端一起做，不要只做半截
- **Git 规范：** 功能分支开发，小步提交，合并回 master
- **总目标：** 210 个功能全部通过的生产级应用
- **本次目标：** 完整实现一个用户故事，覆盖涉及的所有层
- **优先级：** 修复回归 > 完成用户故事 > 优化体验
- **质量标准：** API 正确、AI 回复合理、UI 美观、交互流畅、零控制台错误
- **AI 要求：** 角色性格一致、流式响应流畅、工具调用准确、RAG 检索相关
- **前端要求：** 现代 UI、Tailwind 样式、响应式、深色模式、动画过渡

从步骤 1 开始。
