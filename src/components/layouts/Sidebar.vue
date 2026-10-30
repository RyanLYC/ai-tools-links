<template>
  <aside
    :class="['sidebar', { open: isOpen }]"
    aria-label="分类导航"
    @click.self="$emit('close')"
  >
    <div class="sidebar-content">
      <CategoryFilter @navigate="$emit('close')" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from "vue";
import CategoryFilter from "@/components/filter/CategoryFilter.vue";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// Esc 键关闭侧边栏（仅打开时监听）
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    emit("close");
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.addEventListener("keydown", handleKeydown);
    } else {
      document.removeEventListener("keydown", handleKeydown);
    }
  },
);

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  width: 280px;
  height: 100vh;
  height: 100dvh; /* 移动端动态地址栏适配 */
  background: var(--bg-primary);
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

/* Neumorphism sidebar */
.neumorphism-theme .sidebar {
  box-shadow:
    6px 0 16px rgb(163, 177, 198, 0.5),
    -4px 0 10px rgba(255, 255, 255, 0.4);
}

.sidebar-content {
  padding: 12px 8px;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

/* Neumorphism scrollbar */
.neumorphism-theme .sidebar::-webkit-scrollbar-thumb {
  background: var(--bg-primary);
  border-radius: 3px;
  box-shadow: var(--shadow-extruded-small);
}

@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 60px;
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
    transform: translateX(0);
    box-shadow: none;
  }
}

@media (max-width: 1023px) {
  .sidebar::after {
    content: "";
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    z-index: -1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .sidebar.open::after {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
