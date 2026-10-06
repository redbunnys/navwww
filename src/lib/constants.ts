export const PALETTE = [
  '#2932e1',
  '#0084ff',
  '#1e80ff',
  '#5b54f0',
  '#7c3aed',
  '#c026d3',
  '#e6162d',
  '#ff2442',
  '#f48024',
  '#ff6a00',
  '#f59e0b',
  '#16a34a',
  '#00cc4c',
  '#0d9488',
  '#0ea5e9',
  '#111827',
  '#4b5563',
  '#94a3b8',
]

export function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360
  }
  return `hsl(${hash} 58% 45%)`
}

export const TILE_SIZES = {
  sm: { min: '5rem', box: 40, icon: 22, text: 'text-[11px]' },
  md: { min: '6.5rem', box: 52, icon: 28, text: 'text-xs' },
  lg: { min: '8rem', box: 64, icon: 34, text: 'text-sm' },
} as const

export type TileSizeKey = keyof typeof TILE_SIZES
