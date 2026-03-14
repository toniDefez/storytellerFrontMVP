import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { validateEmail, validatePassword } from '../../utils/validation'
import { register } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')

  useEffect(() => {
    document.title = `${t('pageTitle.register')} — StoryTeller`
  }, [t, i18n.language])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const navigate = useNavigate()

  const validate = () => {
    let valid = true
    setEmailError('')
    setPasswordError('')
    const emailMsg = validateEmail(email)
    if (emailMsg) { setEmailError(emailMsg); valid = false }
    const passwordMsg = validatePassword(password)
    if (passwordMsg) { setPasswordError(passwordMsg); valid = false }
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      await register(email, password)
      toast.success(t('auth.registerSuccessTitle'), { description: t('auth.registerSuccessDesc') })
      setTimeout(() => navigate('/'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader className="pb-2 pt-8 px-8">
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-foreground">
            {t('auth.createAccountTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('auth.createAccountSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.password')} required />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.registering')}</> : t('auth.registerButton')}
            </Button>
          </form>
          <p className="text-center text-sm mt-6 text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/" className="text-primary hover:underline font-semibold">{t('auth.loginLink')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
