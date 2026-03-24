import DefaultTheme, { VPButton } from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('VPButton', VPButton)
  },
} satisfies Theme
