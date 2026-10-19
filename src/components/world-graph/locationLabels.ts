// Nombres para mostrar de los valores internos de una localización. La API
// usa claves en inglés (conflict, settlement…) y la interfaz las enseñaba tal
// cual, en mitad de pantallas en español.

export const NARRATIVE_FN_LABELS: Record<string, string> = {
  conflict: 'Conflicto',
  origin: 'Origen',
  threshold: 'Umbral',
  atmosphere: 'Atmósfera',
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  settlement: 'Asentamiento',
  wilderness: 'Naturaleza salvaje',
  ruin: 'Ruina',
  landmark: 'Hito',
  passage: 'Paso',
  structure: 'Construcción',
}

export const narrativeFnLabel = (v?: string | null) => (v ? NARRATIVE_FN_LABELS[v] ?? v : '')
export const nodeTypeLabel = (v?: string | null) => (v ? NODE_TYPE_LABELS[v] ?? v : '')
