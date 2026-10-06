import { useEffect, useState } from 'react'

type ToastItem = { id: number; text: string }

let listeners: Array<(item: ToastItem) => void> = []
let seed = 0

export function toast(text: string): void {
  seed += 1
  const item = { id: seed, text }
  listeners.forEach((listener) => listener(item))
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (item: ToastItem) => {
      setItems((prev) => [...prev, item])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((entry) => entry.id !== item.id))
      }, 1900)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((entry) => entry !== listener)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="animate-pop rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur dark:bg-white/95 dark:text-neutral-900"
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
