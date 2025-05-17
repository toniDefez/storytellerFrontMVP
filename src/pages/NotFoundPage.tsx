import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <img src="https://cdn-icons-png.flaticon.com/512/2748/2748558.png" alt="404" className="w-40 h-40 mb-6 opacity-80" />
      <h1 className="text-4xl font-extrabold text-purple-700 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Página no encontrada</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">La URL que has introducido no existe o ha sido movida. Por favor, revisa la dirección o vuelve al inicio.</p>
      <button
        onClick={() => navigate('/')}
        className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide"
      >
        Ir al inicio
      </button>
    </div>
  )
}
