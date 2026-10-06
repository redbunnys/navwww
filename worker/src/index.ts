import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'
import { expiryInSeconds, hashPassword, signToken, verifyPassword, verifyToken } from './crypto'
import {
  countUsers,
  findUser,
  findUserById,
  insertUser,
  listUsers,
  readConfig,
  readData,
  updatePassword,
  updateUsername,
  writeConfig,
  writeData,
} from './store'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  ALLOWED_ORIGINS?: string
}

type Variables = { userId: string; username: string; role: string }

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

const MAX_PAYLOAD_BYTES = 1024 * 1024
const ALLOW_REGISTER_KEY = 'allow_register'
const USERNAME_RE = /^[A-Za-z0-9_.-]{3,24}$/

app.use('*', async (c, next) => {
  const configured = (c.env.ALLOWED_ORIGINS ?? '*')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const origin = c.req.header('Origin') ?? ''
  const allowAll = configured.length === 0 || configured.includes('*')
  const allowed = allowAll ? '*' : configured.includes(origin) ? origin : configured[0]

  return cors({
    origin: allowed,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next)
})

const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? await verifyToken(token, c.env.JWT_SECRET) : null
  if (!payload) return c.json({ error: '登录已失效，请重新登录' }, 401)
  c.set('userId', payload.sub)
  c.set('username', payload.name)
  await next()
}

const requireAdmin: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const row = await findUserById(c.env.DB, c.get('userId'))
  if (!row) return c.json({ error: '账号不存在' }, 404)
  if (row.role !== 'admin') return c.json({ error: '需要管理员权限' }, 403)
  c.set('role', row.role)
  await next()
}

function readBody(body: unknown): { username: string; password: string } {
  const input = (body ?? {}) as { username?: unknown; password?: unknown }
  return {
    username: typeof input.username === 'string' ? input.username.trim() : '',
    password: typeof input.password === 'string' ? input.password : '',
  }
}

app.get('/api/health', (c) => c.json({ ok: true, time: Date.now() }))

app.get('/api/config', async (c) => {
  const [total, allow] = await Promise.all([
    countUsers(c.env.DB),
    readConfig(c.env.DB, ALLOW_REGISTER_KEY),
  ])
  return c.json({ allowRegister: total === 0 || allow === '1', hasAdmin: total > 0 })
})

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const { username, password } = readBody(body)

  if (!USERNAME_RE.test(username)) {
    return c.json({ error: '用户名需为 3-24 位字母、数字、下划线或点' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: '密码至少 6 位' }, 400)
  }
  if (!c.env.JWT_SECRET) {
    return c.json({ error: '服务端未配置 JWT_SECRET' }, 500)
  }

  const existing = await findUser(c.env.DB, username)
  if (existing) return c.json({ error: '用户名已被占用' }, 409)

  const total = await countUsers(c.env.DB)
  const isFirst = total === 0
  if (!isFirst && (await readConfig(c.env.DB, ALLOW_REGISTER_KEY)) !== '1') {
    return c.json({ error: '管理员已关闭注册' }, 403)
  }

  const { hash, salt } = await hashPassword(password)
  const id = crypto.randomUUID()
  const role = isFirst ? 'admin' : 'user'
  await insertUser(c.env.DB, { id, username, hash, salt, role })

  const token = await signToken({ sub: id, name: username, exp: expiryInSeconds(30) }, c.env.JWT_SECRET)
  return c.json({ token, user: { id, username, role } })
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const { username, password } = readBody(body)
  if (!username || !password) return c.json({ error: '请输入用户名和密码' }, 400)
  if (!c.env.JWT_SECRET) {
    return c.json({ error: '服务端未配置 JWT_SECRET' }, 500)
  }

  const user = await findUser(c.env.DB, username)
  if (!user) return c.json({ error: '用户名或密码不正确' }, 401)

  const ok = await verifyPassword(password, user.salt, user.password_hash)
  if (!ok) return c.json({ error: '用户名或密码不正确' }, 401)

  const token = await signToken({ sub: user.id, name: user.username, exp: expiryInSeconds(30) }, c.env.JWT_SECRET)
  return c.json({ token, user: { id: user.id, username: user.username, role: user.role } })
})

