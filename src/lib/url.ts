export function normalizeUrl(input: string): string {
  const value = input.trim()
  if (!value) return ''
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  return `https://${value.replace(/^\/+/, '')}`
}

export function getHost(url: string): string {
  try {
    return new URL(normalizeUrl(url)).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function faviconUrl(url: string): string {
  const host = getHost(url)
  return host ? `https://${host}/favicon.ico` : ''
}

export function fallbackLetter(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '#'
  const first = trimmed[0]
  return /[a-z]/i.test(first) ? first.toUpperCase() : first
}

export function openUrl(url: string, newTab: boolean): void {
  const target = normalizeUrl(url)
  if (!target) return
  if (newTab) window.open(target, '_blank', 'noopener,noreferrer')
  else window.location.href = target
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
