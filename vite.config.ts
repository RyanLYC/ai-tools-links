import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  base: "./",
  // vueDevTools 仅在 dev 模式注入，构建产物不受影响
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) 仅支持函数形式的 manualChunks
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("dexie")) return "dexie";
            if (
              id.includes("/vue/") ||
              id.includes("@vue/") ||
              id.includes("pinia")
            ) {
              return "vue-vendor";
            }
          }
        },
      },
    },
  },
  server: {
    port: 7080,
    open: true,
  },
  // 预览环境配置
  preview: {
    port: 7080, // 指定端口号
    strictPort: true, // 如果端口被占用，直接退出。如果不设置，Vite 会自动尝试下一个可用端口
    open: true, // 启动完成后是否自动打开浏览器
  },
});
