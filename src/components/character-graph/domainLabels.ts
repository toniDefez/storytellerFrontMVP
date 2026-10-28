import type { CharacterNodeDomain } from '@/services/api'

// Nombre en pantalla de cada dominio psicológico. El lienzo y el panel de
// detalle lo comparten: el detalle enseñaba el valor interno («drive»).
export const CHARACTER_DOMAIN_LABEL: Record<CharacterNodeDomain, string> = {
  origin: 'CREENCIAS',
  fear: 'MIEDOS',
  drive: 'DESEOS',
  bond: 'GRIETAS',
  mask: 'MÁSCARAS',
}
