/**
 * BFF 代理服务：转发聊天请求至阿里云百炼，API Key 不暴露给前端
 * 原 fetch 实现，保留备份
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const app = express()
const PORT = 3001

app.use(cors({ origin: true }))
app.use(express.json())

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL = 'qwen-plus'

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: '服务端未配置 DASHSCOPE_API_KEY' })
    return
  }

  const { messages = [] } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages 不能为空' })
    return
  }

  try {
    const resp = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      res.status(resp.status).json({ error: errText || '百炼 API 调用失败' })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const reader = resp.body.getReader()
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
            const content = parsed?.choices?.[0]?.delta?.content
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`)
              res.flush?.()
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('BFF 代理错误:', err)
    res.status(500).json({ error: err.message || '请求失败' })
  }
})

app.listen(PORT, () => {
  console.log(`BFF 代理运行于 http://localhost:${PORT}`)
})
