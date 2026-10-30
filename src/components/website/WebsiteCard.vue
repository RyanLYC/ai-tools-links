<template>
  <!-- 点击整卡直接访问网站；详情/编辑/删除在 hover 工具栏 -->
  <div @click="handleOpen" class="website-card" title="点击访问网站">
    <!-- Hover Actions -->
    <div class="card-actions">
      <button @click.stop="handleDetail" class="action-btn" title="查看详情">
        <i class="mdi mdi-eye-outline"></i>
      </button>
      <button @click.stop="handleEdit" class="action-btn" title="编辑">
        <i class="mdi mdi-pencil-outline"></i>
      </button>
      <button
        @click.stop="handleDelete"
        class="action-btn action-delete"
        title="删除"
      >
        <i class="mdi mdi-delete-outline"></i>
      </button>
    </div>

    <div class="card-header">
      <div class="card-icon-wrapper">
        <img
          v-if="iconUrl"
          :src="iconUrl"
          :alt="website.name"
          class="website-icon"
          @error="handleIconError"
        />
        <!-- 无上传图标时自动回退到站点 favicon -->
        <img
          v-else-if="faviconUrl"
          :src="faviconUrl"
          :alt="website.name"
          class="website-icon"
          loading="lazy"
          @error="faviconFailed = true"
        />
        <div v-else class="website-icon placeholder-icon">
          <i class="mdi mdi-application-outline"></i>
        </div>
      </div>
      <div class="card-info">
        <h3 class="website-name">{{ website.name }}</h3>
        <!-- Categories as tag style -->
        <div class="category-tags" v-if="categoryNames.length > 0">
          <span v-for="name in categoryNames" :key="name" class="category-tag">
            {{ name }}
          </span>
        </div>
      </div>
    </div>

    <p class="description" :title="website.description">
      {{ website.description }}
    </p>

    <!-- Tags as #tagname -->
    <div class="card-tags" v-if="(website.tagIds || []).length > 0">
      <span
        v-for="tagId in (website.tagIds || []).slice(0, 4)"
        :key="tagId"
        class="hash-tag"
      >
        #{{ getTagName(tagId) }}
      </span>
      <span v-if="(website.tagIds?.length || 0) > 4" class="hash-tag more">
        +{{ website.tagIds.length - 4 }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Website } from "@/types";
import { useCategories } from "@/composables/useCategories";
import { useTags } from "@/composables/useTags";
import { getWebsiteIconUrl } from "@/composables/useWebsites";
import { getFaviconUrl } from "@/composables/useImageUpload";

const props = defineProps<{
  website: Website;
}>();

const emit = defineEmits<{
  (e: "detail"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}>();

const { categories } = useCategories();
const { tags } = useTags();

// 图标 blob URL 由 useWebsites 模块级缓存统一管理（按 id 复用、按 updatedAt 重建）
const iconUrl = computed(() => getWebsiteIconUrl(props.website));

// 自动获取站点 favicon（无上传图标时的回退），加载失败后不再重试
const faviconFailed = ref(false);
watch(
  () => props.website.id,
  () => {
    faviconFailed.value = false;
  },
);

const faviconUrl = computed(() => {
  if (iconUrl.value || faviconFailed.value) return "";
  return getFaviconUrl(props.website.url);
});

const categoryNames = computed(() => {
  return (props.website.categoryIds || [])
    .map((id) => categories.value.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];
});

const getTagName = (tagId: number) => {
  const tag = tags.value.find((t) => t.id === tagId);
  return tag?.name || "";
};

// 点击整卡：新标签页直接访问网站
const handleOpen = () => {
  window.open(props.website.url, "_blank", "noopener,noreferrer");
};

const handleDetail = () => {
  emit("detail");
};

const handleEdit = () => {
  emit("edit");
};

const handleDelete = () => {
  if (confirm("确定要删除这个网站吗？")) {
    emit("delete");
  }
};

const handleIconError = () => {
  console.warn(`Failed to load icon for ${props.website.name}`);
};
</script>

<style scoped>
.website-card {
  cursor: pointer;
  transition: all 0.3s ease-out;
  background: var(--bg-primary);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

/* Card Actions */
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
  z-index: 10;
}

.website-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 8px;
  transition: all 0.15s ease;
}

.neumorphism-theme .action-btn {
  box-shadow: var(--shadow-extruded-small);
}

.action-btn:hover {
  color: var(--accent);
  background: var(--bg-secondary);
}

.action-btn.action-delete:hover {
  color: #ff3b30;
}

.action-btn .mdi {
  font-size: 0.875rem;
}

/* Neumorphism card */
.neumorphism-theme .website-card {
  box-shadow: var(--shadow-extruded);
  border: none;
}

.neumorphism-theme .website-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-extruded-hover);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon-wrapper {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.website-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: var(--bg-primary);
  transition: transform 0.25s ease-out;
}

.website-card:hover .website-icon {
  transform: scale(1.08);
}

/* Neumorphism icon */
.neumorphism-theme .website-icon {
  box-shadow: var(--shadow-inset);
  border: none;
}

.website-icon.placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

/* Neumorphism placeholder icon */
.neumorphism-theme .website-icon.placeholder-icon {
  box-shadow: var(--shadow-inset-deep);
}

.website-icon.placeholder-icon .mdi {
  font-size: 16px;
  opacity: 0.5;
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.website-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.website-card:hover .website-name {
  color: var(--accent);
}

/* Category Tags */
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.category-tag {
  display: inline-block;
  width: fit-content;
  padding: 2px 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 8px;
  font-size: 0.6875rem;
  font-weight: 500;
  transition: all 0.3s ease-out;
}

.neumorphism-theme .category-tag {
  box-shadow: var(--shadow-inset-small);
}

/* Hash Tags */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.hash-tag {
  font-size: 0.6875rem;
  color: var(--accent);
  font-weight: 500;
  transition: color 0.2s ease;
}

.hash-tag:hover {
  color: var(--accent-light);
}

.hash-tag.more {
  color: var(--text-secondary);
}

.description {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1; /* 单行省略，悬停看全文 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .website-card {
    padding: 10px 12px;
    border-radius: 12px;
    gap: 6px;
  }

  .card-icon-wrapper {
    width: 28px;
    height: 28px;
  }

  .website-icon {
    border-radius: 6px;
  }

  .website-icon.placeholder-icon .mdi {
    font-size: 14px;
  }

  .website-name {
    font-size: 0.9375rem;
  }

  .description {
    font-size: 0.8125rem;
  }

  .hash-tag {
    font-size: 0.6875rem;
  }
}
</style>
