<script setup lang="ts">
// Renders a ```mermaid fence of the manual (see markdown.config in
// .vitepress/config.ts). Mermaid needs the DOM to measure text, so the diagram
// is drawn in the browser only and redrawn when the reader switches between
// light and dark mode; the import is dynamic so pages without a diagram do not
// load the library at all.
import { onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ code: string }>()
const { isDark } = useData()
const svg = ref('')

let renderCount = 0

async function render() {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark.value ? 'dark' : 'neutral',
    fontFamily: 'var(--vp-font-family-base)',
  })
  const id = `mermaid-${Math.random().toString(36).slice(2)}-${renderCount++}`
  svg.value = (await mermaid.render(id, decodeURIComponent(props.code))).svg
}

onMounted(render)
watch(isDark, render)
</script>

<template>
  <div class="mermaid-diagram" v-html="svg" />
</template>
