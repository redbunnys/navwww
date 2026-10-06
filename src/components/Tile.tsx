import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MoreHorizontal, Plus, Star } from 'lucide-react'
import type { NavItem } from '../types'
import { fallbackLetter, faviconUrl } from '../lib/url'
import { highlight } from '../lib/search'
import { colorFromName, TILE_SIZES, type TileSizeKey } from '../lib/constants'

export function Highlight({ text, query }: { text: string; query: string }) {
  const parts = highlight(text, query)
  if (parts.length < 2) return <>{text}</>
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-amber-300/70 text-inherit dark:bg-amber-400/40">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  )
}

function TileIcon({ item, size }: { item: NavItem; size: TileSizeKey }) {
  const src = item.icon || faviconUrl(item.url ?? '')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const box = TILE_SIZES[size].box

  return (
    <span
      className="flex items-center justify-center overflow-hidden rounded-2xl text-white shadow-sm ring-1 ring-black/5 transition duration-150 group-hover:scale-[1.06] dark:ring-white/10"
      style={{ width: box, height: box, backgroundColor: item.color || colorFromName(item.name) }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-[58%] w-[58%] object-contain drop-shadow"
        />
      ) : (
        <span className="text-lg font-semibold">{fallbackLetter(item.name)}</span>
      )}
    </span>
  )
}

export interface TileProps {
  item: NavItem
  query: string
  size: TileSizeKey
  showNames: boolean
  sublabel?: string
  onOpen: () => void
  onEdit: () => void
  onToggleFavorite: () => void
  onMenu: (position: { x: number; y: number }) => void
}

export function Tile({ item, query, size, showNames, sublabel, onOpen, onEdit, onToggleFavorite, onMenu }: TileProps) {
  const moreRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        onContextMenu={(event) => {
          event.preventDefault()
          onMenu({ x: event.clientX, y: event.clientY })
        }}
        title={item.url ? `${item.name}\n${item.url}` : item.name}
        className="wp-hover flex w-full flex-col items-center gap-2 rounded-2xl px-2 pb-2 pt-3 transition hover:bg-white/70 hover:shadow-md dark:hover:bg-white/10"
      >
        <TileIcon item={item} size={size} />
        {showNames ? (
          <span
            className={`wp-strong w-full truncate text-center font-medium text-neutral-700 dark:text-neutral-200 ${TILE_SIZES[size].text}`}
          >
            <Highlight text={item.name} query={query} />
          </span>
        ) : null}
        {sublabel ? (
          <span className="wp-soft -mt-1 w-full truncate text-center text-[10px] text-neutral-400 dark:text-neutral-500">
            {sublabel}
          </span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={onToggleFavorite}
        title={item.favorite ? '取消收藏' : '收藏'}
        className={`absolute right-1 top-1 rounded-full bg-white/80 p-1 text-amber-500 shadow-sm transition hover:scale-110 dark:bg-neutral-800/80 ${
          item.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
        }`}
      >
        <Star className="h-3.5 w-3.5" fill={item.favorite ? 'currentColor' : 'none'} />
      </button>

      <button
        ref={moreRef}
        type="button"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onMenu({ x: rect.left, y: rect.bottom + 4 })
        }}
        onDoubleClick={onEdit}
        title="更多"
        className="absolute left-1 top-1 rounded-full bg-white/80 p-1 text-neutral-500 opacity-0 shadow-sm transition hover:scale-110 group-hover:opacity-100 focus:opacity-100 dark:bg-neutral-800/80 dark:text-neutral-300"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function AddTile({ size, onClick }: { size: TileSizeKey; onClick: () => void }) {
  const box = TILE_SIZES[size].box
  return (
    <button
      type="button"
      onClick={onClick}
      title="添加书签"
      className="wp-hover group flex flex-col items-center gap-2 rounded-2xl px-2 pb-2 pt-3 transition hover:bg-white/70 hover:shadow-md dark:hover:bg-white/10"
    >
      <span
        className="wp-dashed flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-400 transition group-hover:border-blue-400 group-hover:text-blue-500 dark:border-neutral-700 dark:text-neutral-500"
        style={{ width: box, height: box }}
      >
        <Plus className="h-5 w-5" />
      </span>
      <span className={`wp-soft text-center font-medium text-neutral-400 ${TILE_SIZES[size].text}`}>添加</span>
    </button>
  )
}

export function TileGrid({ size, children }: { size: TileSizeKey; children: ReactNode }) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_SIZES[size].min}, 1fr))` }}
    >
      {children}
    </div>
  )
}

export type MenuAction = 'open' | 'copy' | 'favorite' | 'edit' | 'delete'

export interface MenuState {
  x: number
  y: number
  item: NavItem
}

export function ContextMenu({
  state,
  onAction,
  onClose,
}: {
  state: MenuState
  onAction: (action: MenuAction) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = () => onClose()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('click', close)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const x = Math.max(8, Math.min(state.x, window.innerWidth - 190))
  const y = Math.max(8, Math.min(state.y, window.innerHeight - 248))

  const entries: Array<{ action: MenuAction; label: string; danger?: boolean }> = [
    { action: 'open', label: '打开' },
    { action: 'copy', label: '复制链接' },
    { action: 'favorite', label: state.item.favorite ? '取消收藏' : '收藏' },
    { action: 'edit', label: '编辑' },
    { action: 'delete', label: '删除', danger: true },
  ]

  return (
    <div
      ref={ref}
      style={{ left: x, top: y }}
      className="animate-pop fixed z-[55] w-44 overflow-hidden rounded-xl border border-black/5 bg-white/95 py-1 shadow-xl backdrop-blur dark:border-white/10 dark:bg-neutral-900/95"
    >
      {entries.map((entry) => (
        <button
          key={entry.action}
          type="button"
          onClick={() => {
            onAction(entry.action)
            onClose()
          }}
          className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-neutral-100 dark:hover:bg-white/10 ${
            entry.danger ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-200'
          }`}
        >
          {entry.label}
        </button>
      ))}
    </div>
  )
}
