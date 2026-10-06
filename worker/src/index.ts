import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'
import { expiryInSeconds, hashPassword, signToken, verifyPassword, verifyToken } from './crypto'
import { findUser, insertUser, readData, writeData } from './store'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  ALLOWED_ORIGINS?: string
}

type Variables = { userId: string; username: string }

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

const MAX_PAYLOAD_BYTES = 1024 * 1024

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

function readBody(body: unknown): { username: string; password: string } {
  const input = (body ?? {}) as { username?: unknown; password?: unknown }
  return {
    username: typeof input.username === 'string' ? input.username.trim() : '',
    password: typeof input.password === 'string' ? input.password : '',
  }
}

app.get('/api/health', (c) => c.json({ ok: true, time: Date.now() }))

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const { username, password } = readBody(body)

  if (!/^[A-Za-z0-9_.-]{3,24}$/.test(username)) {
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

  const { hash, salt } = await hashPassword(password)
  const id = crypto.randomUUID()
  await insertUser(c.env.DB, { id, username, hash, salt })

  const token = await signToken({ sub: id, name: username, exp: expiryInSeconds(30) }, c.env.JWT_SECRET)
  return c.json({ token, user: { id, username } })
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
  return c.json({ token, user: { id: user.id, username: user.username } })
})

app.get('/api/auth/me', requireAuth, (c) =>
  c.json({ user: { id: c.get('userId'), username: c.get('username') } }),
)

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
