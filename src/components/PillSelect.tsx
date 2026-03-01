import { useState } from 'react'

interface PillSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  descriptions?: Record<string, string>
}

export function PillSelect({ options, value, onChange, descriptions }: PillSelectProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const activeKey = hovered ?? (value || null)
  const activeDesc = activeKey ? descriptions?.[activeKey] : null

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            onMouseEnter={() => setHovered(opt)}
            onMouseLeave={() => setHovered(null)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
              value === opt
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className={`overflow-hidden transition-all duration-200 ${activeDesc ? 'max-h-16 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-2 border-l-2 border-violet-400 bg-gradient-to-r from-violet-50 to-transparent rounded-r-lg">
          <p className="text-[11px] text-violet-700 italic leading-relaxed">{activeDesc}</p>
        </div>
      </div>
    </div>
  )
}

interface MultiPillSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  descriptions?: Record<string, string>
}

export function MultiPillSelect({ options, value, onChange, descriptions }: MultiPillSelectProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const activeDesc = hovered ? descriptions?.[hovered] : null

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            onMouseEnter={() => setHovered(opt)}
            onMouseLeave={() => setHovered(null)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
              value.includes(opt)
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className={`overflow-hidden transition-all duration-200 ${activeDesc ? 'max-h-16 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-2 border-l-2 border-violet-400 bg-gradient-to-r from-violet-50 to-transparent rounded-r-lg">
          <p className="text-[11px] text-violet-700 italic leading-relaxed">{activeDesc}</p>
        </div>
      </div>
    </div>
  )
}
