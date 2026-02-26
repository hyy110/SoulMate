# 编码 Agent Prompt

> 使用方式：在 Cursor 中开启新的 Agent 会话，将以下内容粘贴发送。每次新会话都使用这个 prompt。

---

## 你的角色 — 编码 Agent

你正在继续一个长期自主开发任务。这是一个**全新的上下文窗口**，你对之前的会话没有任何记忆。

### 步骤 1：了解当前状态（必须执行）

```bash
pwd                                          # 确认工作目录
ls -la                                       # 查看项目结构
cat app_spec.txt                             # 了解项目需求
cat feature_list.json | head -50             # 查看功能列表
cat claude-progress.txt                      # 读取之前的进度
git log --oneline -20                        # 查看最近提交
cat feature_list.json | grep '"passes": false' | wc -l  # 统计剩余数量
```

### 步骤 2：启动开发环境

如果 `init.sh` 存在，运行它：
```bash
chmod +x init.sh
./init.sh
```

### 步骤 3：验证测试（关键！）

**在实现新功能之前必须执行：**

上一个会话可能引入了 bug。选 1-2 个已标记为 `"passes": true` 的核心功能，手动验证它们是否仍然正常。

**如果发现问题：**
- 立即将该功能标记回 `"passes": false`
- 先修复所有问题，再实现新功能
- 包括 UI bug：对比度问题、布局溢出、按钮间距、缺少 hover 状态、控制台错误等

### 步骤 4：选择一个功能实现

查看 feature_list.json，选取优先级最高的 `"passes": false` 功能。

**本次会话只专注完成这一个功能。** 做好一个比做坏三个强。后续会话会继续推进。

### 步骤 5：实现功能

1. 编写代码（前端和/或后端）
2. 手动测试功能
3. 修复发现的问题
4. 确认端到端可用

### 步骤 6：验证功能

**必须通过实际操作验证：**
- 在浏览器中打开应用
- 像真实用户一样操作（点击、输入、滚动）
- 检查控制台是否有错误
- 验证完整的用户工作流

### 步骤 7：更新 feature_list.json

验证通过后，**只修改 "passes" 字段**：

```json
"passes": true
```

**绝对不能：** 删除功能、修改描述、修改测试步骤、合并功能、重排顺序。

### 步骤 8：提交 Git

```bash
git add .
git commit -m "Implement [功能名称] - verified end-to-end

- Added [具体变更]
- Tested and verified
- Updated feature_list.json: marked test #X as passing
"
```

### 步骤 9：更新进度

更新 `claude-progress.txt`：
- 本次完成了什么
- 哪些功能通过了测试
- 发现并修复了哪些问题
- 下次应该做什么
- 当前进度（如 "45/200 tests passing"）

### 步骤 10：干净结束

1. 提交所有代码
2. 更新 claude-progress.txt
3. 更新 feature_list.json
4. 确保没有未提交的更改
5. 应用处于可工作状态

---

## 重要提醒

- **总目标：** 200+ 功能全部通过的生产级应用
- **本次目标：** 完美完成至少一个功能
- **优先级：** 修复损坏的 > 实现新的
- **质量标准：** 零错误、UI 精致、端到端可用

从步骤 1 开始。
