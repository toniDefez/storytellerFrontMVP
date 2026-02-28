import { useNavigate } from 'react-router-dom'

export default function NoInstallationBanner() {
  const navigate = useNavigate()

  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
      <p className="font-semibold mb-1">Instalacion local no detectada</p>
      <p className="text-sm mb-3">
        Para generar contenido con IA necesitas tener una instalacion local vinculada a tu cuenta.
        Esta ejecuta el modelo de lenguaje en tu maquina.
      </p>
      <button
        type="button"
        onClick={() => navigate('/settings/installation')}
        className="text-sm font-bold text-amber-700 underline hover:text-amber-900"
      >
        Configurar instalacion
      </button>
    </div>
  )
}
