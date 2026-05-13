import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "./",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-vendor": ["vue", "pinia"],
          dexie: ["dexie"],
        },
      },
    },
  },
  server: {
    port: 8800,
    open: true,
  },
  // 预览环境配置
  preview: {
    port: 7080, // 指定端口号
    strictPort: true, // 如果端口被占用，直接退出。如果不设置，Vite 会自动尝试下一个可用端口
    open: true, // 启动完成后是否自动打开浏览器
  },
});
