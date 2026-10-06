import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import type { RefObject } from 'react'
import { ENGINES, engineById } from '../lib/engines'
import { faviconUrl } from '../lib/url'

export function HeroSearch({
  value,
  onChange,
  engineId,
  onEngineChange,
  onSearch,
  matchCount,
  inputRef,
}: {
  value: string
  onChange: (value: string) => void
  engineId: string
  onEngineChange: (id: string) => void
  onSearch: () => void
  matchCount: number
  inputRef: RefObject<HTMLInputElement | null>
}) {
  const [open, setOpen] = useState(false)
  const engine = engineById(engineId)
  const keyword = value.trim()

  return (
    <div className="flex flex-col items-center gap-3 px-5 pb-5 pt-6 md:px-8 md:pb-6 md:pt-8">
      <div className="relative w-full max-w-2xl">
        <div className="search-shell flex h-12 items-center gap-1 rounded-full border border-black/5 bg-white/90 pl-1.5 pr-2 shadow-sm backdrop-blur transition focus-within:border-blue-400/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/15 dark:border-white/10 dark:bg-white/10 dark:focus-within:bg-white/15">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            title="选择搜索引擎"
            className="wp-ghost flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-white/10"
          >
            <img
              src={faviconUrl(engine.url)}
              alt=""
              className="h-4 w-4 rounded-sm"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden'
              }}
            />
            <span className="hidden max-w-20 truncate sm:block">{engine.name}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
          </button>

          <span className="wp-divider h-5 w-px shrink-0 bg-black/10 dark:bg-white/10" />

          <input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearch()
              if (event.key === 'Escape') {
                if (open) setOpen(false)
                else onChange('')
              }
            }}
            placeholder="搜索，或输入关键词筛选书签"
            className="h-full flex-1 bg-transparent px-3 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />

          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              title="清空"
              className="wp-ghost mr-1 shrink-0 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-200/70 hover:text-neutral-600 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="wp-kbd mr-1 shrink-0 rounded-md border border-black/10 bg-neutral-100/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-white/10 dark:bg-white/5">
              Ctrl K
            </kbd>
          )}
        </div>

        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="scroll-slim animate-pop absolute left-0 top-[calc(100%+6px)] z-50 max-h-80 w-60 overflow-y-auto overscroll-contain rounded-2xl border border-black/5 bg-white/95 py-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95">
              {ENGINES.map((item) => {
                const active = item.id === engine.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onEngineChange(item.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={faviconUrl(item.url)}
                      alt=""
                      className="h-4 w-4 rounded-sm"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {active ? <Check className="h-4 w-4" /> : null}
                  </button>
                )
              })}
            </div>
          </>
        ) : null}
      </div>

      <p className="wp-soft text-xs text-neutral-400 dark:text-neutral-500">
        {keyword
          ? `回车用「${engine.name}」搜索 · 匹配到 ${matchCount} 个书签`
          : `输入关键词筛选书签，回车用「${engine.name}」搜索`}
      </p>
    </div>
  )
}
