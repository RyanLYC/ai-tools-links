import { ref } from "vue";

const currentTheme = ref("neumorphism");

const setTheme = (theme: string) => {
  currentTheme.value = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

const loadTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  setTheme(savedTheme === "neumorphism" ? savedTheme : "neumorphism");
};

export const useTheme = () => {
  // setup 阶段同步恢复主题，避免首帧 data-theme 缺失导致样式闪烁
  loadTheme();

  return {
    currentTheme,
    setTheme,
  };
};
