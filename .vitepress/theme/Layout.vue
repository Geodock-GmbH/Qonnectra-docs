<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'
import mediumZoom from 'medium-zoom'
import 'medium-zoom/dist/style.css'

const { Layout } = DefaultTheme
const router = useRouter()

const setupMediumZoom = () => {
  mediumZoom('[data-zoomable]', {
    background: 'transparent',
    margin: 48,
  })
}

onMounted(setupMediumZoom)
router.onAfterRouteChange = setupMediumZoom
</script>

<template>
  <Layout />
</template>

<style>
.medium-zoom-overlay {
  backdrop-filter: blur(5rem);
}

.medium-zoom-overlay,
.medium-zoom-image--opened {
  z-index: 999;
}

/*
 * medium-zoom sets inline width/height from the thumbnail's layout box. Rules
 * like .img-row img { aspect-ratio: 16/10; object-fit: contain } make that box
 * a different aspect than the bitmap; the clone is not under .img-row, so it
 * loses object-fit and the image stretches. Preserve natural aspect inside the
 * zoom box (letterboxing if needed).
 */
.medium-zoom-image.medium-zoom-image--opened {
  aspect-ratio: auto;
  object-fit: contain;
}
</style>
