// Las tres preguntas que definen el mundo en la escena 0 (textos fijados).
export type WorldLineKey = 'rule' | 'scarcity' | 'power'

export const LINES: { key: WorldLineKey; question: string; hint: string }[] = [
  { key: 'rule', question: '¿Qué es siempre verdad aquí?', hint: 'La regla del mundo. De una a tres frases.' },
  { key: 'scarcity', question: '¿Qué falta?', hint: 'Lo que escasea y por lo que la gente se mueve.' },
  { key: 'power', question: '¿Quién manda?', hint: 'Quién controla eso y quién no acepta que lo controle.' },
]
