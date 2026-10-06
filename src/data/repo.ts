import type { NavData } from '../types'
import { createDefaultData } from './defaults'
import { clearNav, loadNav, saveNav } from './storage'

export interface NavRepository {
  load(): Promise<NavData>
  save(data: NavData): Promise<void>
  reset(): Promise<NavData>
  /** 可选：把离线期间攒下的改动补推到远端，本地仓库不需要 */
  flush?(): Promise<void>
}

export const localRepository: NavRepository = {
  async load() {
    const stored = loadNav()
    if (stored && stored.pages.length > 0) return stored
    const initial = createDefaultData()
    saveNav(initial)
    return initial
  },

  async save(data) {
    saveNav(data)
  },

  async reset() {
    clearNav()
    const initial = createDefaultData()
    saveNav(initial)
    return initial
  },
}
