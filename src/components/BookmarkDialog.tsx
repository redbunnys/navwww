import { useEffect, useState } from 'react'
import type { NavItem, NavPage } from '../types'
import { PALETTE, colorFromName } from '../lib/constants'
import { fallbackLetter, faviconUrl, normalizeUrl } from '../lib/url'
import { Button, Field, Modal, inputClass } from './Modal'

export interface BookmarkFormValues {
  name: string
  url: string
  detail: string
  color: string
  icon: string
  pageId: string
}

const emptyValues = (pageId: string): BookmarkFormValues => ({
  name: '',
  url: '',
  detail: '',
  color: '',
  icon: '',
  pageId,
})

export function BookmarkDialog({
  open,
  initial,
  defaultPageId,
  pages,
  onSubmit,
  onClose,
}: {
  open: boolean
  initial: NavItem | null
  defaultPageId: string
  pages: NavPage[]
  onSubmit: (values: BookmarkFormValues) => void
  onClose: () => void
}) {
  const [values, setValues] = useState<BookmarkFormValues>(emptyValues(defaultPageId))

  useEffect(() => {
    if (!open) return
    setValues(
      initial
        ? {
            name: initial.name,
            url: initial.url ?? '',
            detail: initial.detail ?? '',
            color: initial.color ?? '',
            icon: initial.icon ?? '',
            pageId: defaultPageId,
          }
        : emptyValues(defaultPageId),
    )
  }, [open, initial, defaultPageId])

  const patch = (part: Partial<BookmarkFormValues>) => setValues((prev) => ({ ...prev, ...part }))
  const preview = values.color || colorFromName(values.name || '新')
  const iconSrc = values.icon || faviconUrl(normalizeUrl(values.url))

  const submit = () => {
    const name = values.name.trim()
    const url = normalizeUrl(values.url)
    if (!name || !url) return
    onSubmit({ ...values, name, url })
  }

  return (
    <Modal
      open={open}
      title={initial ? '编辑书签' : '添加书签'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit} disabled={!values.name.trim() || !values.url.trim()}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: preview }}
          >
            {iconSrc ? (
              <img
                src={iconSrc}
                alt=""
                referrerPolicy="no-referrer"
                className="h-[58%] w-[58%] object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span className="text-lg font-semibold">{fallbackLetter(values.name || '新')}</span>
            )}
          </span>
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="名称">
              <input
                autoFocus
                value={values.name}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder="例如 GitHub"
                className={inputClass}
              />
            </Field>
            <Field label="所属分类">
              <select
                value={values.pageId}
                onChange={(event) => patch({ pageId: event.target.value })}
                className={inputClass}
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <Field label="网址">
          <input
            value={values.url}
            onChange={(event) => patch({ url: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            placeholder="github.com"
            className={inputClass}
          />
        </Field>

        <Field label="描述（可选）">
          <input
            value={values.detail}
            onChange={(event) => patch({ detail: event.target.value })}
            placeholder="一句话备注"
            className={inputClass}
          />
        </Field>

        <Field label="图标地址（可选，留空自动抓取站点图标）">
          <input
            value={values.icon}
            onChange={(event) => patch({ icon: event.target.value })}
            placeholder="https://example.com/logo.png"
            className={inputClass}
          />
        </Field>

        <Field label="颜色">
          <div className="flex flex-wrap gap-2 pt-1">
            {PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => patch({ color })}
                style={{ backgroundColor: color }}
                className={`h-6 w-6 rounded-full ring-offset-2 transition hover:scale-110 dark:ring-offset-neutral-900 ${
                  values.color === color ? 'ring-2 ring-blue-500' : ''
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => patch({ color: '' })}
              className="h-6 rounded-full border border-dashed border-neutral-300 px-2 text-[10px] text-neutral-400 transition hover:border-blue-400 dark:border-neutral-600"
            >
              自动
            </button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}
