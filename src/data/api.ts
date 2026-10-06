import { getApiBase } from './session'
import type { SessionUser } from './session'
import type { NavData } from '../types'

export interface AppConfig {
  allowRegister: boolean
  hasAdmin: boolean
}

export interface AdminUser {
  id: string
  username: string
  role: string
  createdAt: number
}

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

  getConfig() {
    return request<AppConfig>('/api/config')
  },

  me(token: string) {
    return request<{ user: SessionUser }>('/api/auth/me', { token })
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<{ ok: boolean }>('/api/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
      token,
    })
  },

  changeAccount(token: string, username: string, password: string) {
    return request<{ user: SessionUser }>('/api/auth/account', {
      method: 'PUT',
      body: { username, password },
      token,
    })
  },

  adminUsers(token: string) {
    return request<{ users: AdminUser[]; allowRegister: boolean }>('/api/admin/users', { token })
  },

  adminSetConfig(token: string, allowRegister: boolean) {
    return request<{ ok: boolean; allowRegister: boolean }>('/api/admin/config', {
      method: 'PUT',
      body: { allowRegister },
      token,
    })
  },

  loadData(token: string) {
    return request<{ data: NavData | null; updatedAt: number }>('/api/data', { token })
  },

  saveData(token: string, data: NavData) {
    return request<{ ok: boolean; updatedAt: number }>('/api/data', { method: 'PUT', body: { data }, token })
  },
}
