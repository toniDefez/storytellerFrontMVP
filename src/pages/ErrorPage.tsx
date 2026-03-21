import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const is404 = isRouteErrorResponse(error) && error.status === 404

  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : t('error.unknown')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center text-center max-w-md gap-5">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {is404 ? t('error.notFoundTitle') : t('error.unexpectedTitle')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t('error.goBack')}
          </Button>
          <Button onClick={() => navigate('/worlds')}>
            {t('error.goHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}
