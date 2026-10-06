import { useEffect, useState } from 'react'
import { api } from '../data/api'
import { getApiBase, setApiBase } from '../data/session'
import type { Session } from '../data/session'
import { Button, Field, Modal, inputClass } from './Modal'

export function LoginDialog({
  open,
  onClose,
  onAuthed,
}: {
  open: boolean
  onClose: () => void
  onAuthed: (session: Session) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState(getApiBase())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setBusy(false)
    setServer(getApiBase())
  }, [open])

  const submit = async () => {
    if (busy) return
    if (!username.trim() || !password) {
      setError('请输入用户名和密码')
      return
    }
    setBusy(true)
    setError('')
    setApiBase(server)
    try {
      const result =
        mode === 'login' ? await api.login(username.trim(), password) : await api.register(username.trim(), password)
      onAuthed({ token: result.token, user: result.user })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="云端同步"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={() => void submit()} disabled={busy}>
            {busy ? '请稍候…' : mode === 'login' ? '登录' : '注册并登录'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex overflow-hidden rounded-full border border-black/5 bg-neutral-100/80 p-0.5 text-xs dark:border-white/10 dark:bg-white/5">
          {(['login', 'register'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item)
                setError('')
              }}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                mode === item
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {item === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <Field label="用户名">
          <input
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="3-24 位字母、数字、下划线或点"
            className={inputClass}
          />
        </Field>

        <Field label="密码">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submit()
            }}
            placeholder="至少 6 位"
            className={inputClass}
          />
        </Field>

        <Field label="服务器地址">
          <input
            value={server}
            onChange={(event) => setServer(event.target.value)}
            placeholder="https://navpage-api.你的账号.workers.dev"
            className={inputClass}
          />
        </Field>

        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          未登录时数据只存在本机浏览器；登录后会自动同步到云端，换设备登录即可使用。
        </p>
      </div>
    </Modal>
  )
}
