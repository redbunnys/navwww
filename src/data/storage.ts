import type { AppBackground, NavData, NavItem, Settings } from '../types'
import { DEFAULT_WALLPAPER } from '../lib/background'

export const STORAGE_KEY = 'nav:data'
export const DATA_VERSION = 1

export const DEFAULT_BACKGROUND: AppBackground = {
  kind: 'image',
  value: DEFAULT_WALLPAPER,
  mask: 35,
  blur: 0,
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  tileSize: 'md',
  showNames: true,
  openInNewTab: true,
  engineId: 'baidu',
  background: DEFAULT_BACKGROUND,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function coerceBackground(raw: unknown): AppBackground {
  const input = (raw ?? {}) as Partial<AppBackground>
  const kind: AppBackground['kind'] =
    input.kind === 'gradient' || input.kind === 'image' || input.kind === 'color' ? input.kind : 'none'
  return {
    kind,
    value: typeof input.value === 'string' ? input.value : '',
    mask: clamp(typeof input.mask === 'number' ? input.mask : 35, 0, 90),
    blur: clamp(typeof input.blur === 'number' ? input.blur : 0, 0, 24),
  }
}

function coerceSettings(raw: unknown): Settings {
  const input = (raw ?? {}) as Partial<Settings>
  return {
    theme: input.theme === 'light' || input.theme === 'dark' ? input.theme : 'system',
    tileSize: input.tileSize === 'sm' || input.tileSize === 'lg' ? input.tileSize : 'md',
    showNames: input.showNames !== false,
    openInNewTab: input.openInNewTab !== false,
    engineId: typeof input.engineId === 'string' && input.engineId ? input.engineId : 'baidu',
    background: coerceBackground(input.background),
  }
}

export function migrate(raw: Partial<NavData>): NavData {
  const pages = Array.isArray(raw.pages) ? raw.pages.filter((p) => p && p.id && p.name) : []
  const items: Record<string, NavItem[]> = {}
  for (const page of pages) {
    const list = raw.items?.[page.id]
    items[page.id] = Array.isArray(list) ? list.filter((i) => i && i.id && i.name) : []
  }
  return {
    version: DATA_VERSION,
    pages,
    items,
    settings: coerceSettings(raw.settings),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

export function loadNav(): NavData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return migrate(JSON.parse(raw) as Partial<NavData>)
  } catch {
    return null
  }
}

export function saveNav(data: NavData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存本地数据失败', error)
  }
}

export function clearNav(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
