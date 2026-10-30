import { defineStore } from "pinia";
import { ref } from "vue";
import type { FilterState } from "@/types";

export const useAppStore = defineStore("app", () => {
  const filter = ref<FilterState>({
    categoryId: null,
    tagIds: [],
    searchQuery: "",
  });

  const setCategoryId = (id: number | null) => {
    filter.value.categoryId = id;
  };

  const setTagIds = (ids: number[]) => {
    filter.value.tagIds = ids;
  };

  const toggleTagId = (id: number) => {
    const index = filter.value.tagIds.indexOf(id);
    if (index === -1) {
      filter.value.tagIds.push(id);
    } else {
      filter.value.tagIds.splice(index, 1);
    }
  };

  const setSearchQuery = (query: string) => {
    // 保存原始输入，过滤时再小写化，避免界面展示被小写化的文本
    filter.value.searchQuery = query;
  };

  const resetFilter = () => {
    filter.value = {
      categoryId: null,
      tagIds: [],
      searchQuery: "",
    };
  };

  return {
    filter,
    setCategoryId,
    setTagIds,
    toggleTagId,
    setSearchQuery,
    resetFilter,
  };
});
