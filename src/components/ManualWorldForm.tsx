import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { createWorld } from '@/services/api'
import { notifyError } from '@/lib/notifyError'

/**
 * Crear un mundo sin generador: nombre y premisa, y a construirlo a mano.
 * Sin esto, quien aún no ha vinculado su generador se topaba con un muro al
 * crear su primer mundo, aunque la pantalla anterior prometía que podía
 * hacerlo a mano.
 */
export function ManualWorldForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [premise, setPremise] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const { id } = await createWorld(name.trim(), premise.trim(), '')
      navigate(`/worlds/${id}`)
    } catch (err) {
      notifyError('No se pudo crear el mundo')(err)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-left">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        O empieza a mano, sin IA
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del mundo"
        aria-label="Nombre del mundo"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <textarea
        value={premise}
        onChange={(e) => setPremise(e.target.value)}
        placeholder="La premisa (opcional): de qué va este mundo"
        aria-label="Premisa del mundo"
        rows={2}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-y"
      />
      <Button type="submit" variant="outline" className="w-full" disabled={!name.trim() || saving}>
        {saving ? 'Creando…' : 'Crear mundo vacío'}
      </Button>
    </form>
  )
}
