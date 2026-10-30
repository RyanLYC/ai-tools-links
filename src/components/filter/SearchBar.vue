<template>
  <div class="search-bar">
    <i class="mdi mdi-magnify search-icon"></i>
    <input
      ref="inputRef"
      v-model="searchQuery"
      type="text"
      placeholder="搜索工具..."
      class="search-input"
      @input="handleSearch"
    />
    <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
      <i class="mdi mdi-close-circle"></i>
    </button>
    <kbd v-else class="search-kbd">Ctrl K</kbd>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();
const searchQuery = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

// 300ms 防抖，避免每次击键都触发全量过滤
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    appStore.setSearchQuery(searchQuery.value);
  }, 300);
};

const clearSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchQuery.value = "";
  appStore.setSearchQuery("");
};

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

// Ctrl/Cmd + K 全局聚焦搜索框
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    inputRef.value?.focus();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<style scoped>
.search-bar {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 18px;
  color: var(--text-secondary);
  font-size: 1.125rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 48px 14px 48px;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 400;
  background: var(--bg-primary);
  border: none;
  transition: all 0.3s ease-out;
  color: var(--text-primary);
}

/* Neumorphism search input */
.neumorphism-theme .search-input {
  box-shadow: var(--shadow-inset);
}

.neumorphism-theme .search-input:focus {
  box-shadow: var(--shadow-inset-deep);
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.search-input::placeholder {
  color: #a0aec0;
}

.clear-btn {
  position: absolute;
  right: 14px;
  padding: 6px;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 50%;
  transition: all 0.3s ease-out;
}

.clear-btn:hover {
  color: var(--text-primary);
}

/* Neumorphism clear button */
.neumorphism-theme .clear-btn:hover {
  background: var(--bg-primary);
  box-shadow: var(--shadow-extruded-small);
}

.clear-btn .mdi {
  font-size: 1.125rem;
}

/* 快捷键提示键帽 */
.search-kbd {
  position: absolute;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 6px;
  background: var(--bg-primary);
  pointer-events: none;
}

.neumorphism-theme .search-kbd {
  box-shadow: var(--shadow-extruded-small);
}

@media (max-width: 640px) {
  .search-kbd {
    display: none; /* 移动端无物理键盘，隐藏提示 */
  }

  .search-input {
    padding: 12px 40px 12px 44px;
    border-radius: 14px;
    font-size: 0.875rem;
  }

  .search-icon {
    left: 14px;
    font-size: 1rem;
  }

  .clear-btn {
    right: 10px;
    padding: 4px;
  }

  .clear-btn .mdi {
    font-size: 1rem;
  }
}
</style>
