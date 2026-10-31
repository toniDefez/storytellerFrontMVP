import { useEffect, useState } from 'react'

// Mismo umbral que el prefijo `md:` de Tailwind: por debajo es móvil.
// Solo para decidir en JS lo que no puede decidir una clase (estilos inline
// de Framer, montar una hoja en vez de un panel). Lo que es solo layout
// sigue yendo con clases `md:`.
const QUERY = '(max-width: 767px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}
