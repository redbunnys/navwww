import { getApiBase } from './session'
import type { SessionUser } from './session'
import type { NavData } from '../types'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string
}

function parseJson(text: string): { error?: string } | null {
  try {
    return JSON.parse(text) as { error?: string }
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = getApiBase()
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(`无法连接服务器（${base}），请检查地址与网络`, 0)
  }

  const text = await response.text()
  const payload = text ? parseJson(text) : null
  if (!response.ok) {
    throw new ApiError(payload?.error ?? `请求失败（${response.status}）`, response.status)
  }
  return (payload ?? {}) as T
}

export const api = {
  register(username: string, password: string) {
    return request<{ token: string; user: SessionUser }>('/api/auth/register', {
      method: 'POST',
      body: { username, password },
    })
  },

  login(username: string, password: string) {
    return request<{ token: string; user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
  },

  loadData(token: string) {
    return request<{ data: NavData | null; updatedAt: number }>('/api/data', { token })
  },

  saveData(token: string, data: NavData) {
    return request<{ ok: boolean; updatedAt: number }>('/api/data', { method: 'PUT', body: { data }, token })
  },
}
