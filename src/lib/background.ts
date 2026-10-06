import type { CSSProperties } from 'react'
import type { AppBackground } from '../types'

export interface GradientPreset {
  id: string
  name: string
  css: string
}

export const GRADIENTS: GradientPreset[] = [
  { id: 'aurora', name: '极光', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'dusk', name: '暮色', css: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' },
  { id: 'ocean', name: '深海', css: 'linear-gradient(135deg, #0f2027 0%, #203a43 45%, #2c5364 100%)' },
  { id: 'sunset', name: '日落', css: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 55%, #fbc2eb 100%)' },
  { id: 'peach', name: '蜜桃', css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'mint', name: '薄荷', css: 'linear-gradient(135deg, #a8edea 0%, #c3f0ca 60%, #fed6e3 100%)' },
  { id: 'lime', name: '青柠', css: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  { id: 'night', name: '夜幕', css: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)' },
]

export function gradientCss(id: string): string {
  return (GRADIENTS.find((item) => item.id === id) ?? GRADIENTS[0]).css
}

export interface PhotoPreset {
  id: string
  name: string
  url: string
  thumb: string
}

export const PHOTOS: PhotoPreset[] = [
  { id: 'p1', name: '山脉', url: 'https://picsum.photos/seed/navpage-1/2400/1600', thumb: 'https://picsum.photos/seed/navpage-1/320/200' },
  { id: 'p2', name: '海岸', url: 'https://picsum.photos/seed/navpage-2/2400/1600', thumb: 'https://picsum.photos/seed/navpage-2/320/200' },
  { id: 'p3', name: '城市', url: 'https://picsum.photos/seed/navpage-3/2400/1600', thumb: 'https://picsum.photos/seed/navpage-3/320/200' },
  { id: 'p4', name: '森林', url: 'https://picsum.photos/seed/navpage-4/2400/1600', thumb: 'https://picsum.photos/seed/navpage-4/320/200' },
  { id: 'p5', name: '星空', url: 'https://picsum.photos/seed/navpage-5/2400/1600', thumb: 'https://picsum.photos/seed/navpage-5/320/200' },
  { id: 'p6', name: '极简', url: 'https://picsum.photos/seed/navpage-6/2400/1600', thumb: 'https://picsum.photos/seed/navpage-6/320/200' },
]

export const SOLID_COLORS = ['#0f172a', '#1e293b', '#334155', '#0b3d91', '#1e3a8a', '#3b0764', '#7c2d12', '#065f46']

export function layerStyle(background: AppBackground): CSSProperties {
  if (background.kind === 'color') return { backgroundColor: background.value || '#0f172a' }
  if (background.kind === 'image') {
    return {
      backgroundImage: `url("${background.value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: background.blur > 0 ? `blur(${background.blur}px)` : undefined,
      transform: background.blur > 0 ? 'scale(1.06)' : undefined,
    }
  }
  if (background.kind === 'gradient') return { backgroundImage: gradientCss(background.value) }
  return {}
}

export function fileToDataUrl(file: File, maxSide = 2400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('无法解析图片'))
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('当前浏览器不支持 canvas'))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
