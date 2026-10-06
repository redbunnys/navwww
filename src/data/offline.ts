import { useSyncExternalStore } from 'react'
import type { NavData } from '../types'
import { migrate } from './storage'

const MIRROR_PREFIX = 'nav:cloud-mirror:'
const PENDING_PREFIX = 'nav:cloud-pending:'

export interface PendingChange {
  rev: number
  data: NavData
}

export interface CloudStatus {
  offline: boolean
  syncing: boolean
  pending: boolean
  error: string | null
}

const INITIAL_STATUS: CloudStatus = {
  offline: typeof navigator !== 'undefined' && navigator.onLine === false,
  syncing: false,
  pending: false,
  error: null,
}

let status: CloudStatus = INITIAL_STATUS
const listeners = new Set<() => void>()

let revCounter = 0

function nextRev(): number {
  const now = Date.now()
  revCounter = now > revCounter ? now : revCounter + 1
  return revCounter
}

function readData(raw: string | null): NavData | null {
  if (!raw) return null
  try {
    return migrate(JSON.parse(raw) as Partial<NavData>)
  } catch {
    return null
  }
}

/** 壁纸是 data: URL 时体积可能很大，写不进 localStorage 就退化成不存壁纸 */
function stripWallpaper(data: NavData): NavData {
  const { background } = data.settings
  if (!background.value.startsWith('data:')) return data
  return {
    ...data,
    settings: { ...data.settings, background: { ...background, value: '' } },
  }
}

function write(key: string, value: unknown, fallback: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return
  } catch {
    /* 超出配额，尝试去掉壁纸再写一次 */
  }
  try {
    localStorage.setItem(key, JSON.stringify(fallback))
  } catch {
    /* 仍然写不进去，放弃持久化 */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function loadMirror(userId: string): NavData | null {
  try {
    return readData(localStorage.getItem(`${MIRROR_PREFIX}${userId}`))
  } catch {
    return null
  }
}

export function saveMirror(userId: string, data: NavData): void {
  write(`${MIRROR_PREFIX}${userId}`, data, stripWallpaper(data))
}

export function clearMirror(userId: string): void {
  remove(`${MIRROR_PREFIX}${userId}`)
}

export function loadPending(userId: string): PendingChange | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(`${PENDING_PREFIX}${userId}`)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PendingChange>
    const data = parsed.data ? migrate(parsed.data) : null
    if (!data) return null
    return { rev: typeof parsed.rev === 'number' ? parsed.rev : 0, data }
  } catch {
    return null
  }
}

export function savePending(userId: string, data: NavData): number {
  const rev = nextRev()
  write(`${PENDING_PREFIX}${userId}`, { rev, data }, { rev, data: stripWallpaper(data) })
  return rev
}

/** 只在期间没有产生新的改动时才清除，避免覆盖掉更新的待同步数据 */
export function clearPending(userId: string, rev: number): void {
  const current = loadPending(userId)
  if (current && current.rev !== rev) return
  remove(`${PENDING_PREFIX}${userId}`)
}

export function getCloudStatus(): CloudStatus {
  return status
}

export function setCloudStatus(patch: Partial<CloudStatus>): void {
  const next = { ...status, ...patch }
  if (
    next.offline === status.offline &&
    next.syncing === status.syncing &&
    next.pending === status.pending &&
    next.error === status.error
  ) {
    return
  }
  status = next
  listeners.forEach((listener) => listener())
}

export function useCloudStatus(): CloudStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getCloudStatus,
    () => INITIAL_STATUS,
  )
}
