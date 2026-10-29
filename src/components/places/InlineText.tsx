import { useRef, useState, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * Un texto que se edita en su sitio y se guarda al salir del campo.
 *
 * Mientras tiene el foco enseña el borrador; sin foco, el valor guardado, así
 * que si otro cambio llega de fuera el campo lo refleja sin efectos que
 * sincronicen estado. Esc descarta; Enter (en una línea) guarda.
 */
export function InlineText({
  value, onCommit, multiline, required, className, placeholder, label,
}: {
  value: string
  onCommit: (next: string) => void
  multiline?: boolean
  required?: boolean
  className?: string
  placeholder?: string
  label: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const discard = useRef(false)

  const commit = () => {
    const next = (draft ?? value).trim()
    setDraft(null)
    if (discard.current) { discard.current = false; return }
    if (next === value.trim() || (required && !next)) return
    onCommit(next)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      discard.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Enter' && !multiline) {
      e.currentTarget.blur()
    }
  }
  const common = {
    value: draft ?? value,
    placeholder,
    'aria-label': label,
    onFocus: () => setDraft(value),
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown,
  }
  const quiet = 'border-transparent shadow-none hover:border-input focus-visible:border-ring -mx-2 px-2'
  return multiline
    ? <Textarea {...common} rows={3} className={`${quiet} min-h-0 resize-none ${className ?? ''}`} />
    : <Input {...common} className={`${quiet} ${className ?? ''}`} />
}
