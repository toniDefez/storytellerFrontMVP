import type { ConsciousnessState } from '@/services/api'

const STATE_COLORS: Record<ConsciousnessState, string> = {
  dormido: '#94a3b8',
  inquieto: '#d97706',
  despierto: '#ea580c',
  explotador: '#dc2626',
  subversivo: '#be123c',
}

interface Props {
  state?: ConsciousnessState
}

export function ConsciousnessStateDot({ state }: Props) {
  if (!state) return null
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: STATE_COLORS[state] }}
      title={state}
    />
  )
}
