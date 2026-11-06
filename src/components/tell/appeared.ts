/** Clave de una tarjeta de «han aparecido»: persona (p) o sitio (s) más el nombre. */
export type AppearedKind = 'p' | 's'
export const appearedKey = (kind: AppearedKind, name: string) => `${kind}:${name}`
