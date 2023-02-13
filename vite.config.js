import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import ReactivityTransform from '@vue-macros/reactivity-transform/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ReactivityTransform(),
    VitePWA({
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "logo.svg"],
      manifest: {
        name: "BFM Radio",
        short_name: "BFM Radio",
        description: "Online stream radio",
        theme_color: "#4d7fa7",
        icons: [
          // {
          //   src: "pwa-192x192.png",
          //   sizes: "192x192",
          //   type: "image/png",
          // },
          // {
          //   src: "pwa-512x512.png",
          //   sizes: "512x512",
          //   type: "image/png",
          // },
        ],
      },
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      }
    })
  ],
})
