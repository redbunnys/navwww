import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import type { AppBackground, BackgroundKind } from '../types'
import { GRADIENTS, PHOTOS, SOLID_COLORS, fileToDataUrl } from '../lib/background'
import { Button, Field, Modal, inputClass } from './Modal'
import { toast } from './Toaster'

const KINDS: Array<{ id: BackgroundKind; label: string }> = [
  { id: 'none', label: '默认' },
  { id: 'gradient', label: '渐变' },
  { id: 'image', label: '图片' },
  { id: 'color', label: '纯色' },
]

export function BackgroundDialog({
  open,
  background,
  onChange,
  onClose,
}: {
  open: boolean
  background: AppBackground
  onChange: (next: AppBackground) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const patch = (part: Partial<AppBackground>) => onChange({ ...background, ...part })

  useEffect(() => {
    if (!open) return
    setUrl(background.kind === 'image' && background.value.startsWith('http') ? background.value : '')
  }, [open])

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      patch({ kind: 'image', value: dataUrl })
      toast('背景已更新')
    } catch {
      toast('图片处理失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="更换背景"
      width="max-w-2xl"
      onClose={onClose}
      footer={
        <>
          <div className="mr-auto">
            <Button onClick={() => onChange({ kind: 'none', value: '', mask: 35, blur: 0 })}>恢复默认</Button>
          </div>
          <Button variant="primary" onClick={onClose}>
            完成
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex overflow-hidden rounded-full border border-black/5 bg-neutral-100/80 p-0.5 text-xs dark:border-white/10 dark:bg-white/5">
          {KINDS.map((kind) => (
            <button
              key={kind.id}
              type="button"
              onClick={() => patch({ kind: kind.id })}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                background.kind === kind.id
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {kind.label}
            </button>
          ))}
        </div>

        {background.kind === 'gradient' ? (
          <div className="grid grid-cols-4 gap-2">
            {GRADIENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => patch({ value: item.id })}
                style={{ backgroundImage: item.css }}
                className={`h-16 rounded-xl ring-2 transition ${
                  background.value === item.id ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-300'
                }`}
              >
                <span className="text-[10px] font-medium text-white/90 drop-shadow">{item.name}</span>
              </button>
            ))}
          </div>
        ) : null}

        {background.kind === 'color' ? (
          <div className="flex flex-wrap items-center gap-2">
            {SOLID_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => patch({ value: color })}
                style={{ backgroundColor: color }}
                className={`h-9 w-9 rounded-xl ring-offset-2 transition hover:scale-105 dark:ring-offset-neutral-900 ${
                  background.value === color ? 'ring-2 ring-blue-500' : ''
                }`}
              />
            ))}
            <input
              type="color"
              value={background.value || '#0f172a'}
              onChange={(event) => patch({ value: event.target.value })}
              className="h-9 w-12 cursor-pointer rounded-lg border border-black/10 bg-transparent dark:border-white/10"
            />
          </div>
        ) : null}

        {background.kind === 'image' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {PHOTOS.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => patch({ value: photo.url })}
                  className={`relative overflow-hidden rounded-xl ring-2 transition ${
                    background.value === photo.url ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-300'
                  }`}
                >
                  <img src={photo.thumb} alt={photo.name} loading="lazy" className="h-16 w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-[10px] text-white">
                    {photo.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="粘贴图片地址，例如 https://..."
                className={inputClass}
              />
              <Button
                variant="primary"
                disabled={!url.trim()}
                onClick={() => {
                  patch({ value: url.trim() })
                  toast('背景已更新')
                }}
              >
                应用
              </Button>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm text-neutral-500 transition hover:border-blue-400 hover:text-blue-600 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-400"
            >
              <Upload className="h-4 w-4" />
              {busy ? '正在处理图片…' : '上传本地图片（自动压缩后保存）'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
                event.target.value = ''
              }}
            />
          </div>
        ) : null}

        {background.kind !== 'none' ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label={`遮罩 ${background.mask}%`}>
              <input
                type="range"
                min={0}
                max={90}
                value={background.mask}
                onChange={(event) => patch({ mask: Number(event.target.value) })}
                className="w-full accent-blue-600"
              />
            </Field>
            {background.kind === 'image' ? (
              <Field label={`模糊 ${background.blur}px`}>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={background.blur}
                  onChange={(event) => patch({ blur: Number(event.target.value) })}
                  className="w-full accent-blue-600"
                />
              </Field>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
