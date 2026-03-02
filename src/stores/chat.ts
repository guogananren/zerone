import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  updatedAt: Date
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string | null>(null)

  const currentSession = computed(() =>
    sessions.value.find((s) => s.id === currentSessionId.value)
  )

  const currentMessages = computed(
    () => currentSession.value?.messages ?? []
  )

  function createSession(): Session {
    const id = `s-${Date.now()}`
    const session: Session = {
      id,
      title: '新对话',
      messages: [
        {
          id: 'welcome',
          text: '你好，我在这里。请随时与我交流。',
          sender: 'bot',
          timestamp: new Date(),
        },
      ],
      updatedAt: new Date(),
    }
    sessions.value = [session, ...sessions.value]
    currentSessionId.value = id
    return session
  }

  function switchSession(id: string) {
    if (sessions.value.some((s) => s.id === id)) {
      currentSessionId.value = id
    }
  }

  function addMessage(sessionId: string, msg: Message) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (session) {
      session.messages.push(msg)
      session.updatedAt = new Date()
      if (session.messages.length === 2) {
        session.title = msg.sender === 'user' ? msg.text.slice(0, 20) : session.title
      }
    }
  }

  function updateLastBotMessage(sessionId: string, text: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    const last = session.messages[session.messages.length - 1]
    if (last?.sender === 'bot') {
      last.text = text
    }
  }

  function appendToLastBotMessage(sessionId: string, chunk: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    const last = session.messages[session.messages.length - 1]
    if (last?.sender === 'bot') {
      last.text += chunk
    }
  }

  function removeLastMessage(sessionId: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (session && session.messages.length > 0) {
      session.messages.pop()
    }
  }

  function ensureCurrentSession(): Session {
    if (!currentSessionId.value || !currentSession.value) {
      return createSession()
    }
    return currentSession.value
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    createSession,
    switchSession,
    addMessage,
    updateLastBotMessage,
    appendToLastBotMessage,
    removeLastMessage,
    ensureCurrentSession,
  }
})
