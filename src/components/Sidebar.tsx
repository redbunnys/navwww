import { useRef, useState } from 'react'
import {
  BookmarkPlus,
  Database,
  Download,
  Image as ImageIcon,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Sun,
  UserRound,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FAVORITES_PAGE_ID } from '../types'
import type { NavData, NavPage, Settings } from '../types'
import type { Session } from '../data/session'
import { pageIcon } from './icons'

const THEME_META: Record<Settings['theme'], { icon: LucideIcon; label: string }> = {
  light: { icon: Sun, label: '浅色' },
  dark: { icon: Moon, label: '深色' },
  system: { icon: Monitor, label: '跟随系统' },
}

function RailItem({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
  onEdit,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  badge?: number
  onClick: () => void
  onEdit?: () => void
}) {
  return (
    <div className="group relative w-full">
      <button
        type="button"
        title={label}
        onClick={onClick}
        className="rail-item flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition hover:bg-white/70 dark:hover:bg-white/5"
      >
        <span
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${
            active
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'rail-item-icon text-neutral-500 group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-100'
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
          {badge ? (
            <span
              className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-medium leading-none transition group-hover:opacity-0 ${
                active ? 'bg-white text-blue-600' : 'bg-neutral-200 text-neutral-500 dark:bg-white/15 dark:text-neutral-300'
              }`}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </span>
        <span
          className={`rail-label w-full truncate text-center text-[11px] leading-4 ${
            active ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {label}
        </span>
      </button>
      {onEdit ? (
        <button
          type="button"
          title="编辑分类"
          onClick={onEdit}
          className="absolute right-0.5 top-1 hidden rounded-md bg-white/95 p-0.5 text-neutral-400 shadow-sm transition hover:text-blue-600 group-hover:block dark:bg-neutral-800/95"
        >
          <Pencil className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  )
}

export function Sidebar({
  data,
  activePageId,
  favoriteCount,
  counts,
  theme,
  session,
  onSelect,
  onAddPage,
  onEditPage,
  onCycleTheme,
  onOpenBackground,
  onOpenAccount,
  onExport,
  onImport,
  onImportBookmarks,
  onReset,
}: {
  data: NavData
  activePageId: string
  favoriteCount: number
  counts: Record<string, number>
  theme: Settings['theme']
  session: Session | null
  onSelect: (id: string) => void
  onAddPage: () => void
  onEditPage: (page: NavPage) => void
  onCycleTheme: () => void
  onOpenBackground: () => void
  onOpenAccount: () => void
  onExport: () => void
  onImport: (file: File) => void
  onImportBookmarks: (file: File) => void
  onReset: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bookmarkRef = useRef<HTMLInputElement>(null)
  const ThemeIcon = THEME_META[theme].icon

  return (
    <aside className="flex h-full w-[5.25rem] shrink-0 flex-col items-center gap-1 px-2 py-3">
      <nav className="scroll-slim flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto overflow-x-hidden">
        <div className="my-auto flex w-full flex-col items-center gap-0.5 py-2">
          <RailItem
            icon={Star}
            label="收藏"
            active={activePageId === FAVORITES_PAGE_ID}
            badge={favoriteCount}
            onClick={() => onSelect(FAVORITES_PAGE_ID)}
          />

          {data.pages.map((page) => (
            <RailItem
              key={page.id}
              icon={pageIcon(page.icon)}
              label={page.name}
              active={page.id === activePageId}
              badge={counts[page.id] ?? 0}
              onClick={() => onSelect(page.id)}
              onEdit={() => onEditPage(page)}
            />
          ))}

          <button
            type="button"
            title="新建分类"
            onClick={onAddPage}
          className="rail-item flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition hover:bg-white/70 dark:hover:bg-white/5"
          >
          <span className="wp-dashed flex h-9 w-9 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 transition hover:border-blue-400 hover:text-blue-500 dark:border-neutral-600">
              <Plus className="h-4 w-4" />
            </span>
          <span className="wp-soft text-[11px] leading-4 text-neutral-400">新建</span>
          </button>
        </div>
      </nav>

      <button
        type="button"
        title={session ? `账号：${session.user.username}` : '登录云端账号'}
        onClick={onOpenAccount}
        className="rail-item flex w-full shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-2 transition hover:bg-white/70 dark:hover:bg-white/5"
      >
        <span className="rail-item-icon flex h-9 w-9 items-center justify-center text-neutral-500 dark:text-neutral-400">
          {session ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-semibold text-white">
              {session.user.username.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <UserRound className="h-[18px] w-[18px]" />
          )}
        </span>
        <span className="rail-label w-full truncate text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
          {session ? session.user.username : '登录'}
        </span>
      </button>

      <div className="flex w-full shrink-0 items-center justify-center gap-0.5 border-t border-black/5 pt-2 dark:border-white/5">
        <button
          type="button"
          title="更换背景"
          onClick={onOpenBackground}
          className="rail-foot rounded-lg p-2 text-neutral-500 transition hover:bg-white/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={`主题：${THEME_META[theme].label}`}
          onClick={onCycleTheme}
          className="rail-foot rounded-lg p-2 text-neutral-500 transition hover:bg-white/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
        <div className="relative">
          <button
            type="button"
            title="数据管理"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rail-foot rounded-lg p-2 text-neutral-500 transition hover:bg-white/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
          >
            <Database className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="animate-pop absolute bottom-10 left-0 z-50 w-40 overflow-hidden rounded-xl border border-black/5 bg-white/95 py-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onExport()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5" /> 导出数据
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    bookmarkRef.current?.click()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" /> 导入浏览器收藏夹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    fileRef.current?.click()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                >
                  <Upload className="h-3.5 w-3.5" /> 导入数据
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onReset()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 恢复默认
                </button>
              </div>
            </>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImport(file)
              event.target.value = ''
            }}
          />
          <input
            ref={bookmarkRef}
            type="file"
            accept="text/html,.html,.htm"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImportBookmarks(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>
    </aside>
  )
}
