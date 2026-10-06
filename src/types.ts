export type ItemType = 'bookmark' | 'folder'

export type BackgroundKind = 'none' | 'gradient' | 'image' | 'color'

export interface AppBackground {
  kind: BackgroundKind
  value: string
  mask: number
  blur: number
}

export interface NavItem {
  id: string
  type: ItemType
  name: string
  url?: string
  detail?: string
  icon?: string
  color?: string
  favorite?: boolean
  clicks?: number
  createdAt: number
  updatedAt: number
}

export interface NavPage {
  id: string
  name: string
  icon: string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  tileSize: 'sm' | 'md' | 'lg'
  showNames: boolean
  openInNewTab: boolean
  engineId: string
  background: AppBackground
}

export interface NavData {
  version: number
  pages: NavPage[]
  items: Record<string, NavItem[]>
  settings: Settings
  updatedAt: number
}

export const FAVORITES_PAGE_ID = '__favorites__'

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
