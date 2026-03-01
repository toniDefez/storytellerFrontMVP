interface PillSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
}

export function PillSelect({ options, value, onChange }: PillSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? '' : opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
            value === opt
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

interface MultiPillSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
}

export function MultiPillSelect({ options, value, onChange }: MultiPillSelectProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
            value.includes(opt)
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
