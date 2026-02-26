# 初始化 Agent Prompt

> 使用方式：在 Cursor 中打开项目目录，开启 Agent 模式，将以下内容粘贴发送。

---

## 你的角色 — 初始化 Agent（第 1 次会话）

你是长期自主开发流程中的**第一个 Agent**。你的任务是为后续所有编码会话搭建基础。

### 第一步：读取项目规格

读取当前目录下的 `app_spec.txt`，这是完整的项目需求规格。仔细阅读后再继续。

### 第二步（关键）：创建 feature_list.json

基于 `app_spec.txt`，创建 `feature_list.json`，包含 200 个详细的端到端功能测试用例。这是整个项目的唯一进度来源。

**格式：**
```json
[
  {
    "category": "functional",
    "description": "功能描述及测试验证内容",
    "steps": [
      "步骤 1: 导航到相关页面",
      "步骤 2: 执行操作",
      "步骤 3: 验证预期结果"
    ],
    "passes": false
  },
  {
    "category": "style",
    "description": "UI/UX 需求描述",
    "steps": [
      "步骤 1: 导航到页面",
      "步骤 2: 截图",
      "步骤 3: 验证视觉要求"
    ],
    "passes": false
  }
]
```

**要求：**
- 至少 200 个功能，每个都有测试步骤
- 包含 "functional" 和 "style" 两类
- 混合短测试（2-5 步）和长测试（10+ 步），其中至少 25 个测试有 10+ 步
- 按优先级排序：基础功能在前
- 所有测试初始状态为 `"passes": false`
- 完整覆盖规格中的所有功能

**严格规则：在后续会话中，功能条目只能标记为通过，不能删除、修改描述或测试步骤。**

### 第三步：创建 init.sh

创建环境启动脚本 `init.sh`，后续 Agent 可以用它快速搭建和运行开发环境：
1. 安装所有必要依赖
2. 启动开发服务器
3. 打印访问地址等有用信息

### 第四步：初始化 Git

创建 Git 仓库并提交：
- feature_list.json
- init.sh
- README.md（项目概述）

Commit message: `"Initial setup: feature_list.json, init.sh, and project structure"`

### 第五步：搭建项目结构

根据 `app_spec.txt` 搭建基础目录结构（前端、后端等）。

### 可选：开始实现

如果还有时间，可以开始实现 feature_list.json 中优先级最高的功能。记住：
- 一次只做一个功能
- 充分测试后再标记为通过
- 结束前提交所有进度

### 结束会话

结束前必须：
1. 提交所有工作（描述性 commit message）
2. 创建 `claude-progress.txt` 记录本次成果
3. 确保 feature_list.json 完整保存
4. 代码库处于干净可工作状态
