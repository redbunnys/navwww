import { Cloud, HardDrive, LogOut, Upload } from 'lucide-react'
import type { Session } from '../data/session'
import { Button, Modal } from './Modal'

function formatTime(value: number): string {
  if (!value) return '未知'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

export function AccountDialog({
  open,
  session,
  updatedAt,
  onUpload,
  onLogout,
  onClose,
}: {
  open: boolean
  session: Session
  updatedAt: number
  onUpload: () => void
  onLogout: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      title="账号"
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" onClick={onLogout}>
            退出登录
          </Button>
          <Button variant="primary" onClick={onClose}>
            关闭
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-base font-semibold text-white">
            {session.user.username.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold">{session.user.username}</p>
            <p className="text-xs text-neutral-400">已登录，数据实时同步到云端</p>
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl bg-neutral-100/70 px-3 py-2.5 text-xs dark:bg-white/5">
          <p className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <Cloud className="h-3.5 w-3.5 text-blue-500" />
            数据来源：云端
          </p>
          <p className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <HardDrive className="h-3.5 w-3.5" />
            本机快照：{formatTime(updatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onUpload}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/5 py-2.5 text-sm text-neutral-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:text-neutral-300"
        >
          <Upload className="h-3.5 w-3.5" />
          立即上传当前数据到云端
        </button>

        <p className="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500">
          <LogOut className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          退出登录后切回本机数据，本机数据不会被删除。
        </p>
      </div>
    </Modal>
  )
}
