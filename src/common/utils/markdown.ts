import { marked } from 'marked'
import type { Tokens } from 'marked'
import hljs from 'highlight.js'

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    // 自定义代码块渲染
    code(token: Tokens.Code): string {
      const { text, lang } = token

      // 如果指定了语言且 hljs 支持
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(text, { language: lang }).value
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
        } catch (err) {
          console.warn(`Failed to highlight code with language "${lang}":`, err)
        }
      }

      // 自动检测语言
      try {
        const result = hljs.highlightAuto(text)
        return `<pre><code class="hljs">${result.value}</code></pre>`
      } catch (err) {
        console.error('Failed to auto-highlight code:', err)
        return `<pre><code>${text}</code></pre>`
      }
    }
  }
})

export function renderMarkdown(text: string): string {
  if (!text) {
    return ''
  }
  // 后端输出被视为可信，如需严格 XSS 防护可在此增加 HTML sanitize 逻辑
  return marked(text) as string
}

