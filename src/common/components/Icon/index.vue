<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from '@@/constants/icons'

defineOptions({ name: 'BaseIcon' })

const props = withDefaults(
  defineProps<{
    name: string
    width?: number
    height?: number
  }>(),
  { width: 24, height: 24 }
)

const svgHtml = computed(() => {
  const raw = ICONS[props.name]
  if (!raw) return ''
  return raw.replace(
    /<svg /,
    `<svg width="${props.width}" height="${props.height}" `
  )
})
</script>

<template>
  <span
    class="z-icon"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <span v-html="svgHtml" />
  </span>
</template>

<style scoped>
.z-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.z-icon :deep(svg) {
  display: block;
}
</style>
