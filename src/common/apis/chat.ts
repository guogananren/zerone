export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * 流式调用聊天接口，逐块回调 content
 */
export async function fetchChatStream(
  messages: ChatMessage[],
  onChunk: (content: string) => void
): Promise<void> {
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(err.error || '请求失败')
  }

  const reader = resp.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

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
        } catch {
          // 忽略
        }
      }
    }
  }
}
