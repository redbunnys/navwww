import { createId } from '../types'
import type { NavData, NavItem, NavPage } from '../types'

export interface ImportedBookmark {
  name: string
  url: string
  createdAt: number
}

export interface ImportedGroup {
  name: string
  items: ImportedBookmark[]
}

export interface BookmarkImportResult {
  data: NavData
  added: number
  skipped: number
  newPages: number
}

const ROOT_GROUP = '收藏夹'
const PAGE_ICONS = ['world', 'book', 'star', 'like', 'news', 'home', 'work', 'grid']
const UNSAFE_SCHEME = /^(javascript|data|vbscript|file|chrome|chrome-extension|edge|about|place|blob):/i

function cleanText(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function isImportable(url: string): boolean {
  return /^https?:\/\//i.test(url) && !UNSAFE_SCHEME.test(url)
}

function urlKey(url: string | undefined): string {
  return (url ?? '')
    .trim()
    .toLowerCase()
    .replace(/[/?#]+$/, '')
}

function walk(node: Element, path: string[], groups: Map<string, ImportedGroup>, seen: Set<string>): void {
  let pending: string | null = null
  for (const child of Array.from(node.children)) {
    const tag = child.tagName
    if (tag === 'H3') {
      const name = cleanText(child.textContent)
      if (name) pending = name
      continue
    }
    if (tag === 'A') {
      const url = cleanText(child.getAttribute('href'))
      const key = urlKey(url)
      if (isImportable(url) && key && !seen.has(key)) {
        seen.add(key)
        const groupKey = path.join('\u0000')
        let group = groups.get(groupKey)
        if (!group) {
          group = { name: path.length ? path.join(' / ') : ROOT_GROUP, items: [] }
          groups.set(groupKey, group)
        }
        const addDate = Number(child.getAttribute('add_date') ?? 0)
        group.items.push({
          name: cleanText(child.textContent) || url,
          url,
          createdAt: addDate > 0 ? addDate * 1000 : Date.now(),
        })
      }
      continue
    }
    if (tag === 'DL') {
      walk(child, pending ? [...path, pending] : path, groups, seen)
      pending = null
      continue
    }
    walk(child, path, groups, seen)
  }
}

export function parseBookmarkHtml(html: string): ImportedGroup[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const groups = new Map<string, ImportedGroup>()
  const seen = new Set<string>()
  if (doc.body) walk(doc.body, [], groups, seen)
  return [...groups.values()].filter((group) => group.items.length > 0)
}

export function importBookmarkGroups(data: NavData, groups: ImportedGroup[]): BookmarkImportResult {
  const known = new Set<string>()
  for (const list of Object.values(data.items)) {
    for (const item of list) {
      const key = urlKey(item.url)
      if (key) known.add(key)
    }
  }

  const pages: NavPage[] = [...data.pages]
  const items: NavData['items'] = { ...data.items }
  const now = Date.now()
  let added = 0
  let skipped = 0
  let newPages = 0

  for (const group of groups) {
    const fresh: NavItem[] = []
    for (const bookmark of group.items) {
      const key = urlKey(bookmark.url)
      if (!key || known.has(key)) {
        skipped += 1
        continue
      }
      known.add(key)
      fresh.push({
        id: createId('item'),
        type: 'bookmark',
        name: bookmark.name,
        url: bookmark.url,
        createdAt: bookmark.createdAt,
        updatedAt: now,
      })
    }
    if (fresh.length === 0) continue

    const existing = pages.find((page) => page.name === group.name)
    if (existing) {
      items[existing.id] = [...(items[existing.id] ?? []), ...fresh]
    } else {
      const page: NavPage = {
        id: createId('page'),
        name: group.name,
        icon: PAGE_ICONS[newPages % PAGE_ICONS.length],
      }
      pages.push(page)
      items[page.id] = fresh
      newPages += 1
    }
    added += fresh.length
  }

  return { data: { ...data, pages, items }, added, skipped, newPages }
}
