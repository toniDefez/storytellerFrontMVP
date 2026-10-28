// Formatos de salida de una escena. El grafo es la fuente y es el mismo; cambia
// cómo se escribe el texto y para qué. Siempre es texto: los que no son novela
// se copian a otro modelo. Los mismos nombres que usan backend y generador.
export type SceneFormat = 'prose' | 'audio' | 'video' | 'image'

export interface SceneFormatInfo {
  id: SceneFormat
  label: string
  /** Para qué sirve el texto, dicho al lado del selector. */
  purpose: string
  /** Texto del botón de copiar. */
  copyLabel: string
  experimental: boolean
}

export const SCENE_FORMATS: SceneFormatInfo[] = [
  { id: 'prose', label: 'Novela', purpose: 'La prosa de la historia.', copyLabel: 'Copiar texto', experimental: false },
  { id: 'audio', label: 'Guion de audio', purpose: 'Narrador y voces etiquetadas, con acotaciones de sonido, para un modelo de voz.', copyLabel: 'Copiar para un modelo de voz', experimental: true },
  { id: 'video', label: 'Guion de vídeo', purpose: 'Planos numerados con cámara, imagen, sonido y duración, para un modelo de vídeo.', copyLabel: 'Copiar para un modelo de vídeo', experimental: true },
  { id: 'image', label: 'Descripción de imagen', purpose: 'Una descripción visual por evento, para un modelo de imagen.', copyLabel: 'Copiar para un modelo de imagen', experimental: true },
]

export const formatInfo = (id: string): SceneFormatInfo =>
  SCENE_FORMATS.find((f) => f.id === id) ?? SCENE_FORMATS[0]
