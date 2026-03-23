import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../../services/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Entity preview cards for the showcase panel ─────────────────────────────
interface PreviewCard {
  type: string
  label: string
  name: string
  detail: string
  headerBg: string
  badgeBg: string
  badgeText: string
  top: number
  left: number
  rotate: number
  zIndex: number
}

const PREVIEW_CARDS: PreviewCard[] = [
  {
    type: 'world',
    label: 'Mundo',
    name: 'Aethoria',
    detail: 'Un vasto reino donde la magia antigua duerme bajo montañas eternas.',
    headerBg: 'linear-gradient(135deg, hsl(155 45% 18%), hsl(185 50% 13%))',
    badgeBg: 'hsl(260 38% 40% / 0.25)',
    badgeText: 'hsl(260 38% 75%)',
    top: 0,
    left: 0,
    rotate: -5,
    zIndex: 1,
  },
  {
    type: 'character',
    label: 'Personaje',
    name: 'Lyra Voss',
    detail: 'Exploradora · Heraldo de la Tormenta',
    headerBg: 'linear-gradient(135deg, hsl(17 55% 20%), hsl(30 50% 15%))',
    badgeBg: 'hsl(17 63% 37% / 0.25)',
    badgeText: 'hsl(17 63% 72%)',
    top: 72,
    left: 56,
    rotate: 4,
    zIndex: 2,
  },
  {
    type: 'scene',
    label: 'Escena',
    name: 'La Fortaleza Caída',
    detail: 'La lluvia golpeaba las piedras mientras el eco de pasos resonaba en la oscuridad.',
    headerBg: 'linear-gradient(135deg, hsl(180 45% 13%), hsl(195 48% 10%))',
    badgeBg: 'hsl(180 55% 30% / 0.25)',
    badgeText: 'hsl(180 55% 65%)',
    top: 144,
    left: 112,
    rotate: -3,
    zIndex: 3,
  },
]

// ── Motion variants ──────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.93 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.25 + i * 0.18,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

const formVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const panelVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = `${t('pageTitle.login')} — StoryTeller`
  }, [t, i18n.language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      localStorage.setItem('token', data.token)
      navigate('/worlds')
    } catch {
      toast.error(t('auth.loginErrorTitle'), { description: t('auth.loginErrorDesc') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: atmospheric showcase ────────────────────────────── */}
      <motion.aside
        initial="hidden"
        animate="visible"
        variants={panelVariants}
        aria-hidden="true"
        className="hidden lg:flex flex-col justify-between w-[58%] relative overflow-hidden px-16 py-14"
        style={{ background: 'hsl(260 25% 7%)' }}
      >
        {/* Radial depth glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 38% 50%, hsl(260 30% 13% / 0.9) 0%, transparent 70%)',
          }}
        />

        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle, hsl(260 20% 45% / 0.5) 0.5px, transparent 0.5px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <p
            className="text-xs tracking-[0.35em] uppercase mb-2"
            style={{ color: 'hsl(260 20% 50%)' }}
          >
            Bienvenido a
          </p>
          <h1
            className="text-5xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'hsl(40 15% 93%)' }}
          >
            StoryTeller
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: 'hsl(260 10% 50%)', maxWidth: '22rem' }}
          >
            Crea mundos. Da vida a personajes.<br />
            Narra historias sin límites.
          </p>
        </div>

        {/* Entity preview cards */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="relative" style={{ width: 280, height: 300 }}>
            {PREVIEW_CARDS.map((card, i) => (
              <motion.div
                key={card.type}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="absolute w-64 rounded-xl overflow-hidden select-none"
                style={{
                  top: card.top,
                  left: card.left,
                  rotate: card.rotate,
                  zIndex: card.zIndex,
                  boxShadow:
                    '0 16px 48px hsl(260 40% 2% / 0.85), 0 2px 10px hsl(260 40% 2% / 0.5)',
                }}
              >
                {/* Card header */}
                <div
                  className="h-11 flex items-center px-3 gap-2"
                  style={{ background: card.headerBg }}
                >
                  <span
                    className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                    style={{ background: card.badgeBg, color: card.badgeText }}
                  >
                    {card.label}
                  </span>
                </div>

                {/* Card body */}
                <div
                  className="px-4 py-3"
                  style={{
                    background: 'hsl(260 18% 12%)',
                    borderLeft: '1px solid hsl(260 15% 20%)',
                    borderRight: '1px solid hsl(260 15% 20%)',
                    borderBottom: '1px solid hsl(260 15% 20%)',
                  }}
                >
                  <p
                    className="font-semibold text-[15px] leading-snug"
                    style={{ fontFamily: 'var(--font-display)', color: 'hsl(40 15% 88%)' }}
                  >
                    {card.name}
                  </p>
                  <p
                    className="text-xs mt-1 leading-snug line-clamp-2"
                    style={{ color: 'hsl(260 10% 50%)' }}
                  >
                    {card.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative z-10">
          <p
            className="text-sm italic"
            style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 10% 32%)' }}
          >
            "Toda gran historia comienza con un mundo."
          </p>
        </div>
      </motion.aside>

      {/* ── Right panel: login form ──────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-12"
        style={{ background: 'hsl(40 20% 98%)' }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={formVariants}
          className="w-full max-w-sm"
        >
          {/* Mobile brand mark (hidden on desktop) */}
          <div className="lg:hidden mb-10">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 25% 20%)' }}
            >
              StoryTeller
            </h1>
          </div>

          {/* Heading */}
          <h2
            className="text-4xl font-bold leading-tight mb-1.5"
            style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 8% 11%)' }}
          >
            {t('auth.welcomeTitle')}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'hsl(30 6% 47%)' }}>
            {t('auth.welcomeSubtitle')}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity duration-200 mt-1 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: 'hsl(260 38% 40%)',
                boxShadow: '0 2px 14px hsl(260 38% 40% / 0.35)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.loggingIn')}
                </span>
              ) : (
                t('auth.loginButton')
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'hsl(30 6% 47%)' }}>
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'hsl(260 38% 40%)' }}
            >
              {t('auth.registerLink')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
