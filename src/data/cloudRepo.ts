import { api, isOfflineError } from './api'
import { createDefaultData } from './defaults'
import { preserveLocalBackground, toCloudData } from './merge'
import { clearPending, loadMirror, loadPending, saveMirror, savePending, setCloudStatus } from './offline'
import { localRepository } from './repo'
import { loadNav } from './storage'
import type { NavRepository } from './repo'
import type { NavData } from '../types'

export interface CloudAuth {
  token: string
  userId: string
}

/**
 * 云端数据仓库，带本地镜像与离线队列：
 * - 每次改动先写本地镜像和待同步队列，再推云端；推失败也不会丢
 * - 读取时先补推待同步数据，请求失败则回退本地镜像，所以断网冷启动也能用
 */
export function createCloudRepository(getAuth: () => CloudAuth | null): NavRepository {
  let queue: NavData | null = null
  let draining = false

  async function drain(auth: CloudAuth): Promise<void> {
    if (draining) return
    draining = true
    setCloudStatus({ syncing: true })
    try {
      for (;;) {
        const pending = loadPending(auth.userId)
        const payload = pending?.data ?? queue
        if (!payload) break
        const rev = pending ? pending.rev : savePending(auth.userId, payload)
        queue = null
        await api.saveData(auth.token, toCloudData(payload))
        clearPending(auth.userId, rev)
        saveMirror(auth.userId, payload)
      }
      setCloudStatus({ syncing: false, offline: false, pending: false, error: null })
    } catch (error) {
      setCloudStatus({
        syncing: false,
        offline: isOfflineError(error),
        pending: true,
        error: error instanceof Error ? error.message : '同步失败',
      })
      throw error
    } finally {
      draining = false
    }
  }

  return {
    async load() {
      const auth = getAuth()
      if (!auth) return localRepository.load()

      try {
        await drain(auth)
      } catch (error) {
        if (!isOfflineError(error)) throw error
      }

      try {
        const { data } = await api.loadData(auth.token)
        const local = loadNav()
        const result =
          !data || !Array.isArray(data.pages) || data.pages.length === 0
            ? preserveLocalBackground(createDefaultData(), local)
            : preserveLocalBackground(data, local)
        saveMirror(auth.userId, result)
        setCloudStatus({ offline: false, pending: false, error: null })
        return result
      } catch (error) {
        if (!isOfflineError(error)) throw error
        setCloudStatus({ offline: true, pending: Boolean(loadPending(auth.userId)), error: null })
        const cached = loadPending(auth.userId)?.data ?? loadMirror(auth.userId)
        if (cached) return preserveLocalBackground(cached, loadNav())
        throw error
      }
    },

    async save(data) {
      const auth = getAuth()
      if (!auth) return
      saveMirror(auth.userId, data)
      savePending(auth.userId, data)
      queue = data
      setCloudStatus({ pending: true })
      try {
        await drain(auth)
      } catch {
        /* 失败原因已经记进状态里，联网后由 flush 重试 */
      }
    },

    async reset() {
      const auth = getAuth()
      if (!auth) return localRepository.reset()
      const data = createDefaultData()
      queue = null
      saveMirror(auth.userId, data)
      savePending(auth.userId, data)
      setCloudStatus({ pending: true })
      try {
        await drain(auth)
      } catch {
        /* 同上 */
      }
      return data
    },

    async flush() {
      const auth = getAuth()
      if (!auth) return
      if (!queue && !loadPending(auth.userId)) return
      try {
        await drain(auth)
      } catch {
        /* 保持待同步状态，等下一次重试 */
      }
    },
  }
}
