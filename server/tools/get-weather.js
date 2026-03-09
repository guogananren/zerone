export function getWeatherToolDef() {
  return {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定地点的当前天气（示例数据，非真实实时天气）',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: '城市或地区名称，例如 杭州',
          },
          unit: {
            type: 'string',
            description: '温度单位，摄氏或华氏',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  }
}

export function callGetWeather(args) {
  const location =
    typeof args?.location === 'string' && args.location
      ? args.location
      : '未知地点'
  const unit = args?.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'

  // TODO: 将来在这里接入真实天气服务，例如第三方天气 API
  const mockTemperatureCelsius = 25
  const temperature =
    unit === 'fahrenheit'
      ? Math.round((mockTemperatureCelsius * 9) / 5 + 32)
      : mockTemperatureCelsius

  return {
    location,
    temperature,
    unit,
    condition: 'sunny',
    observed_at: new Date().toISOString(),
    is_mock: true,
  }
}

