<template>
  <div class="category-filter">
    <!-- 排序工具栏 -->
    <div class="sort-bar">
      <i class="mdi mdi-sort sort-icon" title="排序方式"></i>
      <div class="sort-options">
        <button
          v-for="mode in SORT_MODES"
          :key="mode.value"
          type="button"
          :class="['sort-btn', { active: sortMode === mode.value }]"
          @click="sortMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>
    <ul class="category-list">
      <li
        @click="selectCategory(null)"
        :class="['category-item', selectedCategoryId === null ? 'active' : '']"
      >
        <div class="category-icon">
          <i class="mdi mdi-apps"></i>
        </div>
        <span class="category-name">全部</span>
        <span class="category-count">{{ totalCount }}</span>
      </li>
      <li
        v-for="category in categoriesWithCount"
        :key="category.id"
        @click="selectCategory(category.id)"
        :class="[
          'category-item',
          selectedCategoryId === category.id ? 'active' : '',
        ]"
      >
        <div class="category-icon">
          <i :class="['mdi', `mdi-${category.iconName}`]"></i>
        </div>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-count">{{ category.count }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useCategories } from "@/composables/useCategories";
import { useWebsites } from "@/composables/useWebsites";

type SortMode = "default" | "name" | "count";

const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: "default", label: "默认" },
  { value: "name", label: "名称" },
  { value: "count", label: "数量" },
];

const SORT_STORAGE_KEY = "categorySortMode";

const appStore = useAppStore();
const { categories } = useCategories();
const { websites } = useWebsites();

const emit = defineEmits<{
  (e: "navigate"): void;
}>();

// 排序模式持久化，记住用户偏好
const sortMode = ref<SortMode>(
  (localStorage.getItem(SORT_STORAGE_KEY) as SortMode) || "default",
);

watch(sortMode, (mode) => {
  localStorage.setItem(SORT_STORAGE_KEY, mode);
});

const selectedCategoryId = computed(() => appStore.filter.categoryId);

const totalCount = computed(() => websites.value.length);

const isEnglishName = (name: string) => /^[a-zA-Z]/.test(name);

const compareByName = (a: { name?: string }, b: { name?: string }) =>
  (a.name || "").localeCompare(b.name || "", "zh-CN");

const categoriesWithCount = computed(() => {
  const resultArray = categories.value.map((category) => ({
    ...category,
    count: websites.value.filter((w) =>
      (w.categoryIds || []).includes(category.id!),
    ).length,
  }));

  if (sortMode.value === "count") {
    // 数量多 → 少，数量相同按名称排序
    resultArray.sort((a, b) => b.count - a.count || compareByName(a, b));
  } else if (sortMode.value === "name") {
    resultArray.sort(compareByName);
  } else {
    // 默认：英文开头的在前面，其余按拼音排序
    resultArray.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      if (isEnglishName(nameA) !== isEnglishName(nameB)) {
        return isEnglishName(nameA) ? -1 : 1;
      }
      return nameA.localeCompare(nameB, "zh-CN");
    });
  }

  return resultArray;
});

const selectCategory = (id: number | null) => {
  appStore.setCategoryId(id);
  // 通知父组件（移动端选中后收起侧边栏）
  emit("navigate");
};
</script>

<style scoped>
.category-filter {
  padding: 0 4px;
}

/* 排序工具栏 */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin: 0 4px 12px;
  border-radius: 12px;
  background: var(--bg-primary);
}

.neumorphism-theme .sort-bar {
  box-shadow: var(--shadow-inset-small);
}

.sort-icon {
  color: var(--text-secondary);
  font-size: 1rem;
  flex-shrink: 0;
}

.sort-options {
  display: flex;
  gap: 6px;
  flex: 1;
}

.sort-btn {
  flex: 1;
  padding: 5px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 8px;
  background: var(--bg-primary);
  transition: all 0.2s ease-out;
}

.neumorphism-theme .sort-btn {
  box-shadow: var(--shadow-extruded-small);
}

.sort-btn:hover {
  color: var(--accent);
}

.neumorphism-theme .sort-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-extruded);
}

.sort-btn.active {
  color: var(--accent);
}

.neumorphism-theme .sort-btn.active {
  transform: none;
  box-shadow: var(--shadow-inset-small);
}

.filter-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 8px 16px 8px;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease-out;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 500;
  background: var(--bg-primary);
}

/* Neumorphism category item */
.neumorphism-theme .category-item {
  box-shadow: var(--shadow-extruded-small);
}

.neumorphism-theme .category-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-extruded);
}

.neumorphism-theme .category-item.active {
  box-shadow: var(--shadow-inset);
  color: var(--accent);
}

.category-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: all 0.3s ease-out;
}

/* Neumorphism category icon */
.neumorphism-theme .category-icon {
  box-shadow: var(--shadow-inset-small);
}

.neumorphism-theme .category-item.active .category-icon {
  background: var(--accent);
  color: #ffffff;
  box-shadow:
    3px 3px 6px rgba(108, 99, 255, 0.4),
    -3px -3px 6px rgba(139, 132, 255, 0.3);
}

.category-icon .mdi {
  font-size: 1.125rem;
}

.category-name {
  flex: 1;
  letter-spacing: -0.01em;
}

.category-count {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
  min-width: 28px;
  text-align: center;
  transition: all 0.3s ease-out;
  background: var(--bg-primary);
}

/* Neumorphism category count */
.neumorphism-theme .category-count {
  box-shadow: var(--shadow-inset-small);
}

.neumorphism-theme .category-item.active .category-count {
  background: var(--accent);
  color: #ffffff;
  box-shadow:
    inset 2px 2px 4px rgba(0, 0, 0, 0.15),
    inset -2px -2px 4px rgba(255, 255, 255, 0.1);
}
</style>
