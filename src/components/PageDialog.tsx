import { useEffect, useState } from 'react'
import type { NavPage } from '../types'
import { PAGE_ICON_NAMES, pageIcon } from './icons'
import { Button, Field, Modal, inputClass } from './Modal'

export function PageDialog({
  open,
  initial,
  onSubmit,
  onClose,
  onDelete,
}: {
  open: boolean
  initial: NavPage | null
  onSubmit: (values: { name: string; icon: string }) => void
  onClose: () => void
  onDelete?: () => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('grid')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setIcon(initial?.icon ?? 'star')
  }, [open, initial])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({ name: trimmed, icon })
  }

  return (
    <Modal
      open={open}
      title={initial ? '编辑分类' : '新建分类'}
      onClose={onClose}
      footer={
        <>
          {initial && onDelete ? (
            <div className="mr-auto">
              <Button variant="danger" onClick={onDelete}>
                删除分类
              </Button>
            </div>
          ) : null}
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim()}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="分类名称">
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            placeholder="例如 学习"
            className={inputClass}
          />
        </Field>
        <Field label="图标">
          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {PAGE_ICON_NAMES.map((key) => {
              const Icon = pageIcon(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`flex h-9 items-center justify-center rounded-lg transition ${
                    icon === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </Modal>
  )
}
