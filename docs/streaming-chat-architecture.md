# 流式对话架构：从 Vite 代理到前端逐字渲染

本文梳理 Zerone 项目中「用户发消息 → 模型流式回复 → 前端打字机效果」的完整链路，包括 Vite 反向代理、BFF 流式转发、SSE 协议约定以及前端的流式读取与状态更新。

---

## 一、整体链路一览

```
浏览器 (POST /api/chat)
    → Vite Dev Server (proxy: /api → localhost:3001)
    → BFF (Express) 建立 SSE 长连接
    → BFF 调用 DashScope 流式 API（可能两轮：工具调用 + 最终回答）
    → BFF 将每块 content 以 SSE 事件写回
    → 前端 fetch + ReadableStream 按行解析 data: {...}
    → onChunk(content) → Store 追加到当前 bot 消息
    → 界面实时更新，形成打字机效果
```

下面先回答一个常见问题：**为什么要用 Vite 代理 + BFF**。理解动机后，再按「代理 → BFF → 前端」顺序展开每一步的实现逻辑。

---

## 二、为什么要用 Vite 代理 + BFF

这一套组合通常不是“为了炫技”，而是为了把 **开发体验、跨域细节、密钥安全、模型适配与流式协议** 从业务 UI 中剥离出来，形成稳定的请求入口。

### 2.1 为什么要用 Vite 代理（开发期）

- **避免浏览器跨域**：前端只请求同源 `/api/chat`，由 Vite 在开发环境把 `/api/*` 转发到 `http://localhost:3001`，前端不用处理 CORS。
- **前端代码更可移植**：前端永远写 `/api/...`，切换环境只需要调整代理/网关配置（生产环境通常由 Nginx/网关做同样的 `/api` 反代），不必修改前端代码里的 host/port。
- **开发时解耦前后端**：Vite 热更新/静态资源继续在前端端口，BFF 在另一端口，二者独立重启、互不干扰。

### 2.2 为什么一定要有 BFF（不仅仅是“解决跨域”）

- **保护密钥**：`DASHSCOPE_API_KEY` 只能放在服务端环境变量中，不能下发到浏览器；BFF 负责安全地代理到 DashScope。
- **统一接口与协议**：前端只对接一个稳定的 `/api/chat`，后端可以随时更换模型供应商、SDK、请求参数，前端基本不动。
- **更好地封装流式输出**：BFF 用 SSE（`text/event-stream`）把模型的流式 chunk 统一包装为 `data: {"content":"..."}\n\n`，前端只需要实现一套稳定的流式解析逻辑。
- **支持工具调用（二次请求）**：当前实现支持“第一轮识别 tool_calls → 执行本地工具 → 第二轮生成最终回答”，并对前端保持同一种流式输出接口；否则复杂度会落到前端且不利于安全与治理。
- **集中治理与可观测性**：鉴权、限流、日志、埋点、敏感信息过滤、重试策略等都适合放在 BFF 层统一处理。

一句话总结：**Vite 代理解决开发期的同源与体验，BFF 解决生产级的安全与能力封装（密钥、流式、工具调用、可观测性）。**

---

## 三、Vite 反向代理：为何前端只写 `/api/chat`

### 配置

在 `vite.config.ts` 中：

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
  },
},
```

### 发生了什么

1. **前端只请求同源路径**：代码里写 `fetch('/api/chat', ...)`，浏览器认为请求发往当前站点（例如 `http://localhost:5173`），不会产生跨域。
2. **Vite 按路径转发**：开发环境下，Vite 收到路径以 `/api` 开头的请求时，按规则把请求**转发**到 `http://localhost:3001`，路径保持不变（`/api/chat` → `http://localhost:3001/api/chat`）。
3. **changeOrigin**：会把请求头里的 `Host` 设为 `localhost:3001`，避免部分后端对 Host 的校验问题。

这样，前端无需关心 BFF 端口，也不会有 CORS；生产环境通常由 Nginx 等做同样的 `/api` 反向代理。

---

## 四、BFF：把一次 POST 变成 SSE 长连接

### 4.1 接收请求并切换到流式响应

BFF 在 `server/index.js` 中：

- 使用 `express.json()` 解析 POST body，得到 `messages`。
- 校验 `messages` 为非空数组，否则返回 400。
- **关键**：在调用模型之前就设定 SSE 响应头并 flush，把连接「锁定」为流式：

```js
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
res.flushHeaders()
```

这样浏览器会认为这是一次 Server-Sent Events 流，连接保持打开，后续通过多次 `res.write()` 推送数据。

### 4.2 与 DashScope 的流式交互（含工具调用）

BFF 使用 OpenAI SDK 的 DashScope 兼容模式，对 `openai.chat.completions.create()` 传 **`stream: true`**，得到异步迭代器，用 `for await (const chunk of stream)` 消费。

**第一轮（带 tools）**

- 请求参数：`messages`、`tools`、`stream: true`。
- 在循环中：
  - 从 `chunk.choices[0].delta` 取 `content` 和 `tool_calls`。
  - 把 `delta.content` 拼到本地的 `assistantMessage.content`，把 `delta.tool_calls` 按 index 累积成完整的 `tool_calls` 列表。
  - **是否推给前端**：仅当**尚未出现任何工具调用**时，才对 `delta.content` 调用 `onChunk(delta.content)`；一旦出现工具调用，第一轮剩余内容只在本机累积，不再向前端推送。

