import { ref } from "vue";
import { db } from "@/db";
import type { Category } from "@/types";

const globalCategories = ref<Category[]>([]);
// 进行中的加载任务，避免并发重复查询
let categoriesPromise: Promise<void> | null = null;

const loadCategories = (): Promise<void> => {
  if (!categoriesPromise) {
    categoriesPromise = (async () => {
      try {
        globalCategories.value = await db.categories.toArray();
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        categoriesPromise = null;
      }
    })();
  }
  return categoriesPromise;
};

export const useCategories = () => {
  const categories = globalCategories;

  const addCategory = async (category: Omit<Category, "id">) => {
    try {
      await db.categories.add(category);
      await loadCategories();
    } catch (error) {
      console.error("Failed to add category:", error);
      throw error;
    }
  };

  const updateCategory = async (id: number, updates: Partial<Category>) => {
    try {
      await db.categories.update(id, updates);
      await loadCategories();
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await db.categories.delete(id);
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  };

  return {
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
