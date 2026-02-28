import { useState } from 'react'
import { getLinkingToken } from '../../services/api'

export default function InstallationPage() {
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
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-extrabold text-purple-800 mb-6">Configurar generador local</h2>

        <div className="mb-6 text-gray-700 space-y-3">
          <p>Para generar contenido con IA necesitas un generador local ejecutándose en tu máquina.</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Genera un <strong>token de vinculación</strong> con el botón de abajo</li>
            <li>Usa el token para registrar tu instalación local (endpoint <code className="bg-gray-100 px-1 rounded">POST /installation</code>)</li>
            <li>Copia el <code className="bg-gray-100 px-1 rounded">channelID</code> de la respuesta</li>
            <li>Configura tu generador con <code className="bg-gray-100 px-1 rounded">CHANNEL_ID=&lt;channelID&gt;</code> en el archivo <code className="bg-gray-100 px-1 rounded">.env</code></li>
            <li>Inicia el generador: <code className="bg-gray-100 px-1 rounded">npm run start</code></li>
          </ol>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg w-full disabled:opacity-60"
        >
          {loading ? 'Generando...' : 'Generar token de vinculación'}
        </button>

        {error && <p className="mt-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

        {token && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">Token de vinculación:</span>
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
    </div>
  )
}
