import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'url'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    build: {
      rollupOptions: {
        input: fileURLToPath(new URL('./key-template.html', import.meta.url)),
      },
    },
  })
)
