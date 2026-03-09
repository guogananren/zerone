export function getCurrentTimeToolDef() {
  return {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: '获取当前时间，可选指定时区和语言区域',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'IANA 时区字符串，例如 Asia/Shanghai',
          },
          locale: {
            type: 'string',
            description: '语言区域代码，例如 zh-CN',
          },
        },
        required: [],
      },
    },
  }
}

export function callGetCurrentTime(args) {
  const now = new Date()
  const timeZone =
    typeof args?.timezone === 'string' && args.timezone
      ? args.timezone
      : 'Asia/Shanghai'
  const locale =
    typeof args?.locale === 'string' && args.locale ? args.locale : 'zh-CN'

  let formatted = now.toISOString()
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    formatted = formatter.format(now)
  } catch {
    // ignore formatter errors, fallback to ISO string
  }

  return {
    iso: now.toISOString(),
    formatted,
    timeZone,
    locale,
  }
}

