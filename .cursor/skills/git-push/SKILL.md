---
name: git-push
description: 代码提交自动化 - 当用户说"提交代码"时自动执行 git 提交流程
---
# 代码提交规则

当用户说 **"提交代码"** 时，执行以下流程：

## 基本流程

1. 执行 `git status` 检查是否有更改
2. 如果没有更改，提示用户"没有需要提交的更改"并结束
3. 如果有更改，执行 `git add .` 暂存所有文件
4. 生成 commit message：
   - 如果用户提供了说明（如"提交代码：修复登录bug"或"提交代码，feat: 新增功能"），使用用户的说明作为 message
   - 如果没有，执行 `git diff --staged` 查看更改内容，生成简洁的中文提交信息
5. 执行 `git commit -m "message"`
6. 执行 `git pull --rebase` 拉取远程最新代码并变基
7. 检查是否存在冲突：
   - 如果无冲突，执行 `git push` 推送到远程
   - 如果有冲突，进入冲突处理流程
8. 报告提交结果

## 冲突处理流程

当 `git pull --rebase` 后发现冲突时：

1. 告知用户存在冲突，执行 `git status` 列出所有冲突文件
2. 逐个打开冲突文件，展示冲突区域（`<<<<<<<` 和 `>>>>>>>` 之间的内容）
3. 询问用户希望如何解决每个冲突：
   - 保留本地版本（HEAD）
   - 保留远程版本（incoming）
   - 手动合并两个版本（请用户说明合并方式）
4. 根据用户选择修改文件，移除冲突标记
5. 执行 `git add <冲突文件>` 标记为已解决
6. 所有冲突解决后，执行 `git rebase --continue`
7. 执行 `git push` 完成推送
8. 报告最终结果

## 权限要求

执行 git 命令时需要请求以下权限：
- `git_write`: 用于 git add、commit、rebase 等写操作
- `network`: 用于 git pull、push 等网络操作

## 使用示例

| 用户输入 | AI 行为 |
|---------|---------|
| "提交代码" | 自动生成 commit message，执行 add/commit/pull/push |
| "提交代码：修复聊天组件样式" | 使用"修复聊天组件样式"作为 commit message |
| "提交代码，feat: 新增用户登录" | 使用"feat: 新增用户登录"作为 commit message |
