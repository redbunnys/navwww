import { pinyin } from 'pinyin-pro'
import type { NavData, NavItem } from '../types'

export interface SearchDoc {
  item: NavItem
  pageId: string
  pageName: string
  name: string
  url: string
  host: string
  haystack: string
  initials: string
}

function initialsOf(text: string): string {
  try {
    return pinyin(text, { pattern: 'first', toneType: 'none', type: 'array' })
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  } catch {
    return ''
  }
}

export function buildSearchIndex(data: NavData): SearchDoc[] {
  const docs: SearchDoc[] = []
  for (const page of data.pages) {
    for (const item of data.items[page.id] ?? []) {
      const url = item.url ?? ''
      const host = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      const haystack = [item.name, host, item.detail, page.name].filter(Boolean).join(' ').toLowerCase()
      docs.push({
        item,
        pageId: page.id,
        pageName: page.name,
        name: item.name,
        url,
        host,
        haystack,
        initials: initialsOf(item.name),
      })
    }
  }
  return docs
}

export function scoreDoc(doc: SearchDoc, query: string): number {
  const q = query.toLowerCase()
  const name = doc.name.toLowerCase()
  let score = 0

  if (name === q) score = 120
  else if (name.startsWith(q)) score = 100
  else if (name.includes(q)) score = 80
  else if (doc.initials && doc.initials.startsWith(q)) score = 70
  else if (doc.initials && doc.initials.includes(q)) score = 55
  else if (doc.host.toLowerCase().includes(q)) score = 45
  else if (doc.haystack.includes(q)) score = 30
  else if (isSubsequence(q, doc.initials) || isSubsequence(q, name)) score = 15
  else return 0

  if (doc.item.favorite) score += 6
  score += Math.min(doc.item.clicks ?? 0, 10)
  return score
}

function isSubsequence(needle: string, hay: string): boolean {
  if (!needle || !hay) return false
  let index = 0
  for (const char of hay) {
    if (char === needle[index]) index += 1
    if (index === needle.length) return true
  }
  return false
}

export function searchDocs(docs: SearchDoc[], query: string, limit = 60): SearchDoc[] {
  const q = query.trim()
  if (!q) return []
  return docs
    .map((doc) => ({ doc, score: scoreDoc(doc, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.doc)
}

export interface HighlightPart {
  text: string
  match: boolean
}

export function highlight(text: string, query: string): HighlightPart[] {
  const q = query.trim()
  if (!q) return [{ text, match: false }]
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return [{ text, match: false }]
  return [
    { text: text.slice(0, index), match: false },
    { text: text.slice(index, index + q.length), match: true },
    { text: text.slice(index + q.length), match: false },
  ].filter((part) => part.text.length > 0)
}
