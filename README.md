# Autonomous Coding Agent — Cursor IDE 版

基于 Anthropic 博文 [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 的方法论，适配 Cursor IDE 直接使用。

**无需 API Key，无需额外订阅，Cursor 自带的 Agent 模式即可运行。**

## 使用流程

### 1. 准备项目目录

```bash
mkdir my_project
copy prompts\app_spec.txt my_project\
copy .cursorrules my_project\
copy progress.py my_project\
```

### 2. 用 Cursor 打开项目

```bash
cursor my_project
```

### 3. 第一次会话 — 初始化

按 `Ctrl+I` 打开 Composer（Agent 模式），把 `prompts/initializer_prompt.md` 的内容粘贴进去发送。

Agent 会自动完成：
- 读取 app_spec.txt 了解需求
- 生成 feature_list.json（200+ 功能测试用例）
- 创建 init.sh 环境脚本
- 初始化 Git 仓库
- 搭建基础项目结构

### 4. 后续会话 — 增量编码

**每次开一个新的 Agent 会话**（关掉上一个 Composer，重新 `Ctrl+I`），把 `prompts/coding_prompt.md` 的内容粘贴发送。

Agent 会自动完成：
- 读进度文件 + Git 日志了解状态
- 验证已有功能没损坏
- 选一个未完成功能实现
- 测试后标记通过
- 提交 Git + 更新进度

**重复这一步**，直到所有功能完成。

### 5. 查看进度

在终端中运行：

```bash
python progress.py
```

## 项目结构

```
autonomous-coding/
├── .cursorrules              # Agent 规则（Cursor 自动加载）
├── progress.py               # 进度查看工具
├── README.md
├── .gitignore
└── prompts/
    ├── initializer_prompt.md # 第 1 次会话粘贴的 prompt
    ├── coding_prompt.md      # 后续会话粘贴的 prompt
    └── app_spec.txt          # 应用需求规格（可替换为你的项目）
```

## 自定义

- **换应用**：编辑 `prompts/app_spec.txt`，替换为你自己的需求
- **减少功能数**：编辑 `prompts/initializer_prompt.md` 中的 "200" 改小
- **调整规则**：编辑 `.cursorrules`

## 核心方法论

| 问题 | 解决方案 |
|------|----------|
| Agent 一次做太多 | 每次会话只实现一个功能 |
| Agent 过早宣布完成 | feature_list.json 追踪所有功能进度 |
| 未充分测试 | 必须验证后才标记通过 |
| 新会话不知道状态 | Git + claude-progress.txt 记录 |

## 参考

- [原文](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [原版代码](https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding)
