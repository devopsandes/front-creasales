import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'FRONT_'],
  plugins: [
    react(),
    tailwindcss()
  ],
})
