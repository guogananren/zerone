<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Icon from '@@/components/Icon/index.vue'
import { useChatStore } from '@/stores/chat'
import { fetchChatStream } from '@@/apis/chat'
import { renderMarkdown } from '@@/utils/markdown'
import type { Message } from '@/stores/chat'
const chatStore = useChatStore()
const { currentMessages, currentSessionId, sessions } = storeToRefs(chatStore)

const inputValue = ref('')
const messagesEndRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  chatStore.ensureCurrentSession()
})

function scrollToBottom() {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

watch(currentMessages, scrollToBottom, { deep: true })

function buildApiMessages(): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  return currentMessages.value
    .filter((m) => m.sender !== 'bot' || m.text)
    .map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))
}

async function handleSend() {
  if (inputValue.value.trim() === '' || isLoading.value) return

  const session = chatStore.ensureCurrentSession()
  const userText = inputValue.value.trim()
  inputValue.value = ''
  errorMsg.value = ''

  const userMessage: Message = {
    id: `u-${Date.now()}`,
    text: userText,
    sender: 'user',
    timestamp: new Date(),
  }
  chatStore.addMessage(session.id, userMessage)

  const botPlaceholder: Message = {
    id: `b-${Date.now()}`,
    text: '',
    sender: 'bot',
    timestamp: new Date(),
  }
  chatStore.addMessage(session.id, botPlaceholder)

  isLoading.value = true
  try {
    const apiMessages = buildApiMessages()
    await fetchChatStream(apiMessages, (chunk) => {
      chatStore.appendToLastBotMessage(session.id, chunk)
    })
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '网络异常，请重试'
    chatStore.updateLastBotMessage(
      session.id,
      errorMsg.value
    )
  } finally {
    isLoading.value = false
  }
}

function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSend()
  }
}

function handleNewChat() {
  chatStore.createSession()
}

function handleSwitchSession(id: string) {
  chatStore.switchSession(id)
}

function handleRetry() {
  errorMsg.value = ''
  if (currentSessionId.value) {
    chatStore.removeLastMessage(currentSessionId.value)
  }
}
</script>

<template>
  <div class="chatbot">
    <aside class="chatbot-sidebar">
      <button
        type="button"
        class="new-chat-btn"
        @click="handleNewChat"
      >
        新对话
      </button>
      <ul class="session-list">
        <li
          v-for="s in sessions"
          :key="s.id"
          class="session-item"
          :class="{ active: s.id === currentSessionId }"
          @click="handleSwitchSession(s.id)"
        >
          {{ s.title }}
        </li>
      </ul>
    </aside>

    <div class="chatbot-main">
      <div class="chatbot-header">
        <div class="header-inner">
          <router-link
            to="/"
            class="back-link"
          >
            <Icon name="arrow-left" :width="20" :height="20" />
            <span>返回首页</span>
          </router-link>
          <h1 class="chatbot-title">ZERONE</h1>
        </div>
      </div>

      <div class="chatbot-messages">
        <div class="messages-inner">
          <p
            v-if="currentMessages.length <= 1 && !isLoading"
            class="empty-hint"
          >
            输入消息开始对话。支持流式输出与多轮上下文。
          </p>
          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            class="message-row"
            :class="{ 'message-user': msg.sender === 'user' }"
          >
            <div class="message-bubble" :class="{ 'bubble-user': msg.sender === 'user' }">
              <div class="message-text">
                <template v-if="msg.sender === 'user'">
                  {{ msg.text }}
                </template>
                <div
                  v-else
                  class="markdown-body"
                  v-html="renderMarkdown(msg.text)"
                />
                <span
                  v-if="msg.sender === 'bot' && isLoading && msg.id === currentMessages[currentMessages.length - 1]?.id"
                  class="cursor"
                >|</span>
              </div>
            </div>
          </div>
          <div ref="messagesEndRef" />
        </div>
      </div>

      <div class="chatbot-input-wrap">
        <div v-if="errorMsg" class="error-tip">
          {{ errorMsg }}
          <button
            type="button"
            class="retry-btn"
            @click="handleRetry"
          >
            重试
          </button>
        </div>
        <div class="input-inner">
          <input
            v-model="inputValue"
            type="text"
            placeholder="输入消息..."
            class="chatbot-input"
            :disabled="isLoading"
            @keypress="handleKeyPress"
          >
          <button
            type="button"
            class="send-btn"
            :disabled="inputValue.trim() === '' || isLoading"
            aria-label="发送消息"
            @click="handleSend"
          >
            <span v-if="isLoading" class="send-label">生成中...</span>
            <Icon name="send" :width="20" :height="20" v-else />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@@/assets/styles/variables.scss' as *;

