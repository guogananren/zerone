/**
 * BFF 代理服务：转发聊天请求至阿里云百炼，API Key 不暴露给前端
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config } from 'dotenv'
import OpenAI from 'openai'
import express from 'express'
import cors from 'cors'
import { tools, executeToolCall } from './tools/index.js'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const app = express()
const PORT = 3001

app.use(cors({ origin: true }))
app.use(express.json())

function createDashScopeClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    throw new Error('服务端未配置 DASHSCOPE_API_KEY')
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  })
}

async function handleChatWithTools(messages, onChunk) {
  const openai = createDashScopeClient()

  const baseMessages = [...messages]

  // 第一轮：带 tools 的流式调用，用来统一处理「无工具」和「有工具」两种情况
  const firstStream = await openai.chat.completions.create({
    model: 'qwen-plus',
    messages: baseMessages,
    tools,
    stream: true,
  })

  // 用于构造带 tool_calls 的完整 assistant 消息，供第二轮调用使用
  const assistantMessage = {
    role: 'assistant',
    content: '',
    tool_calls: [],
  }

  // index -> 累积中的 tool_call
  const toolCallMap = new Map()

  let sawAnyChunk = false
  let hasToolCalls = false

  for await (const chunk of firstStream) {
    sawAnyChunk = true
    const choice = chunk.choices?.[0]
    const delta = choice?.delta
    if (!delta) continue

    // 普通内容增量
    if (delta.content) {
      assistantMessage.content += delta.content
      // 只有在「还未发现工具调用」时，才把第一轮的内容流给前端
      if (!hasToolCalls && typeof onChunk === 'function') {
        onChunk(delta.content)
      }
    }

    // 工具调用增量
    if (delta.tool_calls && delta.tool_calls.length > 0) {
      hasToolCalls = true
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0
        let existing = toolCallMap.get(idx)
        if (!existing) {
          existing = {
            id: tc.id,
            type: tc.type ?? 'function',
            function: {
              name: tc.function?.name ?? '',
              arguments: tc.function?.arguments ?? '',
            },
          }
          toolCallMap.set(idx, existing)
          assistantMessage.tool_calls.push(existing)
        } else {
          if (tc.id) existing.id = tc.id
          if (tc.type) existing.type = tc.type
          if (tc.function?.name) {
            existing.function.name = tc.function.name
          }
          if (tc.function?.arguments) {
            existing.function.arguments =
              (existing.function.arguments ?? '') + tc.function.arguments
          }
        }
      }
    }
  }

  if (!sawAnyChunk) {
    throw new Error('模型未返回任何流式数据')
  }

  // 情况一：没有工具调用
  // 第一轮已经完整流式输出给前端，这里直接结束
  if (!hasToolCalls) {
    return
  }

  // 情况二：有工具调用
  // 根据第一轮累积得到的 tool_calls 执行工具
  const toolMessages = []

  for (const toolCall of assistantMessage.tool_calls) {
    const toolResult = await executeToolCall(toolCall)
    toolMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolCall.function?.name,
      content: JSON.stringify(toolResult),
    })
  }

  const secondMessages = [...baseMessages, assistantMessage, ...toolMessages]

  // 第二轮：带工具结果的真正回答，使用流式返回给前端
  const secondStream = await openai.chat.completions.create({
    model: 'qwen-plus',
    messages: secondMessages,
    stream: true,
  })

  for await (const chunk of secondStream) {
    const choice = chunk.choices?.[0]
    const delta = choice?.delta
    const content = delta?.content
    if (content && typeof onChunk === 'function') {
      onChunk(content)
    }
  }
}

/** 健康检查，供 Docker / 网关探测 */
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.post('/api/chat', async (req, res) => {
  const { messages = [] } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages 不能为空' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    await handleChatWithTools(messages, (content) => {
      res.write(`data: ${JSON.stringify({ content })}\n\n`)
      res.flush?.()
    })
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('BFF 代理错误:', err)
    res.write(
      `data: ${JSON.stringify({
        content:
          err instanceof Error
            ? err.message
            : '请求失败，请稍后重试',
      })}\n\n`,
    )
    res.write('data: [DONE]\n\n')
    res.end()
  }
})

app.listen(PORT, () => {
  console.log(`BFF 代理运行于 http://localhost:${PORT}`)
})
