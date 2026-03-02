/**
 * BFF 代理服务：转发聊天请求至阿里云百炼，API Key 不暴露给前端
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config } from 'dotenv'
import OpenAI from 'openai'
import express from 'express'
import cors from 'cors'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const app = express()
const PORT = 3001

app.use(cors({ origin: true }))
app.use(express.json())

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
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })

    const stream = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages,
      stream: true,
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
        res.flush?.()
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('BFF 代理错误:', err)
    res.status(500).json({
      error: err.message || '请求失败',
    })
  }
})

app.listen(PORT, () => {
  console.log(`BFF 代理运行于 http://localhost:${PORT}`)
})
