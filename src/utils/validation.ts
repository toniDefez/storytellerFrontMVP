// src/utils/validation.ts

export function validateEmail(email: string): string {
  if (!email) return 'El email es obligatorio'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Introduce un email válido'
  return ''
}

export function validatePassword(password: string, minLength = 6): string {
  if (!password) return 'La contraseña es obligatoria'
  if (password.length < minLength) return `La contraseña debe tener al menos ${minLength} caracteres`
  return ''
}
