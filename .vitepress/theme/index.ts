import DefaultTheme, { VPButton } from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import MermaidDiagram from './MermaidDiagram.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('VPButton', VPButton)
    app.component('MermaidDiagram', MermaidDiagram)
  },
} satisfies Theme