app.get('/api/auth/me', requireAuth, async (c) => {
  const row = await findUserById(c.env.DB, c.get('userId'))
  if (!row) return c.json({ error: '账号不存在' }, 404)
  return c.json({ user: { id: row.id, username: row.username, role: row.role } })
})

app.put('/api/auth/password', requireAuth, async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { currentPassword?: unknown; newPassword?: unknown }
    | null
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) return c.json({ error: '请输入当前密码和新密码' }, 400)
  if (newPassword.length < 6) return c.json({ error: '新密码至少 6 位' }, 400)
  if (newPassword === currentPassword) return c.json({ error: '新密码不能与当前密码相同' }, 400)

  const row = await findUserById(c.env.DB, c.get('userId'))
  if (!row) return c.json({ error: '账号不存在' }, 404)
  if (!(await verifyPassword(currentPassword, row.salt, row.password_hash))) {
    return c.json({ error: '当前密码不正确' }, 401)
  }

  const { hash, salt } = await hashPassword(newPassword)
  await updatePassword(c.env.DB, row.id, hash, salt)
  return c.json({ ok: true })
})

app.put('/api/auth/account', requireAuth, async (c) => {
  const body = (await c.req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!USERNAME_RE.test(username)) {
    return c.json({ error: '用户名需为 3-24 位字母、数字、下划线或点' }, 400)
  }
  if (!password) return c.json({ error: '请输入当前密码' }, 400)

  const row = await findUserById(c.env.DB, c.get('userId'))
  if (!row) return c.json({ error: '账号不存在' }, 404)
  if (row.username === username) return c.json({ error: '新用户名与当前用户名相同' }, 400)
  if (!(await verifyPassword(password, row.salt, row.password_hash))) {
    return c.json({ error: '密码不正确' }, 401)
  }
  if (await findUser(c.env.DB, username)) {
    return c.json({ error: '用户名已被占用' }, 409)
  }

  await updateUsername(c.env.DB, row.id, username)
  return c.json({ user: { id: row.id, username, role: row.role } })
})

app.get('/api/admin/users', requireAuth, requireAdmin, async (c) => {
  const [users, allow] = await Promise.all([listUsers(c.env.DB), readConfig(c.env.DB, ALLOW_REGISTER_KEY)])
  return c.json({ users, allowRegister: allow === '1' })
})

app.put('/api/admin/config', requireAuth, requireAdmin, async (c) => {
  const body = (await c.req.json().catch(() => null)) as { allowRegister?: unknown } | null
  if (typeof body?.allowRegister !== 'boolean') return c.json({ error: '参数不正确' }, 400)
  await writeConfig(c.env.DB, ALLOW_REGISTER_KEY, body.allowRegister ? '1' : '0')
  return c.json({ ok: true, allowRegister: body.allowRegister })
})

app.get('/api/data', requireAuth, async (c) => {
  const row = await readData(c.env.DB, c.get('userId'))
  if (!row) return c.json({ data: null, updatedAt: 0 })
  try {
    return c.json({ data: JSON.parse(row.payload), updatedAt: row.updated_at })
  } catch {
    return c.json({ data: null, updatedAt: row.updated_at })
  }
})

app.put('/api/data', requireAuth, async (c) => {
  const body = (await c.req.json().catch(() => null)) as { data?: unknown } | null
  const data = body?.data
  if (!data || typeof data !== 'object') return c.json({ error: '数据格式不正确' }, 400)

  const payload = JSON.stringify(data)
  if (payload.length > MAX_PAYLOAD_BYTES) {
    return c.json({ error: '数据超过 1MB，请改用图片链接而不是本地上传的壁纸' }, 413)
  }

  const updatedAt = Date.now()
  await writeData(c.env.DB, c.get('userId'), payload, updatedAt)
  return c.json({ ok: true, updatedAt })
})

export default app
