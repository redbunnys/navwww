import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, SearchX, Star } from 'lucide-react'
import { api } from './data/api'
import { createCloudRepository } from './data/cloudRepo'
import { createEmptyData } from './data/defaults'
import { mergeNavData, preserveLocalBackground } from './data/merge'
import { getSession, setSession, useSession } from './data/session'
import type { Session } from './data/session'
import { loadNav, saveNav } from './data/storage'
import { cloudScope, navQueryKey, useNavQuery, useResetNav, useUpdateNav, useUpdateSettings } from './hooks/useNav'
import { usePersistentState } from './hooks/usePersistentState'
import { buildSearchIndex, searchDocs } from './lib/search'
import { copyText, openUrl } from './lib/url'
import { engineById, runSearch } from './lib/engines'
import { migrate } from './data/storage'
import { FAVORITES_PAGE_ID, createId } from './types'
import type { NavData, NavItem, NavPage, Settings } from './types'
import { Sidebar } from './components/Sidebar'
import { HeroSearch } from './components/HeroSearch'
import { BackgroundLayer } from './components/BackgroundLayer'
import { BackgroundDialog } from './components/BackgroundDialog'
import { AddTile, ContextMenu, Tile, TileGrid } from './components/Tile'
import type { MenuAction, MenuState } from './components/Tile'
import { BookmarkDialog } from './components/BookmarkDialog'
import type { BookmarkFormValues } from './components/BookmarkDialog'
import { PageDialog } from './components/PageDialog'
import { Toaster, toast } from './components/Toaster'
import { LoginDialog } from './components/LoginDialog'
import { SyncDialog } from './components/SyncDialog'
import type { SyncMode } from './components/SyncDialog'
import { AccountDialog } from './components/AccountDialog'

const ACTIVE_PAGE_KEY = 'nav:active-page'
const TILE_SIZE_ORDER: Settings['tileSize'][] = ['sm', 'md', 'lg']
const TILE_SIZE_LABEL: Record<Settings['tileSize'], string> = { sm: '小', md: '中', lg: '大' }
const THEME_ORDER: Settings['theme'][] = ['light', 'dark', 'system']

function applyTheme(theme: Settings['theme']): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('nav:theme', theme)
  } catch {
    /* ignore */
  }
}

function mapItem(data: NavData, id: string, updater: (item: NavItem) => NavItem): NavData['items'] {
  const items: NavData['items'] = {}
  for (const [pageId, list] of Object.entries(data.items)) {
    items[pageId] = list.some((item) => item.id === id)
      ? list.map((item) => (item.id === id ? updater(item) : item))
      : list
  }
  return items
}

function dropItem(data: NavData, id: string): NavData['items'] {
  const items: NavData['items'] = {}
  for (const [pageId, list] of Object.entries(data.items)) {
    items[pageId] = list.filter((item) => item.id !== id)
  }
  return items
}

