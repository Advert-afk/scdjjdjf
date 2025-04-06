// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/baidu-api': {
        target: 'https://fanyi-api.baidu.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/baidu-api/, '/api/trans/vip')
      }
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/vars.scss";`
      }
    }
  }
});