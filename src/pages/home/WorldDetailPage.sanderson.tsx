/**
 * WorldDetailPage -- Rediseno Sanderson
 *
 * ============================================================
 * C) WORLDDETAILPAGE ACTUALIZADA
 * ============================================================
 *
 * LAYOUT GENERAL:
 *
 * +------------------------------------------------------------------+
 * |  Breadcrumb: Mundos > [Nombre del mundo]                        |
 * +------------------------------------------------------------------+
 * |                                                                  |
 * |  +----- HERO SECTION ----------------------------------------+  |
 * |  |  [Gradient bg basado en inferGradient del eje]             |  |
 * |  |                                                            |  |
 * |  |  Nombre del mundo (Lora, 4xl, bold, white)                 |  |
 * |  |                                                            |  |
 * |  |  "En este mundo, la ceniza cae constantemente..."          |  |
 * |  |  (Lora, italic, xl, white/80)                              |  |
 * |  |  -- el eje central como cita protagonista --               |  |
 * |  |                                                            |  |
 * |  |                              [Editar] [Eliminar]           |  |
 * |  +------------------------------------------------------------+  |
 * |  |  [Sub-bar blanca con navegacion de secciones]              |  |
 * |  |  Capas | Facciones | Miedos | Personajes | Escenas        |  |
 * |  +------------------------------------------------------------+  |
 * |                                                                  |
 * |  +----- CAPAS DERIVADAS --------------------------------------+  |
 * |  |                                                            |  |
 * |  |  Las 5 capas como secciones expandidas, cada una con:      |  |
 * |  |  - Barra lateral de color de la capa (4px, rounded)        |  |
 * |  |  - Icono + nombre de capa como titulo                      |  |
 * |  |  - Texto completo de la derivacion                         |  |
 * |  |  - Layout de 2 columnas en desktop para las 5 capas:       |  |
 * |  |                                                            |  |
 * |  |  +--- Entorno ---+ +--- Subsistencia ---+                  |  |
 * |  |  | texto largo   | | texto largo        |                  |  |
 * |  |  +---------------+ +--------------------+                  |  |
 * |  |  +--- Organizacion ---+ +--- Tensiones ---+                |  |
 * |  |  | texto largo        | | texto largo     |                |  |
 * |  |  +--------------------+ +------------------+               |  |
 * |  |  +--- Tono narrativo (full width) ---+                     |  |
 * |  |  | texto largo                       |                     |  |
 * |  |  +-----------------------------------+                     |  |
 * |  |                                                            |  |
 * |  +------------------------------------------------------------+  |
 * |                                                                  |
 * |  +----- MUNDO PROFUNDO ----------------------------------------+  |
 * |  |                                                            |  |
 * |  |  Facciones, miedo colectivo, mentira colectiva,            |  |
 * |  |  vulnerabilidad del eje -- en cards sutiles                |  |
 * |  |                                                            |  |
 * |  +------------------------------------------------------------+  |
 * |                                                                  |
 * |  +----- PERSONAJES -------------------------------------------+  |
 * |  |  (igual que antes, con entity-character colors)            |  |
 * |  +------------------------------------------------------------+  |
 * |                                                                  |
 * |  +----- ESCENAS -----------------------------------------------+  |
 * |  |  (igual que antes, con entity-scene colors)                |  |
 * |  +------------------------------------------------------------+  |
 * +------------------------------------------------------------------+
 *
 * ESPECIFICACIONES DE LA HERO:
 *
 * - Gradient: generado por inferGradient(coreAxis)
 * - El nombre es text-4xl, font-display, font-bold, text-white
 * - El eje central se muestra como cita literaria:
 *   Comillas serif grandes (text-6xl, text-white/20) flotando arriba-izquierda
 *   Texto: font-display, italic, text-xl, text-white/80, max-w-2xl
 *   leading-relaxed, mt-3
 * - Botones de accion: ghost, text-white/80, hover text-white, hover bg-white/15
 *   Posicionados absolute top-4 right-4
 *
 * NAVEGACION DE SECCIONES (sub-bar):
 * - bg-card, border, rounded-b-xl
 * - Tabs horizontales con underline activa (border-bottom-2 primary)
 * - font-body, text-sm, font-medium
 * - Click scrollea a la seccion correspondiente (smooth)
 * - Sticky en scroll (top: 0, z-10)
 *
 * CAPAS DERIVADAS:
 * - Grid de 2 columnas en desktop, 1 en mobile
 * - Tono narrativo ocupa full width (col-span-2) como seccion final
 * - Cada capa:
 *   - Rounded-xl, bg-white, border border-gray-100
 *   - Barra lateral izquierda: 4px, rounded-full, color de la capa
 *   - Padding: px-5 py-4
 *   - Titulo: icono + nombre en uppercase tracking-widest, color de la capa
 *   - Texto: text-sm, text-foreground, leading-relaxed
 *   - Animacion de entrada: fade-in stagger (200ms entre cada una)
 *
 * MUNDO PROFUNDO (facciones, miedos, etc.):
 * - Solo visible si existen estos campos opcionales
 * - Layout: grid de 2-3 columnas con cards sutiles
 * - Facciones: cada una como badge grande con fondo accent
 * - Miedo colectivo: card con icono de calavera, fondo rose/5, texto rose
 * - Mentira colectiva: card con icono de mascara, fondo amber/5, texto amber
 * - Vulnerabilidad del eje: card con icono de grieta, fondo slate/5
 */

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import ConfirmModal from '@/components/ConfirmModal'
import { Plus, Users, Clapperboard, Trash2, Pencil, Skull, Theater, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { LAYER_META, type LayerKey } from '@/components/world-creation/DerivationLayer'

/* ------------------------------------------------------------------ */
/* Gradient inference (mismo algoritmo que WorldCard)                  */
/* ------------------------------------------------------------------ */

function inferGradient(coreAxis: string): string {
  const axis = coreAxis.toLowerCase()
  const patterns: [RegExp, string][] = [
    [/ceniza|volcán|volcan|fuego|lava|quema/, 'from-red-500 to-orange-600'],
    [/hielo|frio|nieve|glaciar|artico|congelad/, 'from-cyan-400 to-blue-600'],
    [/agua|oceano|mar|lluvia|inundac|rio/, 'from-blue-400 to-indigo-600'],
    [/bosque|selva|planta|verde|naturaleza/, 'from-emerald-400 to-teal-600'],
    [/desierto|arena|sol|sequ|arido/, 'from-amber-400 to-orange-600'],
    [/oscur|noche|sombra|tiniebla|negro/, 'from-slate-600 to-gray-800'],
    [/luz|brillo|estrella|cristal|diamante/, 'from-amber-300 to-yellow-500'],
    [/toxico|veneno|contamina|poluc/, 'from-lime-500 to-green-700'],
    [/guerra|batalla|destrucc|ruin/, 'from-rose-500 to-red-700'],
    [/magia|hechizo|encant|sobrenatural/, 'from-violet-500 to-purple-700'],
    [/tecnolog|maquin|robot|digital|cibern/, 'from-sky-400 to-cyan-600'],
    [/muerte|fin|apocali|extinct/, 'from-gray-500 to-slate-700'],
  ]
  for (const [pattern, gradient] of patterns) {
    if (pattern.test(axis)) return gradient
  }
  return 'from-violet-500 to-purple-600'
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SandersonWorld {
  id: number
  name: string
  coreAxis: string
  environment: string
  subsistence: string
  organization: string
  tensions: string
  tone: string
  factions?: { name: string; description?: string }[]
  collectiveFear?: string
  collectiveLie?: string
  axisVulnerability?: string
}

interface Character {
  id: number
  name: string
  role: string
  personality: string
  goals: string[]
}

interface Scene {
  id: number
  title: string
  location: string
  time: string
  tone: string
  context: string
}

const LAYER_ORDER: LayerKey[] = ['environment', 'subsistence', 'organization', 'tensions', 'tone']

type Section = 'layers' | 'deep' | 'characters' | 'scenes'

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function WorldDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [world, setWorld] = useState<SandersonWorld | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('layers')

  const sectionRefs = useRef<Record<Section, HTMLElement | null>>({
    layers: null, deep: null, characters: null, scenes: null,
  })

  useEffect(() => {
    document.title = `${world?.name ?? ''} -- StoryTeller`
  }, [t, i18n.language, world?.name])

  useEffect(() => {
    // TODO: reemplazar con la llamada real a la API
    // const detail = await getWorldDetail(Number(id))
    setLoading(false)

    // Mock data para demo
    setWorld({
      id: Number(id),
      name: 'Ceniza Perpetua',
      coreAxis: 'En este mundo llueve ceniza constantemente. El cielo no se ha despejado en siglos y toda forma de vida ha tenido que adaptarse a respirar, cultivar y construir bajo una lluvia gris interminable.',
      environment: 'Un paisaje perpetuamente gris donde la ceniza cae como nieve. Los cielos nunca se aclaran del todo. Los rios son oscuros y densos. La vegetacion que sobrevive tiene hojas gruesas y cerosas que repelen la ceniza, creando bosques de un verde antinatural entre la desolacion gris.',
      subsistence: 'La agricultura depende de invernaderos cerrados y cultivos subterraneos. El agua debe filtrarse constantemente. La pesca en rios contaminados requiere tecnicas de purificacion ancestrales.',
      organization: 'Ciudades-bunker con cupulas protectoras gobernadas por Gremios de Filtrado que controlan el acceso al aire y agua limpios.',
      tensions: 'Los Gremios de Filtrado acumulan poder excesivo y corrompen su proposito original. Los nomadas poseen conocimientos sobre la ceniza que los ciudadanos han olvidado. La ceniza esta cambiando.',
      tone: 'Melancolia resiliente. Belleza encontrada en la austeridad. Esperanza como recurso mas escaso que el agua limpia.',
      factions: [
        { name: 'Gremio de Filtrado', description: 'Controlan las cupulas y el acceso al aire limpio.' },
        { name: 'Nomadas de la Ceniza', description: 'Viven fuera de las cupulas, adaptados a la ceniza.' },
        { name: 'Orden del Cielo Limpio', description: 'Creen que la ceniza es un castigo divino.' },
      ],
      collectiveFear: 'Que la ceniza se vuelva tan fina que penetre las cupulas y no quede ningun refugio.',
      collectiveLie: 'Que los Gremios protegen a todos por igual, cuando en realidad las clases altas respiran aire tres veces mas puro.',
      axisVulnerability: 'Si la ceniza dejara de caer, toda la estructura de poder de los Gremios se derrumbaria, y con ella el unico orden conocido.',
    })
    setCharacters([])
    setScenes([])
  }, [id, t])

  const handleDelete = async () => {
    try {
      // await deleteWorld(Number(id))
      toast.success('Mundo eliminado correctamente.')
      navigate('/worlds')
    } catch {
      setError('Error al eliminar')
    }
  }

  const handleScrollToSection = (section: Section) => {
    setActiveSection(section)
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return <DetailSkeleton />
  if (error || !world) {
    return (
      <div className="flex justify-center items-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error || t('world.detail.notFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const gradient = inferGradient(world.coreAxis)
  const hasDeepContent = world.factions?.length || world.collectiveFear || world.collectiveLie || world.axisVulnerability

  const layerValues: Record<LayerKey, string> = {
    environment: world.environment,
    subsistence: world.subsistence,
    organization: world.organization,
    tensions: world.tensions,
    tone: world.tone,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-4">
      <PageBreadcrumb items={[
        { label: t('nav.worlds'), href: '/worlds' },
        { label: world.name },
      ]} />

      <ConfirmModal
        open={showConfirmDelete}
        title="Eliminar mundo"
        message={`Se eliminara "${world.name}" y todo su contenido permanentemente.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* ─── Hero Section ─── */}
      <div className="rounded-xl overflow-hidden shadow-lg">
        <div className={`bg-gradient-to-br ${gradient} px-8 py-12 relative`}>
          {/* Acciones */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/15" asChild>
              <Link to={`/worlds/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Editar
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/15" onClick={() => setShowConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Eliminar
            </Button>
          </div>

          {/* Nombre */}
          <h1 className="text-4xl font-bold text-white font-[var(--font-display)] leading-tight">
            {world.name}
          </h1>

          {/* Eje central como cita literaria */}
          <div className="mt-4 relative max-w-2xl">
            <span className="absolute -top-6 -left-2 text-5xl text-white/15 font-[var(--font-display)] select-none" aria-hidden="true">
              &ldquo;
            </span>
            <p className="text-lg text-white/80 font-[var(--font-display)] italic leading-relaxed pl-4">
              {world.coreAxis}
            </p>
            <span className="text-2xl text-white/15 font-[var(--font-display)] ml-1 select-none" aria-hidden="true">
              &rdquo;
            </span>
          </div>
        </div>

        {/* Barra de navegacion de secciones */}
        <nav className="bg-card border border-t-0 border-border rounded-b-xl px-6 py-0 sticky top-0 z-10">
          <div className="flex items-center gap-6 overflow-x-auto">
            {([
              { key: 'layers' as Section, label: 'Capas', count: 5 },
              ...(hasDeepContent ? [{ key: 'deep' as Section, label: 'Profundidad', count: undefined }] : []),
              { key: 'characters' as Section, label: 'Personajes', count: characters.length },
              { key: 'scenes' as Section, label: 'Escenas', count: scenes.length },
            ]).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleScrollToSection(tab.key)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeSection === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/20'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-xs text-muted-foreground/60">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ─── Capas Derivadas ─── */}
      <section ref={el => { sectionRefs.current.layers = el }} className="space-y-4">
        <h2 className="text-lg font-bold text-foreground font-[var(--font-display)] flex items-center gap-2">
          Las cinco capas
          <span className="text-sm font-normal text-muted-foreground">&mdash; derivadas del eje central</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LAYER_ORDER.map((layer, idx) => {
            const meta = LAYER_META[layer]
            const value = layerValues[layer]
            const isFullWidth = layer === 'tone'

            return (
              <motion.div
                key={layer}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className={`rounded-xl bg-white border border-gray-100 overflow-hidden ${
                  isFullWidth ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex">
                  {/* Barra lateral de color */}
                  <div className={`w-1 shrink-0 ${meta.color.replace('text-', 'bg-')} opacity-50`} />

                  <div className="px-5 py-4 flex-1">
                    {/* Titulo de capa */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm" aria-hidden="true">{meta.icon}</span>
                      <span className={`text-[11px] font-semibold uppercase tracking-widest ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Texto */}
                    <p className="text-sm text-foreground leading-relaxed">
                      {value}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ─── Mundo Profundo ─── */}
      {hasDeepContent && (
        <section ref={el => { sectionRefs.current.deep = el }} className="space-y-4">
          <h2 className="text-lg font-bold text-foreground font-[var(--font-display)]">
            Profundidad del mundo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Facciones */}
            {world.factions && world.factions.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <div className="rounded-xl bg-white border border-gray-100 px-5 py-4">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Facciones
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {world.factions.map(faction => (
                      <div
                        key={faction.name}
                        className="rounded-lg bg-accent/50 border border-primary/10 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-foreground">{faction.name}</p>
                        {faction.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{faction.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Miedo colectivo */}
            {world.collectiveFear && (
              <div className="rounded-xl bg-rose-50/50 border border-rose-100 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Skull className="w-4 h-4 text-rose-500" />
                  <h3 className="text-[11px] font-semibold text-rose-600 uppercase tracking-widest">
                    Miedo colectivo
                  </h3>
                </div>
                <p className="text-sm text-rose-900/70 leading-relaxed italic">
                  {world.collectiveFear}
                </p>
              </div>
            )}

            {/* Mentira colectiva */}
            {world.collectiveLie && (
              <div className="rounded-xl bg-amber-50/50 border border-amber-100 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Theater className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest">
                    Mentira colectiva
                  </h3>
                </div>
                <p className="text-sm text-amber-900/70 leading-relaxed italic">
                  {world.collectiveLie}
                </p>
              </div>
            )}

            {/* Vulnerabilidad del eje */}
            {world.axisVulnerability && (
              <div className="rounded-xl bg-slate-50/50 border border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">
                    Vulnerabilidad del eje
                  </h3>
                </div>
                <p className="text-sm text-slate-700/70 leading-relaxed italic">
                  {world.axisVulnerability}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Personajes ─── */}
      <section ref={el => { sectionRefs.current.characters = el }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-entity-character flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personajes
            <span className="text-base font-normal text-muted-foreground">({characters.length})</span>
          </h2>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/worlds/${id}/characters/create`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Crear personaje
            </Link>
          </Button>
        </div>

        {characters.length === 0 ? (
          <Card className="border-entity-character/20 bg-entity-character-light/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-entity-character/10 p-4 mb-4">
                <Users className="h-8 w-8 text-entity-character" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                Este mundo aun no tiene personajes
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Los personajes habitan las tensiones de tu mundo. Crea el primero para dar vida a este universo.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/worlds/${id}/characters/create`}>
                  Crear personaje
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map(c => (
              <Link key={c.id} to={`/worlds/${id}/characters/${c.id}`} className="block">
                <Card className="border-l-4 border-l-entity-character hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground">{c.name}</h3>
                    {c.role && (
                      <Badge className="mt-1.5 bg-entity-character/10 text-entity-character-muted border-entity-character/20">
                        {c.role}
                      </Badge>
                    )}
                    {c.personality && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.personality}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── Escenas ─── */}
      <section ref={el => { sectionRefs.current.scenes = el }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-entity-scene flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            Escenas
            <span className="text-base font-normal text-muted-foreground">({scenes.length})</span>
          </h2>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/worlds/${id}/scenes/create`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Crear escena
            </Link>
          </Button>
        </div>

        {scenes.length === 0 ? (
          <Card className="border-entity-scene/20 bg-entity-scene-light/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-entity-scene/10 p-4 mb-4">
                <Clapperboard className="h-8 w-8 text-entity-scene" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                Aun no hay escenas
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Las escenas son donde las tensiones de tu mundo cobran vida. Crea la primera escena para comenzar a narrar.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/worlds/${id}/scenes/create`}>
                  Crear escena
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenes.map(s => (
              <Link key={s.id} to={`/worlds/${id}/scenes/${s.id}`} className="block">
                <Card className="border-l-4 border-l-entity-scene hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground">{s.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.location && <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20">{s.location}</Badge>}
                      {s.tone && <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20">{s.tone}</Badge>}
                    </div>
                    {s.context && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.context}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
