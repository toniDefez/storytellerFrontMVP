import { useState } from 'react'
import { getLinkingToken } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function StatusBadge({ status }: { status: string }) {
  const isOnline = status.toLowerCase() === 'online'
  const bg = isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
  return (
    <span className={`${bg} px-3 py-1 rounded-full text-sm font-semibold`}>
      {status}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}

function TokenGenerator() {
  const [token, setToken] = useState('')
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
      setError(err instanceof Error ? err.message : 'No se pudo generar el token.')
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
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg w-full disabled:opacity-60"
      >
        {loading ? 'Generando...' : 'Generar token de vinculacion'}
      </button>

      {error && <p className="mt-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

      {token && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Token de vinculacion:</span>
            <button
              onClick={handleCopy}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs break-all overflow-auto max-h-32">
            {token}
          </div>
        </div>
      )}
    </div>
  )
}

function SetupInstructions() {
  return (
    <div className="mb-6 text-gray-700 space-y-3">
      <p>Para generar contenido con IA necesitas un generador local ejecutandose en tu maquina.</p>
      <ol className="list-decimal list-inside space-y-2 ml-2">
        <li>Genera un <strong>token de vinculacion</strong> con el boton de abajo</li>
        <li>Usa el token para registrar tu instalacion local (endpoint <code className="bg-gray-100 px-1 rounded">POST /installation</code>)</li>
        <li>Copia el <code className="bg-gray-100 px-1 rounded">channelID</code> de la respuesta</li>
        <li>Configura tu generador con <code className="bg-gray-100 px-1 rounded">CHANNEL_ID=&lt;channelID&gt;</code> en el archivo <code className="bg-gray-100 px-1 rounded">.env</code></li>
        <li>Inicia el generador: <code className="bg-gray-100 px-1 rounded">npm run start</code></li>
      </ol>
    </div>
  )
}

export default function InstallationPage() {
  const { installation, hasInstallation, loading } = useInstallation()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 text-lg text-gray-500">
        Cargando instalacion...
      </div>
    )
  }

  if (hasInstallation && installation) {
    return (
      <div className="max-w-2xl mx-auto mt-8 space-y-6">
        <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-purple-800">Instalacion local</h2>
            <StatusBadge status={installation.status} />
          </div>

          <div className="space-y-0">
            <DetailRow label="Maquina" value={installation.machine_name} />
            <DetailRow label="Sistema operativo" value={installation.os} />
            <DetailRow label="Arquitectura" value={installation.arch} />
            <DetailRow label="Version" value={installation.version} />
            <DetailRow label="IP" value={installation.ip} />
            <DetailRow label="Puerto" value={String(installation.port)} />
            <DetailRow label="Ultima conexion" value={formatDate(installation.last_seen_at)} />
            <DetailRow label="Vinculada desde" value={formatDate(installation.created_at)} />
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg border">
            <span className="text-gray-500 text-sm font-medium">Channel ID</span>
            <div className="font-mono text-xs text-gray-700 break-all mt-1">
              {installation.channel_id}
            </div>
          </div>
        </div>

        <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-purple-700 mb-4">Revincular instalacion</h3>
          <p className="text-gray-600 text-sm mb-4">
            Si necesitas vincular una nueva instalacion, genera un nuevo token.
          </p>
          <TokenGenerator />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-extrabold text-purple-800 mb-6">Configurar generador local</h2>
        <SetupInstructions />
        <TokenGenerator />
      </div>
    </div>
  )
}
