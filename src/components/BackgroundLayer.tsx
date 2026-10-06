import { layerStyle } from '../lib/background'
import type { AppBackground } from '../types'

export function BackgroundLayer({ background }: { background: AppBackground }) {
  if (background.kind === 'none') return null
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0" style={layerStyle(background)} />
      {background.mask > 0 ? (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${background.mask / 100})` }} />
      ) : null}
    </div>
  )
}
