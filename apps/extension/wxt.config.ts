import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Watchly',
    description: 'Watchly - YouTube video tracker & productivity companion',
    permissions: ['tabs', 'storage'],
    host_permissions: ['*://www.youtube.com/*'],
    action: {
      default_title: 'Watchly',
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '96': 'icon/96.png',
        '128': 'icon/128.png',
      },
    },
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
  },
})
