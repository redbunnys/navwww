import type { NavData, NavItem, NavPage } from '../types'

function laterItem(a: NavItem, b: NavItem): NavItem {
  return (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? a : b
}

export function mergeNavData(local: NavData, cloud: NavData): NavData {
  const pages: NavPage[] = []
  const seen = new Set<string>()
  for (const page of [...cloud.pages, ...local.pages]) {
    if (seen.has(page.id)) continue
    seen.add(page.id)
    pages.push(page)
  }

  const items: NavData['items'] = {}
  for (const page of pages) {
    const merged = new Map<string, NavItem>()
    for (const item of [...(cloud.items[page.id] ?? []), ...(local.items[page.id] ?? [])]) {
      const current = merged.get(item.id)
      merged.set(item.id, current ? laterItem(current, item) : item)
    }
    items[page.id] = [...merged.values()]
  }

  const newer = (local.updatedAt ?? 0) >= (cloud.updatedAt ?? 0) ? local : cloud
  return {
    version: newer.version,
    pages,
    items,
    settings: { ...newer.settings, background: local.settings.background },
    updatedAt: Date.now(),
  }
}

export function toCloudData(data: NavData): NavData {
  const { background } = data.settings
  const value = background.value.startsWith('data:') ? '' : background.value
  return { ...data, settings: { ...data.settings, background: { ...background, value } } }
}

export function preserveLocalBackground(cloud: NavData, local: NavData | null): NavData {
  const cloudBackground = cloud.settings.background
  if (cloudBackground.kind !== 'none' && cloudBackground.value) return cloud
  if (!local) return cloud
  return { ...cloud, settings: { ...cloud.settings, background: local.settings.background } }
}
