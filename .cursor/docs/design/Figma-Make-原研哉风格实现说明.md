# 原研哉风格聊天窗口 - Figma Make 设计稿实现说明

基于 [Figma Make 设计稿](https://www.figma.com/make/dH0EMtHfaIoB8ZMCogg13C/) 实现的 Vue3 可运行代码。

## 设计稿来源

- **链接**: https://www.figma.com/make/dH0EMtHfaIoB8ZMCogg13C/
- **产品**: Figma Make（原研哉风格聊天窗口）
- **原始技术栈**: React + Tailwind
- **转换后**: Vue 3 + TypeScript + Scss + Element Plus

## 文件结构

```
src/
├── common/
│   ├── assets/styles/
│   │   └── variables.scss          # 设计变量（颜色、间距）
│   └── components/icons/
│       ├── IconArrowRight.vue
│       ├── IconArrowLeft.vue
│       ├── IconMessageSquare.vue
│       ├── IconSparkles.vue
│       └── IconSend.vue
├── pages/
│   ├── home/
│   │   └── index.vue                # 首页（Hero、功能卡片、设计理念）
│   └── chat/
│       ├── index.vue                # 聊天页容器
│       └── components/
│           └── ChatBot.vue          # 聊天组件
└── router/index.ts                  # 路由：/ 首页、/chat 对话
```

## 组件 Props 与交互

### Home 首页 (`pages/home/index.vue`)

- 无 Props，纯展示页
- **交互**:
  - 「开始对话」按钮 → 跳转 `/chat`
  - 「智能对话」卡片 → 跳转 `/chat`
  - 「更多功能」卡片 → 禁用态，无交互
  - 导航「对话」链接 → 跳转 `/chat`
  - 卡片悬停 → 背景色变化、箭头右移

### ChatBot 聊天组件 (`pages/chat/components/ChatBot.vue`)

- 无 Props
- **交互**:
  - 输入框输入 → 双向绑定 `inputValue`
  - 发送按钮 / Enter → 发送消息，1 秒后模拟机器人回复
  - 空内容时发送按钮禁用
  - 「返回首页」链接 → 跳转 `/`
  - 新消息到达 → 自动滚动到底部

### 图标组件 (`common/components/icons/`)

| 组件 | Props | 默认值 |
|------|-------|--------|
| IconArrowRight | size, strokeWidth | 18, 1.5 |
| IconArrowLeft | size, strokeWidth | 20, 1.5 |
| IconMessageSquare | size, strokeWidth | 32, 1 |
| IconSparkles | size, strokeWidth | 32, 1 |
| IconSend | size, strokeWidth | 20, 1.5 |

## 设计变量（variables.scss）

| 变量 | 值 | 说明 |
|------|-----|------|
| $zerone-text-primary | #2a2a2a | 主文字色 |
| $zerone-text-secondary | #6a6a6a | 次要文字 |
| $zerone-text-muted | #a0a0a0 | 禁用/占位 |
| $zerone-border | #e8e8e8 | 边框 |
| $zerone-bg-white | #ffffff | 白底 |
| $zerone-bg-light | #fafafa | 浅灰底 |
| $zerone-bg-hover | #f5f5f5 | 悬停底 |
| $zerone-bg-dark | #2a2a2a | 深色按钮 |

## 运行说明

### 依赖安装

```bash
pnpm install
```

### 配置百炼 API Key

复制 `.env.example` 为 `.env`，填入 `DASHSCOPE_API_KEY`（从 [百炼控制台](https://dashscope.console.aliyun.com/) 获取）。

### 启动开发

**方式一**：前后端同时启动（推荐）

```bash
pnpm dev:all
```

**方式二**：分别启动

```bash
# 终端 1：BFF 代理（需先配置 DASHSCOPE_API_KEY）
pnpm dev:server

# 终端 2：前端
pnpm dev
```

### 构建

```bash
pnpm build
```

### 路由

- `/` — 工作台首页
- `/chat` — AI 对话页

## 适配注意事项

1. **移动端**: 首页 `@media (max-width: 768px)` 时卡片改为单列，内边距缩小
2. **字体**: 设计稿使用 font-weight: 300，依赖系统无衬线字体
3. **Element Plus**: 当前实现以自定义样式为主，未使用 Element 表单/按钮组件，便于 1:1 还原设计
4. **后续扩展**: ChatBot 中 `setTimeout` 模拟回复，可替换为真实 AI 接口（参考 R001-AI 对话模块需求）
