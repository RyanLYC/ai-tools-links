import { ref } from 'vue'
import { db } from '@/db'
import type { Tag } from '@/types'

const globalTags = ref<Tag[]>([])
// 进行中的加载任务，避免并发重复查询
let tagsPromise: Promise<void> | null = null

const loadTags = (): Promise<void> => {
  if (!tagsPromise) {
    tagsPromise = (async () => {
      try {
        globalTags.value = await db.tags.toArray()
      } catch (error) {
        console.error('Failed to load tags:', error)
      } finally {
        tagsPromise = null
      }
    })()
  }
  return tagsPromise
}

export const useTags = () => {
  const tags = globalTags

  const addTag = async (tag: Omit<Tag, 'id'>) => {
    try {
      await db.tags.add(tag)
      await loadTags()
    } catch (error) {
      console.error('Failed to add tag:', error)
      throw error
    }
  }

  const updateTag = async (id: number, updates: Partial<Tag>) => {
    try {
      await db.tags.update(id, updates)
      await loadTags()
    } catch (error) {
      console.error('Failed to update tag:', error)
      throw error
    }
  }

  const deleteTag = async (id: number) => {
    try {
      await db.tags.delete(id)
      await loadTags()
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  }

  return {
    tags,
    loadTags,
    addTag,
    updateTag,
    deleteTag
  }
}
