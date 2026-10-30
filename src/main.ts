import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./styles/main.css";
import { seedDatabase } from "./db/seed";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// 初始化数据库种子数据
seedDatabase()
  .then(() => {
    app.mount("#app");
  })
  .catch((error) => {
    console.error("Failed to seed database:", error);
    app.mount("#app");
  });

// 注册 Service Worker：仅 http(s) 环境生效（Chrome 扩展为 chrome-extension:// 协议，跳过）
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
