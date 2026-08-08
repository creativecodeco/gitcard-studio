import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://gitcard-studio.creativecode.com.co',
  outDir: '../public',
  build: {
    format: 'file'
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    ssr: {
      noExternal: ['cookie']
    }
  }
});
