import { ref } from "vue";
import { db } from "@/db";
import type { Website } from "@/types";
import { arrayBufferToUrl } from "./useImageUpload";

// 全局共享状态
const websites = ref<Website[]>([]);
const isLoading = ref(false);

// 进行中的加载任务，避免并发重复查询全表
let loadPromise: Promise<void> | null = null;

const loadWebsites = (): Promise<void> => {
  if (!loadPromise) {
    isLoading.value = true;
    loadPromise = (async () => {
      try {
        websites.value = await db.websites.toArray();
      } catch (error) {
        console.error("Failed to load websites:", error);
      } finally {
        isLoading.value = false;
        loadPromise = null;
      }
    })();
  }
  return loadPromise;
};

// 图标 blob URL 缓存：按 id 复用，updatedAt 变化时重建，避免数据刷新后重复创建导致内存泄漏
const iconUrlCache = new Map<number, { url: string; updatedAt: number }>();

export const getWebsiteIconUrl = (website: Website): string => {
  if (
    !website.icon ||
    website.icon.byteLength === 0 ||
    website.id === undefined
  ) {
    return "";
  }

  const stamp = website.updatedAt ? new Date(website.updatedAt).getTime() : 0;
  const cached = iconUrlCache.get(website.id);
  if (cached && cached.updatedAt === stamp) {
    return cached.url;
  }

  if (cached) {
    URL.revokeObjectURL(cached.url);
  }
  const url = arrayBufferToUrl(
    website.icon,
    website.iconMimeType || "image/png",
  );
  iconUrlCache.set(website.id, { url, updatedAt: stamp });
  return url;
};

const releaseIconUrl = (id: number) => {
  const cached = iconUrlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached.url);
    iconUrlCache.delete(id);
  }
};

export const useWebsites = () => {
  const addWebsite = async (
    websiteData: Omit<Website, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const now = new Date();
      const website: Website = {
        ...websiteData,
        createdAt: now,
        updatedAt: now,
      };
      await db.websites.add(website);
      await loadWebsites();
    } catch (error) {
      console.error("Failed to add website:", error);
      throw error;
    }
  };

  const updateWebsite = async (id: number, updates: Partial<Website>) => {
    try {
      const dataToUpdate = {
        ...updates,
        categoryIds: updates.categoryIds ? [...updates.categoryIds] : undefined,
        tagIds: updates.tagIds ? [...updates.tagIds] : undefined,
        apiKeys: updates.apiKeys ? [...updates.apiKeys] : undefined,
        updatedAt: new Date(),
      };
      await db.websites.update(id, dataToUpdate);
      await loadWebsites();
    } catch (error) {
      console.error("Failed to update website:", error);
      throw error;
    }
  };

  const deleteWebsite = async (id: number) => {
    try {
      await db.websites.delete(id);
      releaseIconUrl(id);
      await loadWebsites();
    } catch (error) {
      console.error("Failed to delete website:", error);
      throw error;
    }
  };

  return {
    websites,
    isLoading,
    loadWebsites,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    getWebsiteIconUrl,
  };
};
