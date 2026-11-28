import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/q_comemos_pedidos/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/,
              priority: 1,
              maxSize: 400_000,
            },
          ],
        },
      },
    },
  },
}))
