import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { apiUrl, createPairingCode, revokeInstallation } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  Copy,
  Check,
  Clock,
  Key,
  Monitor,
  RefreshCw,
  Zap,
  Download,
  Trash2,
  AlertTriangle,
  Cpu,
  type LucideIcon,
} from 'lucide-react'

// --- Animation variants ---

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] as const } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] as const } },
}

// --- Helpers ---

function relativeTime(iso: string, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHrs = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  const isEs = locale !== 'en'
  if (diffMin < 1) return isEs ? 'ahora mismo' : 'just now'
  if (diffMin < 60) return isEs ? `hace ${diffMin} min` : `${diffMin} min ago`
  if (diffHrs < 24) return isEs ? `hace ${diffHrs} h` : `${diffHrs}h ago`
  return isEs ? `hace ${diffDays} días` : `${diffDays}d ago`
}

function connectedSince(iso: string, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
}

function isStale(iso: string): boolean {
  if (!iso) return false
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60_000
  return diffMin > 15
}

// --- Types ---

type WizardStep =
  | { icon: LucideIcon; color: string; bg: string; title: string; content: React.ReactNode }
  | { icon: LucideIcon; color: string; bg: string; title: string; description: string }

// --- Sub-components ---

export interface Pairing {
  code: string
  expiresAt: number
}

/** "K7M2QXA9" → "K7M2-QXA9": se lee en una pantalla y se teclea en otra. */
const showCode = (code: string) => code.replace(/^(.{4})(.+)$/, '$1-$2')

function useSecondsLeft(expiresAt: number | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return expiresAt ? Math.max(0, Math.round((expiresAt - now) / 1000)) : 0
}

/**
 * El código corto que el equipo cambia por sus credenciales (pair). Sustituye
 * al token largo: vale una vez y diez minutos, y no hay que pegarlo en ficheros.
 */
