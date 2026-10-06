import { api } from './api'
import { createDefaultData } from './defaults'
import { preserveLocalBackground, toCloudData } from './merge'
import { loadNav } from './storage'
import type { NavRepository } from './repo'
import type { NavData } from '../types'

export function createCloudRepository(getToken: () => string): NavRepository {
  let queue: NavData | null = null
  let draining = false

  async function drain(): Promise<void> {
    if (draining) return
    draining = true
    try {
      while (queue) {
        const payload = queue
        queue = null
        await api.saveData(getToken(), toCloudData(payload))
      }
    } finally {
      draining = false
    }
  }

  return {
    async load() {
      const { data } = await api.loadData(getToken())
      const local = loadNav()
      if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
        return preserveLocalBackground(createDefaultData(), local)
      }
      return preserveLocalBackground(data, local)
    },

    async save(data) {
      queue = data
      await drain()
    },

    async reset() {
      queue = null
      const data = createDefaultData()
      await api.saveData(getToken(), toCloudData(data))
      return data
    },
  }
}
