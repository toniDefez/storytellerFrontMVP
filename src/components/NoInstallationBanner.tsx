import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function NoInstallationBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-800 [&>svg]:text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('installation.bannerTitle')}</AlertTitle>
      <AlertDescription className="mt-1">
        {t('installation.bannerDesc')}
        <Button variant="link" className="h-auto p-0 ml-1 text-amber-700 underline" onClick={() => navigate('/settings?tab=installation')}>
          {t('installation.bannerLink')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
