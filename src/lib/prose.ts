// La prosa llega del generador como texto plano, con los párrafos separados por
// líneas en blanco (a veces solo por un salto). El editor la leía como HTML y la
// juntaba en un único bloque, con los diálogos en mitad del párrafo.

export function proseParagraphs(text: string): string[] {
  const byBlank = text.split(/\n\s*\n/)
  const parts = byBlank.length > 1 ? byBlank : text.split(/\n/)
  return parts.map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** La prosa como HTML de párrafos, para el editor. */
export function proseToHtml(text: string): string {
  return proseParagraphs(text).map(p => `<p>${escapeHtml(p)}</p>`).join('')
}