.chatbot {
  display: flex;
  height: 100%;
  background: $zerone-bg-white;
}

.chatbot-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid $zerone-border;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.new-chat-btn {
  padding: 10px 16px;
  background: $zerone-bg-dark;
  color: white;
  border: none;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 300;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: $zerone-bg-dark-hover;
  }
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.session-item {
  padding: 10px 12px;
  font-size: 14px;
  color: $zerone-text-secondary;
  font-weight: 300;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s;

  &:hover {
    background: $zerone-bg-light;
  }

  &.active {
    background: $zerone-bg-hover;
    color: $zerone-text-primary;
  }
}

.chatbot-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chatbot-header {
  padding: 48px 48px 32px;
  border-bottom: 1px solid $zerone-border;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $zerone-text-secondary;
  text-decoration: none;
  font-size: 14px;
  letter-spacing: 0.02em;
  font-weight: 300;
  transition: color 0.2s;

  &:hover {
    color: $zerone-text-primary;
  }
}

.chatbot-title {
  font-size: 20px;
  letter-spacing: 0.05em;
  color: $zerone-text-primary;
  font-weight: 300;
  margin: 0;
}

.chatbot-messages {
  flex: 1;
  padding: 0 48px;
  overflow-y: auto;
}

.messages-inner {
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.empty-hint {
  font-size: 15px;
  color: $zerone-text-muted;
  font-weight: 300;
  margin: 0;
}

.message-row {
  display: flex;
  justify-content: flex-start;

  &.message-user {
    justify-content: flex-end;
  }
}

.message-bubble {
  max-width: 480px;
  padding: 16px 24px;
  background: $zerone-bg-white;
  border: 1px solid $zerone-border;
  border-radius: 2px;
  text-align: left;

  &.bubble-user {
    background: $zerone-bg-hover;
    border: none;
    text-align: right;
  }
}

.message-text {
  font-size: 15px;
  line-height: 1.8;
  letter-spacing: 0.01em;
  font-weight: 300;
  color: $zerone-text-primary;
  margin: 0;
}

.markdown-body {
  :deep(p) {
    margin: 0 0 8px;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 0 0 8px;
  }

  :deep(li) {
    margin: 2px 0;
  }

  :deep(code) {
    font-size: 13px;
    padding: 2px 4px;
    border-radius: 2px;
    background: $zerone-bg-light;
  }

  :deep(pre) {
    margin: 8px 0 0;
    padding: 10px 12px;
    border-radius: 2px;
    background: $zerone-bg-light;
    overflow-x: auto;
  }

  :deep(pre code) {
    padding: 0;
    background: transparent;
  }

  :deep(blockquote) {
    margin: 0 0 8px;
    padding-left: 10px;
    border-left: 2px solid $zerone-border;
    color: $zerone-text-secondary;
  }

  :deep(a) {
    color: $zerone-text-primary;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

:deep(.hljs) {
  font-size: 13px;
  line-height: 1.6;
  background: transparent;
  color: $zerone-text-primary;
}

:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: $zerone-text-muted;
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-literal),
:deep(.hljs-section),
:deep(.hljs-link) {
  color: $zerone-bg-dark;
}

:deep(.hljs-string),
:deep(.hljs-title),
:deep(.hljs-name),
:deep(.hljs-type),
:deep(.hljs-attribute) {
  color: $zerone-text-secondary;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.error-tip {
  margin-bottom: 8px;
  font-size: 14px;
  color: #d4183d;

  .retry-btn {
    margin-left: 8px;
    color: $zerone-text-primary;
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
  }
}

.chatbot-input-wrap {
  padding: 40px 48px;
  border-top: 1px solid $zerone-border;
}

.input-inner {
  max-width: 680px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: $zerone-bg-light;
  border: 1px solid $zerone-border;
  border-radius: 2px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $zerone-border-focus;
  }
}

.chatbot-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: $zerone-text-primary;
  font-weight: 300;
  letter-spacing: 0.01em;

  &::placeholder {
    color: $zerone-text-muted;
  }
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: $zerone-text-primary;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: $zerone-bg-dark-hover;
  }

  &:disabled {
    color: $zerone-border-focus;
    cursor: not-allowed;
  }
}

.send-label {
  font-size: 14px;
  font-weight: 300;
}
</style>
