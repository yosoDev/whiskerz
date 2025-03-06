import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: (format) => `whiskerz.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {},
  },
  plugins: [dts({ rollupTypes: true })],
  server: {
    hmr: true,
    open: true,
  },
})
