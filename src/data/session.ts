import { useSyncExternalStore } from 'react'

export interface SessionUser {
  id: string
  username: string
}

export interface Session {
  token: string
  user: SessionUser
}

const SESSION_KEY = 'nav:session'
const API_KEY = 'nav:api-base'

const envBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''
export const DEFAULT_API_BASE = (envBase || 'http://127.0.0.1:8787').replace(/\/+$/, '')

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.token || !parsed.user?.id) return null
    return parsed
  } catch {
    return null
  }
}

let session: Session | null = readSession()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSession(): Session | null {
  return session
}

export function setSession(next: Session | null): void {
  session = next
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener())
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => null,
  )
}

export function getApiBase(): string {
  try {
    const override = localStorage.getItem(API_KEY)
    if (override) return override.replace(/\/+$/, '')
  } catch {
    /* ignore */
  }
  return DEFAULT_API_BASE
}

export function setApiBase(value: string): void {
  try {
    const next = value.trim().replace(/\/+$/, '')
    if (next) localStorage.setItem(API_KEY, next)
    else localStorage.removeItem(API_KEY)
  } catch {
    /* ignore */
  }
}
