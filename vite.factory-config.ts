import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'url'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    build: {
      rollupOptions: {
        input: fileURLToPath(
          new URL('./create-ecedehey.html', import.meta.url)
        ),
      },
      emptyOutDir: true,
      outDir: './dist',
    },
  })
)
