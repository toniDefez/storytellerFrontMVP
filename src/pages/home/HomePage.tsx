import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import WorldCard from '../../components/WorldCard'
import { getWorlds } from '../../services/api'
import type { World } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WorldCardSkeleton } from '@/components/skeletons/WorldCardSkeleton'
import { Plus, Feather } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

/** Contar primero (2026-11-03): en el móvil la puerta por defecto es contar, no crear mundo. */
const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const cardVariant = {
  hidden: { opacity: 0, scale: 0.88 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tellOpen, setTellOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = `${t('pageTitle.home')} — StoryTeller`
  }, [t, i18n.language])

  useEffect(() => {
    getWorlds()
      .then(data => {
        const list = Array.isArray(data) ? data : []
        // Sin mundos, el móvil abre en «¿De qué va?»; el escritorio no cambia.
        if (list.length === 0 && isPhone()) {
          navigate('/contar', { replace: true })
          return
        }
        setWorlds(list)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <WorldCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (worlds.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[70vh] text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <p
          className="text-[11px] tracking-[0.35em] uppercase mb-5"
          style={{ color: 'hsl(260 30% 58%)' }}
        >
          StoryTeller
        </p>
        <h2
          className="text-4xl font-normal tracking-[-0.02em] mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 8% 11%)' }}
        >
          {t('home.emptyTitle')}
        </h2>
        <p className="text-base text-muted-foreground mb-10 max-w-sm leading-relaxed">
          {t('home.emptyDescription')}
        </p>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => navigate('/worlds/create')}>
            <Plus className="w-4 h-4" />
            {t('home.createFirstButton')}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-4 mb-6 md:mb-8">
        <div className="min-w-0">
          <h1
            className="text-3xl font-normal tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 8% 11%)' }}
          >
            {t('home.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('home.worldCount', { count: worlds.length })}</p>
        </div>
        <div className="flex flex-col gap-2 basis-full md:basis-auto md:flex-row">
          <Button onClick={() => setTellOpen(true)} className="min-h-11 md:hidden">
            <Feather className="w-4 h-4" />
            Contar
          </Button>
          <Button onClick={() => navigate('/worlds/create')} variant="outline" className="min-h-11 md:min-h-0 md:flex-none">
            <Plus className="w-4 h-4" />
            {t('home.createButton')}
          </Button>
        </div>
      </div>

      {/* Móvil: «Contar» pregunta en qué mundo, o uno nuevo. */}
      <Dialog open={tellOpen} onOpenChange={setTellOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="font-display text-xl font-normal">¿En qué mundo?</DialogTitle>
          <ul className="space-y-1">
            {worlds.map(w => (
              <li key={w.id}>
                <button type="button" onClick={() => navigate(`/worlds/${w.id}/contar`)} className="w-full min-h-11 rounded-md px-3 text-left font-display text-[17px] hover:bg-accent">
                  {w.name}
                </button>
              </li>
            ))}
            <li className="border-t border-border pt-1">
              <button type="button" onClick={() => navigate('/contar')} className="w-full min-h-11 rounded-md px-3 text-left text-sm text-primary hover:bg-accent">
                Mundo nuevo
              </button>
            </li>
          </ul>
        </DialogContent>
      </Dialog>

      <motion.div
        className="flex flex-col gap-3 max-w-3xl"
        variants={container}
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.07 }}
      >
        {worlds.map(world => (
          <motion.div key={world.id} variants={cardVariant}>
            <WorldCard
              id={world.id}
              name={world.name}
              description={world.description}
              premise={world.premise}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
