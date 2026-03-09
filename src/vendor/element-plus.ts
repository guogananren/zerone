import {
  ElButton,
  ElInput,
  ElForm,
  ElFormItem
} from 'element-plus'
import type { App } from 'vue'

export function installElementPlus(app: App) {
  app.component('ElButton', ElButton)
  app.component('ElInput', ElInput)
  app.component('ElForm', ElForm)
  app.component('ElFormItem', ElFormItem)
}