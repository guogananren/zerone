---
name: chat-markdown-rendering
overview: 在 ChatBot 对话界面中，为 Bot 消息集成 marked + highlight.js，将文本渲染为 Markdown，并保持整体视觉风格简洁（原研哉风格）。
todos:
  - id: add-markdown-deps
    content: 在 package.json 中添加 marked 和 highlight.js 依赖
    status: completed
  - id: create-markdown-util
    content: 在 src/common/utils/markdown.ts 中封装 marked + highlight.js 渲染工具函数
    status: completed
  - id: integrate-into-chatbot
    content: 在 ChatBot.vue 中对 Bot 消息使用 renderMarkdown + v-html 渲染 Markdown
    status: completed
  - id: style-markdown
    content: 为 Markdown 与 highlight.js 添加原研哉风格的极简样式（在 ChatBot 作用域内完成）
    status: completed
  - id: verify-streaming
    content: 手动测试流式对话、代码块和多段落 Markdown 渲染效果
    status: completed
isProject: false
---

## 目标

- **仅对 Bot 消息** 使用 `marked + highlight.js` 渲染为 Markdown HTML。
- 保持当前流式输出体验不变，在消息内容变化时自动刷新渲染结果。
- 样式整体遵循原研哉风格：留白、低对比、简洁，无花哨高亮主题。

## 实现思路

- **依赖与基础配置**
  - 在 `package.json` 中新增依赖：`marked`、`highlight.js`。
  - 在 `src/common` 下新增一个 Markdown 工具模块，例如 `[src/common/utils/markdown.ts](src/common/utils/markdown.ts)`：
    - 初始化 `marked`，配置：
      - `breaks: true`（支持换行友好显示）。
      - `gfm: true`（支持表格、任务列表等 GitHub 风格语法）。
      - `highlight(code, lang)` 中调用 `highlight.js`：
        - 如指定语言存在则用指定语言高亮，不存在或缺失则使用 `highlightAuto`。
    - 导出一个 `renderMarkdown(text: string): string` 方法，内部直接返回 `marked(text)` 结果。
    - 根据你的选择，**不做额外 HTML sanitize**，在注释里标明这是基于“后端可信”的假设，后续如需可替换为 DOMPurify 之类方案。
- **ChatBot.vue 中接入 Markdown 渲染**
  - 在 `[src/pages/chat/components/ChatBot.vue](src/pages/chat/components/ChatBot.vue)`：
    - 引入 `renderMarkdown` 工具方法。
    - 将当前模板中 Bot 消息的渲染从：
      - `{{ msg.text }}`
      - 替换为：
        - `v-if="msg.sender === 'bot'"` 的分支内使用 `v-html="renderMarkdown(msg.text)"`，例如：
        - `<div class="message-text markdown-body" v-html="renderMarkdown(msg.text)" />`
      - 对用户消息仍保持 `{{ msg.text }}` 文本渲染，保证输入原样显示。
    - 保留现有流式指示光标逻辑：
      - 根据 `isLoading` 和 `msg.id === currentMessages[last].id` 判断是否显示竖线光标；
      - 光标可放在 Markdown 容器后方或内部追加一个小 span，不影响 HTML 渲染逻辑。
- **流式输出与性能策略**
  - 利用当前 Pinia 流式追加机制：每当 `msg.text` 更新时，组件会重新渲染。
  - 在 `ChatBot.vue` 中：
    - 将 `renderMarkdown` 作为普通方法或小的帮助函数直接调用；基于当前对话长度和复杂度，**优先实现为“每次文本改变时整体重新渲染”**：
      - 简化实现，不需要跟踪 partial AST 或增量更新。
      - 如后期发现性能问题，再考虑：
        - 使用 `computed` + `watch` 对单条 Bot 消息做缓存；
        - 或在 Pinia store 中对每条消息缓存 `html` 字段。
- **样式与原研哉风格调整**
  - 在 `ChatBot.vue` 的 `<style scoped lang="scss">` 中：
    - 为 Markdown 内容容器新增样式类，如 `.markdown-body`：
      - 调整：
        - `p`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`, `h1..h4` 的行高、间距、字体、颜色。
        - 整体风格：
          - 行高偏大（如 1.8+），
          - 颜色使用已有 `$zerone-text-primary` / `$zerone-text-muted`，对比度柔和，
          - 链接下划线轻微、颜色略深，
          - `code` 背景用非常浅的灰色块，圆角小，字号略小。
      - 确保与 `.message-bubble` 现有布局兼容，不破坏当前左右对齐结构。
  - 为 `highlight.js` 代码块设置：
    - 仅使用少量、低饱和度颜色差异：
      - 关键词略深一点，字符串略暖色但不刺眼，注释偏灰。
    - 通过覆盖 `.hljs`、`.hljs-keyword` 等类，手动定义符合原研哉风格的极简高亮，而不是引入现成重主题（可在 `[src/common/assets/markdown.scss](src/common/assets/markdown.scss)` 等集中管理）。
- **全局或局部样式放置策略**
  - 为避免污染其它页面，可优先：
    - 在 `ChatBot.vue` 中使用 `scoped` + 深度选择器（如 `:deep(.hljs)`）来定制 `highlight.js` 样式。
  - 如果后续其他页面也会用到 Markdown：
    - 再抽取公共 `scss` 到 `[src/common/assets/markdown.scss](src/common/assets/markdown.scss)`，在需要的组件中按需引入。
- **简单验证与边界情况处理**
  - 手动测试以下输入：
    - 普通文本、多段落、列表、引用、粗体/斜体。
    - 单行代码、代码块（带/不带语言名）。
    - 流式长回答，确认：
      - 内容不断增长时滚动行为仍正常（`scrollIntoView` 不受影响）。
      - 光标动画仍随最后一条 Bot 消息显示。
  - 注意 Emoji / 非 ASCII 字符显示正常，行高不拥挤。

