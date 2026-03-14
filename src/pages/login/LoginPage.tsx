import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')

  useEffect(() => {
    document.title = `${t('pageTitle.login')} — StoryTeller`
  }, [t, i18n.language])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader className="pb-2 pt-8 px-8">
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-foreground">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('auth.welcomeSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.password')} required />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loggingIn')}</> : t('auth.loginButton')}
            </Button>
          </form>
          <p className="text-center text-sm mt-6 text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">{t('auth.registerLink')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