export default function App() {
  const { data, isError, error, refetch } = useNavQuery()
  const queryClient = useQueryClient()
  const session = useSession()
  const update = useUpdateNav()
  const updateSettings = useUpdateSettings()
  const resetNav = useResetNav()

  const [activePageId, setActivePageId] = usePersistentState<string>(ACTIVE_PAGE_KEY, '')
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [backgroundOpen, setBackgroundOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [sync, setSync] = useState<{ cloud: NavData | null; busy: SyncMode | null } | null>(null)
  const [bookmarkDialog, setBookmarkDialog] = useState<{ open: boolean; item: NavItem | null; pageId: string }>({
    open: false,
    item: null,
    pageId: '',
  })
  const [pageDialog, setPageDialog] = useState<{ open: boolean; page: NavPage | null }>({ open: false, page: null })
  const searchRef = useRef<HTMLInputElement>(null)

  const settings = data?.settings
  const theme = settings?.theme ?? 'system'

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  useEffect(() => {
    if (!data || data.pages.length === 0) return
    const valid = activePageId === FAVORITES_PAGE_ID || data.pages.some((page) => page.id === activePageId)
    if (!valid) setActivePageId(data.pages[0].id)
  }, [data, activePageId, setActivePageId])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (!typing && event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const docs = useMemo(() => (data ? buildSearchIndex(data) : []), [data])
  const pageNameById = useMemo(() => new Map(docs.map((doc) => [doc.item.id, doc.pageName])), [docs])
  const trimmedQuery = query.trim()
  const results = useMemo(() => (trimmedQuery ? searchDocs(docs, trimmedQuery) : []), [docs, trimmedQuery])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    if (data) for (const page of data.pages) map[page.id] = (data.items[page.id] ?? []).length
    return map
  }, [data])

  const favorites = useMemo(() => {
    if (!data) return []
    return data.pages.flatMap((page) => (data.items[page.id] ?? []).filter((item) => item.favorite))
  }, [data])

  const openItem = useCallback(
    (item: NavItem) => {
      if (!item.url) return
      openUrl(item.url, settings?.openInNewTab ?? true)
      update((current) => ({
        ...current,
        items: mapItem(current, item.id, (entry) => ({ ...entry, clicks: (entry.clicks ?? 0) + 1 })),
      }))
    },
    [settings?.openInNewTab, update],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      update((current) => ({
        ...current,
        items: mapItem(current, id, (entry) => ({
          ...entry,
          favorite: !entry.favorite,
          updatedAt: Date.now(),
        })),
      }))
    },
    [update],
  )

  const removeItem = useCallback(
    (item: NavItem) => {
      if (!window.confirm(`确定删除「${item.name}」吗？`)) return
      update((current) => ({ ...current, items: dropItem(current, item.id) }))
      toast('已删除')
    },
    [update],
  )

  const openCreate = useCallback(() => {
    const pageId = activePageId === FAVORITES_PAGE_ID ? (data?.pages[0]?.id ?? '') : activePageId
    setBookmarkDialog({ open: true, item: null, pageId })
  }, [activePageId, data?.pages])

  const openEdit = useCallback(
    (item: NavItem) => {
      const owner = data?.pages.find((page) => (data.items[page.id] ?? []).some((entry) => entry.id === item.id))
      setBookmarkDialog({ open: true, item, pageId: owner?.id ?? data?.pages[0]?.id ?? '' })
    },
    [data],
  )

  const saveBookmark = useCallback(
    (values: BookmarkFormValues) => {
      const editing = bookmarkDialog.item
      const now = Date.now()
      if (editing) {
        update((current) => {
          const moved = !(current.items[values.pageId] ?? []).some((entry) => entry.id === editing.id)
          const nextItem: NavItem = {
            ...editing,
            name: values.name,
            url: values.url,
            detail: values.detail,
            color: values.color,
            icon: values.icon,
            updatedAt: now,
          }
          if (!moved) {
            return { ...current, items: mapItem(current, editing.id, () => nextItem) }
          }
          const items = dropItem(current, editing.id)
          items[values.pageId] = [...(items[values.pageId] ?? []), nextItem]
          return { ...current, items }
        })
        toast('已保存')
      } else {
        update((current) => {
          const item: NavItem = {
            id: createId('item'),
            type: 'bookmark',
            name: values.name,
            url: values.url,
            detail: values.detail,
            color: values.color,
            icon: values.icon,
            createdAt: now,
            updatedAt: now,
          }
          return {
            ...current,
            items: { ...current.items, [values.pageId]: [...(current.items[values.pageId] ?? []), item] },
          }
        })
        toast('已添加')
      }
      setBookmarkDialog({ open: false, item: null, pageId: '' })
    },
    [bookmarkDialog.item, update],
  )

  const savePage = useCallback(
    (values: { name: string; icon: string }) => {
      const editing = pageDialog.page
      if (editing) {
        update((current) => ({
          ...current,
          pages: current.pages.map((page) => (page.id === editing.id ? { ...page, ...values } : page)),
        }))
        toast('已保存')
      } else {
        const page: NavPage = { id: createId('page'), name: values.name, icon: values.icon }
        update((current) => ({
          ...current,
          pages: [...current.pages, page],
          items: { ...current.items, [page.id]: [] },
        }))
        setActivePageId(page.id)
        setQuery('')
        toast('已新建分类')
      }
      setPageDialog({ open: false, page: null })
    },
    [pageDialog.page, setActivePageId, update],
  )

  const deletePage = useCallback(() => {
    const page = pageDialog.page
    if (!page) return
    if (!window.confirm(`删除分类「${page.name}」及其中的全部书签？`)) return
    update((current) => {
      const items = { ...current.items }
      delete items[page.id]
      return { ...current, pages: current.pages.filter((entry) => entry.id !== page.id), items }
    })
    setPageDialog({ open: false, page: null })
    toast('已删除分类')
  }, [pageDialog.page, update])

  const handleMenuAction = useCallback(
    (action: MenuAction) => {
      if (!menu) return
      const item = menu.item
      if (action === 'open') openItem(item)
      if (action === 'copy') {
        void copyText(item.url ?? '').then((ok) => toast(ok ? '已复制链接' : '复制失败'))
      }
      if (action === 'favorite') toggleFavorite(item.id)
      if (action === 'edit') openEdit(item)
      if (action === 'delete') removeItem(item)
    },
    [menu, openEdit, openItem, removeItem, toggleFavorite],
  )

  const exportData = useCallback(() => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast('已导出数据')
  }, [data])

  const importData = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const next = migrate(JSON.parse(text) as Partial<NavData>)
        if (next.pages.length === 0) throw new Error('empty')
        update(() => next)
        toast('导入成功')
      } catch {
        toast('导入失败：文件格式不正确')
      }
    },
    [update],
  )

  const resetData = useCallback(() => {
    if (!window.confirm('恢复默认数据？当前的书签与分类会被清空。')) return
    void resetNav().then(() => {
      setActivePageId('')
      toast('已恢复默认')
    })
  }, [resetNav, setActivePageId])

  const handleAuthed = useCallback(async (next: Session) => {
    setSession(next)
    setAuthOpen(false)
    const local = loadNav()
    try {
      const { data: cloud } = await api.loadData(next.token)
      if (!local || local.pages.length === 0) {
        toast(cloud ? '已登录，正在使用云端数据' : '已登录，云端暂无数据')
        return
      }
      setSync({ cloud, busy: null })
    } catch (err) {
      toast(err instanceof Error ? err.message : '读取云端数据失败')
    }
  }, [])

  const applySync = useCallback(
    async (mode: SyncMode) => {
      const current = getSession()
      if (!current) return
      setSync((prev) => (prev ? { ...prev, busy: mode } : prev))
      const local = loadNav() ?? createEmptyData()
      const cloud = sync?.cloud ?? null
      try {
        let result: NavData
        if (mode === 'merge') {
          result = mergeNavData(local, cloud ?? createEmptyData())
        } else if (mode === 'cloud') {
          if (!cloud) throw new Error('云端还没有数据')
          result = preserveLocalBackground(cloud, local)
        } else {
          result = local
        }
        await createCloudRepository(() => current.token).save(result)
        saveNav(result)
        queryClient.setQueryData(navQueryKey(cloudScope(current.user.id)), result)
        setSync(null)
        toast(
          mode === 'merge' ? '已合并并同步到云端' : mode === 'cloud' ? '已改用云端数据' : '已用本地数据覆盖云端',
        )
      } catch (err) {
        toast(err instanceof Error ? err.message : '同步失败')
        setSync((prev) => (prev ? { ...prev, busy: null } : prev))
      }
    },
    [queryClient, sync],
  )

  const logout = useCallback(() => {
    if (!window.confirm('退出登录？将切回本机数据，本机数据不会被删除。')) return
    setSession(null)
    setAccountOpen(false)
    toast('已退出登录，正在使用本机数据')
  }, [])

  const uploadNow = useCallback(async () => {
    const current = getSession()
    if (!current || !data) return
    try {
      await createCloudRepository(() => current.token).save(data)
      toast('已上传到云端')
    } catch (err) {
      toast(err instanceof Error ? err.message : '上传失败')
    }
  }, [data])

  if (!data || !settings) {
    if (isError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-semibold">数据加载失败</p>
          <p className="max-w-md text-xs text-neutral-400">
            {error instanceof Error ? error.message : '请检查网络或服务器地址'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              重试
            </button>
            <button
              type="button"
              onClick={() => {
                setSession(null)
                void refetch()
              }}
              className="rounded-lg bg-neutral-100 px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-200"
            >
              退出登录用本机数据
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-500" />
      </div>
    )
  }

  const engine = engineById(settings.engineId)
  const wallpaper = settings.background.kind !== 'none'
  const activePage = data.pages.find((page) => page.id === activePageId) ?? null
  const isFavorites = activePageId === FAVORITES_PAGE_ID
  const overview = isFavorites ? favorites : (data.items[activePage?.id ?? ''] ?? [])
  const tiles = trimmedQuery ? results.map((doc) => doc.item) : overview
  const title = trimmedQuery ? `搜索「${trimmedQuery}」` : isFavorites ? '收藏' : (activePage?.name ?? '')

  return (
    <>
      <BackgroundLayer background={settings.background} />

      <div className={`relative z-10 flex h-full${wallpaper ? ' wallpaper' : ''}`}>
        <Sidebar
          data={data}
          activePageId={activePageId}
          favoriteCount={favorites.length}
          counts={counts}
          theme={settings.theme}
          session={session}
          onOpenAccount={() => (session ? setAccountOpen(true) : setAuthOpen(true))}
          onSelect={(id) => {
            setActivePageId(id)
            setQuery('')
          }}
          onAddPage={() => setPageDialog({ open: true, page: null })}
          onEditPage={(page) => setPageDialog({ open: true, page })}
          onCycleTheme={() => {
            const next = THEME_ORDER[(THEME_ORDER.indexOf(settings.theme) + 1) % THEME_ORDER.length]
            updateSettings({ theme: next })
          }}
          onOpenBackground={() => setBackgroundOpen(true)}
          onExport={exportData}
          onImport={(file) => void importData(file)}
          onReset={resetData}
        />

        <div className="flex min-w-0 flex-1 flex-col p-2.5 md:px-3 md:py-4">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <HeroSearch
              value={query}
              onChange={setQuery}
              engineId={settings.engineId}
              onEngineChange={(id) => updateSettings({ engineId: id })}
              onSearch={() => {
                if (trimmedQuery) runSearch(engine, trimmedQuery)
              }}
              matchCount={results.length}
              inputRef={searchRef}
            />

            <main className="scroll-slim flex-1 overflow-y-auto px-5 pb-10 pt-1 md:px-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h1 className="wp-strong flex items-center gap-1.5 text-sm font-semibold">
                  {isFavorites && !trimmedQuery ? (
                    <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
                  ) : null}
                  {title}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex overflow-hidden rounded-full border border-black/5 bg-white/70 p-0.5 text-xs dark:border-white/10 dark:bg-white/5">
                    {TILE_SIZE_ORDER.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateSettings({ tileSize: size })}
                        className={`rounded-full px-2.5 py-1 transition ${
                          settings.tileSize === size
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
                        }`}
                      >
                        {TILE_SIZE_LABEL[size]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ showNames: !settings.showNames })}
                    className="rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-xs text-neutral-500 transition hover:text-neutral-800 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    {settings.showNames ? '显示名称' : '仅图标'}
                  </button>
                  <span className="wp-soft text-xs text-neutral-400">{tiles.length} 个</span>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    添加书签
                  </button>
                </div>
              </div>

              {tiles.length === 0 ? (
                <div className="wp-soft flex flex-col items-center gap-3 py-24 text-neutral-400">
                  <SearchX className="h-8 w-8" />
                  <p className="text-sm">
                    {trimmedQuery
                      ? `没有匹配的书签，按回车用「${engine.name}」搜索`
                      : isFavorites
                        ? '还没有收藏，点击磁贴右上角的星标即可收藏'
                        : '这个分类还是空的，先添加一个书签吧'}
                  </p>
                </div>
              ) : (
                <TileGrid size={settings.tileSize}>
                  {tiles.map((item) => (
                    <Tile
                      key={item.id}
                      item={item}
                      query={trimmedQuery}
                      size={settings.tileSize}
                      showNames={settings.showNames}
                      sublabel={trimmedQuery ? pageNameById.get(item.id) : undefined}
                      onOpen={() => openItem(item)}
                      onEdit={() => openEdit(item)}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                      onMenu={(position) => setMenu({ ...position, item })}
                    />
                  ))}
                  {!trimmedQuery && !isFavorites ? <AddTile size={settings.tileSize} onClick={openCreate} /> : null}
                </TileGrid>
              )}
            </main>
          </section>
        </div>
      </div>

      <BookmarkDialog
        open={bookmarkDialog.open}
        initial={bookmarkDialog.item}
        defaultPageId={bookmarkDialog.pageId}
        pages={data.pages}
        onSubmit={saveBookmark}
        onClose={() => setBookmarkDialog({ open: false, item: null, pageId: '' })}
      />

      <PageDialog
        open={pageDialog.open}
        initial={pageDialog.page}
        onSubmit={savePage}
        onDelete={deletePage}
        onClose={() => setPageDialog({ open: false, page: null })}
      />

      <BackgroundDialog
        open={backgroundOpen}
        background={settings.background}
        onChange={(next) => updateSettings({ background: next })}
        onClose={() => setBackgroundOpen(false)}
      />

      <LoginDialog open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={(next) => void handleAuthed(next)} />

      {session && accountOpen ? (
        <AccountDialog
          open
          session={session}
          updatedAt={data.updatedAt}
          onUpload={() => void uploadNow()}
          onLogout={logout}
          onClose={() => setAccountOpen(false)}
        />
      ) : null}

      <SyncDialog
        open={sync !== null}
        hasCloudData={Boolean(sync?.cloud)}
        busy={sync?.busy ?? null}
        onChoose={(mode) => void applySync(mode)}
        onClose={() => setSync(null)}
      />

      {menu ? <ContextMenu state={menu} onAction={handleMenuAction} onClose={() => setMenu(null)} /> : null}
      <Toaster />
    </>
  )
}
