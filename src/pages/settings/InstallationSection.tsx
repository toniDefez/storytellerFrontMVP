import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModelSelector, MODELS } from './ModelSelector'
import { motion, AnimatePresence } from 'framer-motion'
import { getLinkingToken, revokeInstallation } from '../../services/api'
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
  Play,
  RefreshCw,
  Zap,
  Download,
  Terminal,
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

function TokenGenerator({
  compact,
  token,
  setToken,
}: {
  compact?: boolean
  token: string
  setToken: (t: string) => void
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      const result = await getLinkingToken()
      setToken(result.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('installation.tokenError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
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
              {t('installation.generateToken')}
            </>
          )}
        </Button>
      </motion.div>

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
        {token && (
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
                <span className="font-semibold text-sm text-foreground">
                  {t('installation.tokenLabel')}
                </span>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5 text-emerald-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {t('installation.tokenCopied')}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {t('installation.tokenCopy')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
            <div className="bg-zinc-900 text-emerald-400 p-3 rounded-md font-mono text-xs break-all overflow-auto max-h-32 select-all leading-relaxed ring-1 ring-zinc-800">
              {token}
            </div>
            <p className="text-xs text-muted-foreground mt-2.5">
              {t('installation.tokenWarning')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SetupSteps({ token, selectedModel }: { token: string; selectedModel: string }) {
  const { t } = useTranslation()
  const [commandCopied, setCommandCopied] = useState(false)

  const codeBlock = "bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed ring-1 ring-zinc-800 overflow-x-auto"

  const dockerCommand = `docker run --name storyteller-generator -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e RABBIT_URL=amqp://guest:guest@host.docker.internal:5672 -e INSTALLATION_ACCESS_TOKEN=${token || '<tu-token>'} -e OLLAMA_MODEL=${selectedModel} ghcr.io/tonidefez/storyteller-generator`

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(dockerCommand)
    setCommandCopied(true)
    setTimeout(() => setCommandCopied(false), 2000)
  }

  const steps = [
    {
      icon: Download,
      color: 'text-violet-500',
      bg: 'bg-violet-500',
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
      icon: Terminal,
      color: 'text-sky-500',
      bg: 'bg-sky-500',
      title: t('installation.step2Title'),
      content: (
        <>
          <p className="text-sm text-muted-foreground mb-2">{t('installation.step2Desc')}</p>
          <div className={codeBlock}>
            <div className="mb-1">
              <span className="text-emerald-400">$</span>{' '}
              <span>ollama pull </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedModel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {selectedModel}
                </motion.span>
              </AnimatePresence>
            </div>
            <div><span className="text-emerald-400">$</span> ollama pull nomic-embed-text</div>
          </div>
        </>
      ),
    },
    {
      icon: Key,
      color: 'text-amber-500',
      bg: 'bg-amber-500',
      title: t('installation.step3Title'),
      description: t('installation.step3Desc'),
    },
    {
      icon: Play,
      color: 'text-primary',
      bg: 'bg-primary',
      title: t('installation.step4Title'),
      content: (
        <>
          <p className="text-sm text-muted-foreground mb-2">{t('installation.step4Desc')}</p>
          <div className="relative">
            <div className={codeBlock}>
              <span className="text-emerald-400">$</span>{' '}
              docker run --name storyteller-generator{' '}
              -e <span className="text-sky-400">OLLAMA_BASE_URL</span>=<span className="text-amber-300">http://host.docker.internal:11434</span>{' '}
              -e <span className="text-sky-400">RABBIT_URL</span>=<span className="text-amber-300">amqp://guest:guest@host.docker.internal:5672</span>{' '}
              -e <span className="text-sky-400">INSTALLATION_ACCESS_TOKEN</span>=
              <span className={token ? 'text-emerald-400' : 'text-amber-300'}>{token || '<tu-token>'}</span>{' '}
              -e <span className="text-sky-400">OLLAMA_MODEL</span>=
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedModel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-amber-300"
                >
                  {selectedModel}
                </motion.span>
              </AnimatePresence>{' '}
              <span>ghcr.io/tonidefez/storyteller-generator</span>
            </div>
            {token && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2">
                <Button variant="outline" size="sm" onClick={handleCopyCommand} className="w-full gap-1.5">
                  <AnimatePresence mode="wait">
                    {commandCopied ? (
                      <motion.span key="copied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-emerald-600">
                        <Check className="h-3.5 w-3.5" />{t('installation.commandCopied')}
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                        <Copy className="h-3.5 w-3.5" />{t('installation.copyCommand')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t('installation.step4Hint')}</p>
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
  const [token, setToken] = useState('')
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
                      <TokenGenerator compact token={token} setToken={setToken} />
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
  const { installation, hasInstallation, loading, resetInstallation } = useInstallation()

  const [token, setToken] = useState('')
  const [revoking, setRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState('')
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)

  const STORAGE_KEY = 'storyteller_ollama_model'

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && MODELS.some(m => m.tag === stored) ? stored : 'qwen2.5:7b'
  })

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    localStorage.setItem(STORAGE_KEY, model)
  }

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
            <div className="mb-6">
              <ModelSelector value={selectedModel} onChange={handleModelChange} />
            </div>
            <SetupSteps token={token} selectedModel={selectedModel} />
            <div className="mt-6 pt-6 border-t border-border">
              <TokenGenerator token={token} setToken={setToken} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
