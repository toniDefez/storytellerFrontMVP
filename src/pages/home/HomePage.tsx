import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import WorldCard from '../../components/WorldCard'
import { getWorlds } from '../../services/api'
import type { World } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WorldCardSkeleton } from '@/components/skeletons/WorldCardSkeleton'
import ConfirmModal from '../../components/ConfirmModal'
import { Plus, Globe, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  validateExportFile,
  validateExportVersion,
  importWorld,
} from '../../services/worldExport'
import type { StoryTellerExport } from '../../services/worldExport'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
}

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importData, setImportData] = useState<StoryTellerExport | null>(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = `${t('pageTitle.home')} — StoryTeller`
  }, [t, i18n.language])

  useEffect(() => {
    getWorlds()
      .then(data => setWorlds(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (!validateExportFile(parsed)) {
          toast.error(t('importExport.importInvalidFile'))
          return
        }
        if (!validateExportVersion(parsed)) {
          toast.error(t('importExport.importInvalidVersion'))
          return
        }
        setImportData(parsed)
        setShowImportConfirm(true)
      } catch {
        toast.error(t('importExport.importInvalidFile'))
      }
    }
    reader.readAsText(file)

    // Reset so re-selecting the same file triggers onChange again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [t])

  const handleImportConfirm = useCallback(async () => {
    if (!importData) return
    setShowImportConfirm(false)
    setImporting(true)
    const result = await importWorld(importData)
    setImporting(false)
    setImportData(null)
    if (result.success && result.worldId) {
      toast.success(t('importExport.importSuccess'))
      navigate(`/worlds/${result.worldId}`)
    } else {
      toast.error(result.error || t('importExport.importError'))
    }
  }, [importData, navigate, t])

  const handleImportCancel = useCallback(() => {
    setShowImportConfirm(false)
    setImportData(null)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
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

  const importElements = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
        aria-label={t('importExport.importButton')}
      />
      <ConfirmModal
        open={showImportConfirm}
        title={t('importExport.importConfirmTitle')}
        message={t('importExport.importConfirmMessage', {
          name: importData?.storyteller_export?.world?.name ?? '',
        })}
        confirmText={t('importExport.importButton')}
        cancelText={t('common.cancel')}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />
    </>
  )

  if (worlds.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[70vh]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {importElements}
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
          <Globe className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-[var(--font-display)] text-2xl font-bold text-foreground mb-2">{t('home.emptyTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs leading-relaxed">
          {t('home.emptyDescription')}
        </p>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => navigate('/worlds/create')}>
            <Plus className="w-4 h-4" />
            {t('home.createFirstButton')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4" />
            {importing ? t('importExport.importing') : t('importExport.importButton')}
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
      {importElements}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-foreground">{t('home.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('home.worldCount', { count: worlds.length })}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4" />
            {importing ? t('importExport.importing') : t('importExport.importButton')}
          </Button>
          <Button onClick={() => navigate('/worlds/create')}>
            <Plus className="w-4 h-4" />
            {t('home.createButton')}
          </Button>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
              factions={world.factions}
              description={world.description}
              core_axis={world.core_axis}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