这样既支持「无工具时直接流式输出第一轮」，又支持「有工具时第一轮仅作中间状态，不把半成品展示给用户」。

**若有工具调用**

- 用累积好的 `assistantMessage.tool_calls` 执行本地工具（如查时间、天气），得到 `toolMessages`。
- 拼出第二轮消息：`baseMessages + assistantMessage + toolMessages`。
- 再次调用 `create(..., { stream: true })`（此轮可不传 tools），对第二轮流式结果中的每个 `delta.content` 都执行 `onChunk(content)`，把「结合工具结果后的最终回答」流式推给前端。

**若无工具调用**

- 第一轮中已经把所有内容通过 `onChunk` 推完，直接 return，不再发第二轮。

### 4.3 写回前端的 SSE 格式

BFF 将 `onChunk` 与 HTTP 响应绑定：

```js
await handleChatWithTools(messages, (content) => {
  res.write(`data: ${JSON.stringify({ content })}\n\n`)
  res.flush?.()
})
res.write('data: [DONE]\n\n')
res.end()
```

- 每条事件一行：`data: <JSON>\n\n`，JSON 形如 `{"content":"某一段文本"}`。
- 流结束发送 `data: [DONE]\n\n`，再 `res.end()`。
- 出错时同样在 SSE 通道内写一条 `data: {"content":"错误信息"}\n\n`，再写 `[DONE]` 并结束，前端可把该条 content 当作错误提示展示。

---

## 五、前端：用 fetch + ReadableStream 消费 SSE

前端没有使用 `EventSource`（因为需要 POST 且带 body），而是 **fetch + 读 body 流 + 按行解析 SSE**。

### 5.1 发起请求与错误处理

在 `src/common/apis/chat.ts` 中：

```ts
const resp = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages }),
})

if (!resp.ok) {
  const err = await resp.json().catch(() => ({ error: resp.statusText }))
  throw new Error(err.error || '请求失败')
}
```

只有非 2xx 时才尝试 `resp.json()` 并抛错；2xx 时响应体是流式的，不会进入该分支。

### 5.2 按块读取并按行解析

```ts
const reader = resp.body?.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const content = parsed?.content
        if (typeof content === 'string') onChunk(content)
      } catch { /* 忽略 */ }
    }
  }
}
```

- **buffer**：TCP 可能把多行或半行拆在不同 chunk 里，用 `buffer` 累积未解析部分，`lines.pop()` 把最后一段可能不完整的行留到下一轮。
- **data: 行**：只处理以 `data: ` 开头的行；`[DONE]` 仅作结束标记，不调用 `onChunk`。
- **payload**：只认 `{ content: string }`，其它字段或解析失败则忽略，保证与 BFF 约定一致。

### 5.3 与页面、Store 的衔接

- **ChatBot.vue**：发送前先 `addMessage` 一条空内容的 bot 占位，再调用 `fetchChatStream(messages, (chunk) => chatStore.appendToLastBotMessage(session.id, chunk))`。
- **Store**：`appendToLastBotMessage` 对当前会话最后一条消息（且为 bot）做 `last.text += chunk`，实现逐字追加。
- 流结束或报错：`fetchChatStream` 正常结束即流结束；若抛错则在 catch 里用 `updateLastBotMessage` 把最后一条 bot 消息的 `text` 置为错误信息。

这样，从「发请求」到「界面逐字更新」的整条链路就闭环了。

---

## 六、流式 vs 非流式（对照）

| 维度           | 当前流式方案                         | 非流式方案（假设）                 |
|----------------|--------------------------------------|------------------------------------|
| BFF 调用模型   | `stream: true`，`for await` 消费     | `stream: false`，一次 `await` 取整段 |
| 响应方式       | SSE 长连接，多次 `res.write()`       | 单次 `res.json({ content })`       |
| Content-Type   | `text/event-stream`                  | `application/json`                 |
| 前端读取       | `resp.body.getReader()` + 按行解析   | `resp.json()` 一次拿到全文         |
| 首字延迟（TTFB）| 低，有首块即推送                     | 高，需等模型生成完整回复           |
| 体验           | 打字机效果                           | 长时间等待后一次性展示             |

---

## 七、小结

- **Vite proxy**：开发时把 `/api` 转到 BFF，前端只写 `/api/chat`，无跨域。
- **BFF**：用 SSE 头 + 多次 `res.write()` 建立流式响应；内部用 DashScope 流式 API，无工具时第一轮即推给前端，有工具时第一轮仅累积、第二轮再流式推送最终回答；统一以 `data: {"content":"..."}\n\n` 和 `data: [DONE]\n\n` 约定格式。
- **前端**：fetch POST + `ReadableStream` 按行解析 `data:`，仅对 `content` 字符串调用 `onChunk`，通过 Store 追加到当前 bot 消息，实现从代理到界面的一条龙流式对话。

以上即为 Zerone 流式对话的前后端逻辑梳理与实现要点。
