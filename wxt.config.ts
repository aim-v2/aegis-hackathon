import { defineConfig } from 'wxt'

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {
      default_title: 'Aegis',
    },
    
    description: "Aegis revolutionizes prediction markets by solving their most critical challenge: trust in market resolution.",
    name: "Aegis",
    permissions: [
      "storage",
      "tabs"
    ],

    host_permissions: [
      "https://api.openai.com/"
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'"
    }
  }
})