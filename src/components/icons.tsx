import {
  Star,
  Code,
  Sparkles,
  Palette,
  Clapperboard,
  Wrench,
  LayoutGrid,
  BookOpen,
  GraduationCap,
  Gamepad2,
  Globe,
  Heart,
  Home,
  Music,
  Newspaper,
  Plane,
  Camera,
  ShoppingBag,
  Smartphone,
  Briefcase,
  Cpu,
  Smile,
  Utensils,
  Film,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const PAGE_ICONS: Record<string, LucideIcon> = {
  star: Star,
  code: Code,
  sparkles: Sparkles,
  palette: Palette,
  clapperboard: Clapperboard,
  wrench: Wrench,
  home: Home,
  music: Music,
  game: Gamepad2,
  book: BookOpen,
  edu: GraduationCap,
  world: Globe,
  like: Heart,
  news: Newspaper,
  travel: Plane,
  camera: Camera,
  shopping: ShoppingBag,
  mobile: Smartphone,
  work: Briefcase,
  cpu: Cpu,
  emoji: Smile,
  food: Utensils,
  movie: Film,
  grid: LayoutGrid,
}

export const PAGE_ICON_NAMES = Object.keys(PAGE_ICONS).filter((name) => name !== 'grid')

export function pageIcon(name: string): LucideIcon {
  return PAGE_ICONS[name] ?? LayoutGrid
}
