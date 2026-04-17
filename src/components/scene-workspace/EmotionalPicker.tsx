interface Props {
  selected: string
  onChange: (emotion: string) => void
}

const GROUPS = [
  {
    label: 'Tensión',
    color: 'red',
    activeBg: 'bg-red-100',
    activeText: 'text-red-700',
    emotions: ['Ira', 'Miedo', 'Desconfianza', 'Desprecio'],
  },
  {
    label: 'Vulnerabilidad',
    color: 'pink',
    activeBg: 'bg-pink-100',
    activeText: 'text-pink-700',
    emotions: ['Culpa', 'Vergüenza', 'Desesperación', 'Duda'],
  },
  {
    label: 'Fuerza',
    color: 'emerald',
    activeBg: 'bg-emerald-100',
    activeText: 'text-emerald-700',
    emotions: ['Determinación', 'Orgullo', 'Desafío', 'Esperanza'],
  },
  {
    label: 'Conexión',
    color: 'blue',
    activeBg: 'bg-blue-100',
    activeText: 'text-blue-700',
    emotions: ['Lealtad', 'Ternura', 'Admiración', 'Alivio'],
  },
  {
    label: 'Giro',
    color: 'amber',
    activeBg: 'bg-amber-100',
    activeText: 'text-amber-700',
    emotions: ['Resignación', 'Revelación', 'Traición', 'Negación'],
  },
]

export function EmotionalPicker({ selected, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium mb-1">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.emotions.map(emotion => {
              const isSelected = selected === emotion
              return (
                <button
                  key={emotion}
                  onClick={() => onChange(emotion)}
                  className={`px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? `${group.activeBg} ${group.activeText} font-medium`
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {emotion}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
