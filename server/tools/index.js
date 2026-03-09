import { getCurrentTimeToolDef, callGetCurrentTime } from './get-current-time.js'
import { getWeatherToolDef, callGetWeather } from './get-weather.js'

export const tools = [getCurrentTimeToolDef(), getWeatherToolDef()]

export async function executeToolCall(toolCall) {
  const name = toolCall?.function?.name
  let parsedArgs = {}

  if (toolCall?.function?.arguments) {
    try {
      parsedArgs = JSON.parse(toolCall.function.arguments)
    } catch (err) {
      console.error('解析工具参数失败:', err)
    }
  }

  if (name === 'get_current_time') {
    return callGetCurrentTime(parsedArgs)
  }

  if (name === 'get_weather') {
    return callGetWeather(parsedArgs)
  }

  console.warn('收到未知工具调用:', name)
  return {
    error: '未知工具名称',
    tool: name,
  }
}

