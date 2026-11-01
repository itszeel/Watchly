import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['tabs', 'storage'],
    host_permissions: ['*://www.youtube.com/*'],
  },
})
