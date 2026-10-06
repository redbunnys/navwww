import { useCallback, useEffect, useState } from 'react'
import { Cloud, HardDrive, LogOut, ShieldCheck, Upload, Users } from 'lucide-react'
import { api } from '../data/api'
import type { AdminUser } from '../data/api'
import type { Session } from '../data/session'
import { Button, Modal } from './Modal'
import { toast } from './Toaster'

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
  const isAdmin = session.user.role === 'admin'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [allowRegister, setAllowRegister] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadAdmin = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.adminUsers(session.token)
      setUsers(result.users)
      setAllowRegister(result.allowRegister)
    } catch (err) {
      toast(err instanceof Error ? err.message : '读取管理员数据失败')
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    if (open && isAdmin) void loadAdmin()
  }, [open, isAdmin, loadAdmin])

  const toggleRegister = useCallback(async () => {
    if (saving) return
    setSaving(true)
    const next = !allowRegister
    try {
      await api.adminSetConfig(session.token, next)
      setAllowRegister(next)
      toast(next ? '已开放注册' : '已关闭注册')
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }, [allowRegister, saving, session.token])

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
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {session.user.username}
              {isAdmin ? (
                <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                  管理员
                </span>
              ) : null}
            </p>
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

        {isAdmin ? (
          <div className="space-y-3 rounded-xl border border-black/5 p-3 dark:border-white/10">
            <p className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              管理员设置
            </p>

            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm">开放注册</span>
                <span className="block text-xs text-neutral-400">关闭后只有已有账号能登录</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={allowRegister}
                disabled={saving || loading}
                onClick={() => void toggleRegister()}
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
                  allowRegister ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    allowRegister ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Users className="h-3.5 w-3.5" />
                共 {users.length} 个账号{loading ? '（读取中…）' : ''}
              </p>
              <ul className="scroll-slim max-h-40 space-y-1 overflow-y-auto">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-neutral-100/70 px-2.5 py-1.5 text-xs dark:bg-white/5"
                  >
                    <span className="truncate">{user.username}</span>
                    <span className="shrink-0 text-neutral-400">
                      {user.role === 'admin' ? '管理员' : formatTime(user.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <p className="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500">
          <LogOut className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          退出登录后切回本机数据，本机数据不会被删除。
        </p>
      </div>
    </Modal>
  )
}
