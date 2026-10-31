import { Castle, DoorOpen, House, Landmark, Mountain, Trees, type LucideIcon } from 'lucide-react'
import type { LocationNodeType } from '@/services/api'

/** Icono de cada tipo de lugar (sustituye a los emojis). */
export const NODE_TYPE_ICONS: Record<LocationNodeType, LucideIcon> = {
  settlement: House,
  wilderness: Trees,
  ruin: Castle,
  landmark: Mountain,
  passage: DoorOpen,
  structure: Landmark,
}

export const NODE_TYPES: LocationNodeType[] = ['settlement', 'wilderness', 'ruin', 'landmark', 'passage', 'structure']
