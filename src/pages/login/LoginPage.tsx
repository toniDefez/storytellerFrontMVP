import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import EmailInput from '../../components/EmailInput'
import PasswordInput from '../../components/PasswordInput'
import ErrorModal from '../../components/ErrorModal'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('http://localhost:8080/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username:email, password }),
    })

    if (res.ok) {
      const { token } = await res.json()
      localStorage.setItem('token', token)
      navigate('/worlds')
    } else {
      setShowErrorModal(true)
      setError('Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200">
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <svg width="700" height="700" viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
          <circle cx="350" cy="350" r="300" fill="url(#paint0_radial)" />
          <defs>
            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(350 350) scale(300)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#fbc2eb" stopOpacity="0.7" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 w-full max-w-md border border-gray-200 backdrop-blur-md"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800 tracking-tight drop-shadow">Iniciar sesión</h2>

        {error && (
          <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>
        )}

        <EmailInput
          value={email}
          onChange={setEmail}
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
        />

        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-4 w-full rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide"
        >
          Entrar
        </button>

        <p className="text-center text-sm mt-6 text-gray-700">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-pink-600 hover:underline font-semibold">
            Regístrate aquí
          </Link>
        </p>
      </form>

      <ErrorModal
        open={showErrorModal}
        title="Error de inicio de sesión"
        message={error || 'No se pudo iniciar sesión. Inténtalo de nuevo.'}
        buttonText="Cerrar"
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  )
}