function PairingCodeGenerator({
  compact,
  pairing,
  setPairing,
}: {
  compact?: boolean
  pairing: Pairing | null
  setPairing: (p: Pairing | null) => void
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const secondsLeft = useSecondsLeft(pairing?.expiresAt)
  const expired = !!pairing && secondsLeft === 0

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      const result = await createPairingCode()
      setPairing({ code: result.code, expiresAt: new Date(result.expires_at).getTime() })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('installation.codeError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!pairing) return
    navigator.clipboard.writeText(pairing.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div>
      {(!pairing || expired) && (
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            size={compact ? 'default' : 'lg'}
            className={compact ? '' : 'w-full'}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('installation.generating')}
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                {expired ? t('installation.newCode') : t('installation.generateCode')}
              </>
            )}
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-4 text-destructive text-sm font-semibold"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pairing && !expired && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="mt-4 rounded-lg border border-primary/20 bg-accent/30 p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-sm text-foreground">{t('installation.codeLabel')}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5">
                {copied ? (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    {t('installation.tokenCopied')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    {t('installation.tokenCopy')}
                  </span>
                )}
              </Button>
            </div>
            <div className="bg-zinc-900 text-emerald-400 py-3 rounded-md font-mono text-2xl tracking-[0.3em] text-center select-all ring-1 ring-zinc-800">
              {showCode(pairing.code)}
            </div>
            <p className="text-xs text-muted-foreground mt-2.5">
              {t('installation.codeExpires', { time: `${minutes}:${seconds}` })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** La dirección que la app de escritorio pide junto al código: la de esta web. */
function ServerAddress() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(apiUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-1.5">{t('installation.serverLabel')}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground ring-1 ring-border">
          {apiUrl()}
        </code>
        <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1.5 shrink-0">
          {copied ? (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check className="h-3.5 w-3.5" />{t('installation.tokenCopied')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />{t('installation.tokenCopy')}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * El instalador, descarga directa: vive en un repo público solo de releases (el
 * código del generador es privado) y se llama siempre igual (nsis.artifactName).
 */
const APP_DOWNLOAD = 'https://github.com/toniDefez/storyteller-generator-releases/releases/latest/download/StoryTeller-Generador-Setup.exe'

function SetupSteps({ pairing, setPairing }: { pairing: Pairing | null; setPairing: (p: Pairing | null) => void }) {
  const { t } = useTranslation()

  const steps = [
    {
      icon: Download,
      color: 'text-primary',
      bg: 'bg-primary',
      title: t('installation.step1Title'),
      content: (
        <>
          <p className="text-sm text-muted-foreground mb-2">{t('installation.step1Desc')}</p>
          <a
            href="https://ollama.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            ollama.com/download
          </a>
        </>
      ),
    },
    {
      icon: Monitor,
      color: 'text-primary',
      bg: 'bg-primary',
      title: t('installation.step2Title'),
      content: (
        <>
          <p className="text-sm text-muted-foreground mb-2">{t('installation.step2Desc')}</p>
          <Button asChild size="sm" className="gap-1.5">
            <a href={APP_DOWNLOAD} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              {t('installation.downloadApp')}
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">{t('installation.step2Hint')}</p>
        </>
      ),
    },
    {
      icon: Key,
      color: 'text-primary',
      bg: 'bg-primary',
      title: t('installation.step3Title'),
      content: (
        <>
          <p className="text-sm text-muted-foreground mb-3">{t('installation.step3Desc')}</p>
          <PairingCodeGenerator pairing={pairing} setPairing={setPairing} />
          <ServerAddress />
        </>
      ),
    },
  ] as WizardStep[]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {steps.map((step, i) => (
        <motion.div key={i} variants={fadeUp} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step.bg} text-white text-xs font-bold shrink-0 shadow-sm`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-1.5" />}
          </div>
          <div className={`flex-1 min-w-0 ${i < steps.length - 1 ? 'pb-6' : 'pb-0'}`}>
            <div className="flex items-center gap-2 mb-1">
              <step.icon className={`h-4 w-4 ${step.color} shrink-0`} />
              <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
            </div>
            {'description' in step && step.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            )}
            {'content' in step && step.content}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// --- Linked view ---

function LinkedView({
  installation,
  onUnlink,
}: {
  installation: NonNullable<ReturnType<typeof useInstallation>['installation']>
  onUnlink: () => void
}) {
  const { t, i18n } = useTranslation()
  const [pairing, setPairing] = useState<Pairing | null>(null)
  const [showRelink, setShowRelink] = useState(false)

  const isActive = installation.status?.toLowerCase() === 'active'
  const stale = isActive && isStale(installation.last_seen_at)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={scaleIn}>
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-6 py-5 border-b border-border">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex h-2 w-2 rounded-full ${isActive && !stale ? 'bg-emerald-500' : 'bg-amber-400'} ${isActive && !stale ? 'ring-2 ring-emerald-500/25' : ''}`} />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isActive && !stale ? t('installation.statusReady') : t('installation.statusOffline')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">{installation.machine_name}</h2>
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded ring-1 ring-border">
                      v{installation.version}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 shrink-0"
                onClick={onUnlink}
              >
                <Trash2 className="h-4 w-4" />
                {t('installation.revokeButton')}
              </Button>
            </div>
          </div>

          <CardContent className="pt-4 space-y-3">
            {/* Staleness warning */}
            <AnimatePresence>
              {stale && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">{t('installation.staleWarning')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Offline message */}
            <AnimatePresence>
              {!isActive && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
                >
                  <Cpu className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{t('installation.offlineMessage')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('installation.lastSeenLabel')}</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {relativeTime(installation.last_seen_at, i18n.language)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('installation.connectedSinceLabel')}</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {connectedSince(installation.created_at, i18n.language)}
                </p>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('installation.modelLabel')}</span>
                </div>
                <p className="text-sm font-medium text-foreground font-mono">
                  {installation.model || '—'}
                </p>
              </div>
            </div>

            {/* Re-link */}
            <div className="pt-1 border-t border-border">
              <button
                onClick={() => setShowRelink(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {t('installation.relinkLink')}
              </button>

              <AnimatePresence>
                {showRelink && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <p className="text-xs text-muted-foreground mb-3">{t('installation.relinkDesc')}</p>
                      <PairingCodeGenerator compact pairing={pairing} setPairing={setPairing} />
                      {pairing && <ServerAddress />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// --- Main page ---

export function InstallationSection() {
  const { t } = useTranslation()
  const [pairing, setPairing] = useState<Pairing | null>(null)
  const { installation, hasInstallation, loading, resetInstallation } = useInstallation({ pairing: !!pairing })

  const [revoking, setRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState('')
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)

  const handleRevoke = async () => {
    setRevoking(true)
    setRevokeError('')
    try {
      await revokeInstallation()
      resetInstallation()
      setRevokeDialogOpen(false)
    } catch {
      setRevokeError(t('installation.revokeError'))
    } finally {
      setRevoking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hasInstallation && installation) {
    return (
      <>
        <LinkedView installation={installation} onUnlink={() => setRevokeDialogOpen(true)} />

        <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('installation.revokeDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('installation.revokeDialogDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={revoking}>{t('installation.revokeDialogCancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                disabled={revoking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revoking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('installation.revokeDialogConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {revokeError && (
          <p className="text-sm text-destructive text-center mt-2">{revokeError}</p>
        )}
      </>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={scaleIn}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('installation.setupTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('installation.setupDesc')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SetupSteps pairing={pairing} setPairing={setPairing} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
