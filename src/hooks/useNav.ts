import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { localRepository } from '../data/repo'
import { createCloudRepository } from '../data/cloudRepo'
import { useSession } from '../data/session'
import type { NavData, Settings } from '../types'

export const LOCAL_SCOPE = 'local'

export function cloudScope(userId: string): string {
  return `cloud:${userId}`
}

export function navQueryKey(scope: string) {
  return ['nav', scope] as const
}

export function useNavScope(): string {
  const session = useSession()
  return session ? cloudScope(session.user.id) : LOCAL_SCOPE
}

function useRepository() {
  const session = useSession()
  return useMemo(
    () => (session ? createCloudRepository(() => session.token) : localRepository),
    [session],
  )
}

export function useNavQuery() {
  const repository = useRepository()
  const scope = useNavScope()
  return useQuery({ queryKey: navQueryKey(scope), queryFn: () => repository.load() })
}

export function useUpdateNav() {
  const queryClient = useQueryClient()
  const repository = useRepository()
  const scope = useNavScope()

  return useCallback(
    (recipe: (data: NavData) => NavData) => {
      const key = navQueryKey(scope)
      const current = queryClient.getQueryData<NavData>(key)
      if (!current) return
      const next: NavData = { ...recipe(current), updatedAt: Date.now() }
      queryClient.setQueryData(key, next)
      void repository.save(next)
    },
    [queryClient, repository, scope],
  )
}

export function useUpdateSettings() {
  const update = useUpdateNav()
  return useCallback(
    (patch: Partial<Settings>) => {
      update((data) => ({ ...data, settings: { ...data.settings, ...patch } }))
    },
    [update],
  )
}

export function useResetNav() {
  const queryClient = useQueryClient()
  const repository = useRepository()
  const scope = useNavScope()

  return useCallback(async () => {
    const data = await repository.reset()
    queryClient.setQueryData(navQueryKey(scope), data)
  }, [queryClient, repository, scope])
}
