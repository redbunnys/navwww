import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { localRepository } from '../data/repo'
import type { NavData, Settings } from '../types'

export const NAV_KEY = ['nav'] as const

export function useNavQuery() {
  return useQuery({
    queryKey: NAV_KEY,
    queryFn: () => localRepository.load(),
  })
}

export function useUpdateNav() {
  const queryClient = useQueryClient()
  return useCallback(
    (recipe: (data: NavData) => NavData) => {
      const current = queryClient.getQueryData<NavData>(NAV_KEY)
      if (!current) return
      const next: NavData = { ...recipe(current), updatedAt: Date.now() }
      queryClient.setQueryData(NAV_KEY, next)
      void localRepository.save(next)
    },
    [queryClient],
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
  return useCallback(async () => {
    const data = await localRepository.reset()
    queryClient.setQueryData(NAV_KEY, data)
  }, [queryClient])
}
