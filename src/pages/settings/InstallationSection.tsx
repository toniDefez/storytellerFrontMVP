import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { getLinkingToken, revokeInstallation } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
  Monitor,
  Cpu,
  Globe,
  Clock,
  Link2,
  Server,
  Key,
  Play,
  RefreshCw,
  Zap,
  CheckCircle2,
  Download,
  Terminal,
  Trash2,
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

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(locale === 'en' ? 'en-US' : 'es-ES')
}

// --- Sub-components ---

function StatusBadge({ status }: { status: string }) {
  const isOnline = status.toLowerCase() === 'online' || status.toLowerCase() === 'active'
  return (
    <Badge
      variant="outline"
      className={
        isOnline
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-amber-300 bg-amber-50 text-amber-700'
      }
    >
      {isOnline ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
      )}
      {status}
    </Badge>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center justify-between py-3 border-b border-border last:border-b-0 transition-colors duration-150 hover:bg-accent/50 -mx-2 px-2 rounded-sm"
    >
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-foreground font-mono tabular-nums">{value}</span>
    </motion.div>
  )
}

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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 gap-1.5"
                >
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

function SetupSteps({ token }: { token: string }) {
  const { t } = useTranslation()
  const [commandCopied, setCommandCopied] = useState(false)

  const codeBlock = "bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed ring-1 ring-zinc-800 overflow-x-auto"

  const dockerCommand = `docker run --name storyteller-generator -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e RABBIT_URL=amqp://guest:guest@host.docker.internal:5672 -e INSTALLATION_ACCESS_TOKEN=${token || '<tu-token>'} ghcr.io/tonidefez/storyteller-generator`

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
          <p className="text-sm text-muted-foreground mb-2">
            {t('installation.step1Desc')}
          </p>
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
          <p className="text-sm text-muted-foreground mb-2">
            {t('installation.step2Desc')}
          </p>
          <div className={codeBlock}>
            <div className="mb-1"><span className="text-emerald-400">$</span> ollama pull llama3.2</div>
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
      color: 'text-emerald-500',
      bg: 'bg-emerald-500',
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
              ghcr.io/tonidefez/storyteller-generator
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
  ] as const

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {steps.map((step, i) => (
        <motion.div key={i} variants={fadeUp} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step.bg} text-white text-xs font-bold shrink-0 shadow-sm`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1.5" />
            )}
          </div>
          <div className={`flex-1 ${i < steps.length - 1 ? 'pb-6' : 'pb-0'}`}>
            <div className="flex items-center gap-2 mb-1">
              <step.icon className={`h-4 w-4 ${step.color} shrink-0`} />
              <h4 className="text-sm font-semibold text-foreground">
                {step.title}
              </h4>
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

function LinkedHeader() {
  const { t } = useTranslation()
  return (
    <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 px-6 py-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_hsl(var(--primary)/0.08),_transparent_70%)]" />
      <div className="relative flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-0.5">
              {t('installation.linkedBadge')}
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {t('installation.linkedTitle')}
            </h2>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main page ---

export function InstallationSection() {
  const { t, i18n } = useTranslation()
  const { installation, hasInstallation, loading, resetInstallation } = useInstallation()

  const [token, setToken] = useState('')
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
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={scaleIn}>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-end px-6 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => setRevokeDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('installation.revokeButton')}
              </Button>
            </div>
            <LinkedHeader />
            <CardHeader className="pt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {installation.machine_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      v{installation.version}
                    </p>
                  </div>
                </div>
                <StatusBadge status={installation.status} />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div variants={stagger} initial="hidden" animate="show">
                <DetailRow
                  icon={Monitor}
                  label={t('installation.osLabel')}
                  value={installation.os}
                />
                <DetailRow
                  icon={Cpu}
                  label={t('installation.archLabel')}
                  value={installation.arch}
                />
                <DetailRow
                  icon={Globe}
                  label={t('installation.ipLabel')}
                  value={`${installation.ip}:${installation.port}`}
                />
                <DetailRow
                  icon={Clock}
                  label={t('installation.lastSeenLabel')}
                  value={formatDate(installation.last_seen_at, i18n.language)}
                />
                <DetailRow
                  icon={Link2}
                  label={t('installation.createdAtLabel')}
                  value={formatDate(installation.created_at, i18n.language)}
                />
              </motion.div>

              <div className="mt-5 rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {t('installation.channelIdLabel')}
                </span>
                <div className="font-mono text-xs text-foreground break-all mt-1 leading-relaxed">
                  {installation.channel_id}
                </div>
              </div>
            </CardContent>

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
              <p className="text-sm text-destructive text-center">{revokeError}</p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  {t('installation.relinkTitle')}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('installation.relinkDesc')}
              </p>
            </CardHeader>
            <CardContent>
              <TokenGenerator compact token={token} setToken={setToken} />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={scaleIn}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('installation.setupTitle')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('installation.setupDesc')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SetupSteps token={token} />

            <Separator className="my-6" />

            <TokenGenerator token={token} setToken={setToken} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
