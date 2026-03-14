import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function NoInstallationBanner() {
  const navigate = useNavigate()
  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-800 [&>svg]:text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Instalacion local no detectada</AlertTitle>
      <AlertDescription className="mt-1">
        Para generar contenido con IA necesitas tener una instalacion local vinculada a tu cuenta.
        <Button variant="link" className="h-auto p-0 ml-1 text-amber-700 underline" onClick={() => navigate('/settings/installation')}>
          Configurar instalacion
        </Button>
      </AlertDescription>
    </Alert>
  )
}
