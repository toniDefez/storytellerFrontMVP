import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SuccessModal from '../../components/SuccessModal'
import { validateEmail, validatePassword } from '../../utils/validation'
import EmailInput from '../../components/EmailInput'
import PasswordInput from '../../components/PasswordInput'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const navigate = useNavigate()

  const validate = () => {
    let valid = true
    setEmailError('')
    setPasswordError('')

    const emailMsg = validateEmail(email)
    if (emailMsg) {
      setEmailError(emailMsg)
      valid = false
    }

    const passwordMsg = validatePassword(password)
    if (passwordMsg) {
      setPasswordError(passwordMsg)
      valid = false
    }

    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    const res = await fetch('http://localhost:8080/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username:email, password }),
    })

    if (res.ok) {
      setShowSuccess(true)
      // Redirige después de cerrar el modal
    } else {
      const { message } = await res.json()
      setError(message || 'Error al registrar usuario')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-blue-200 to-pink-200">
      {/* Modal de éxito */}
      <SuccessModal
        open={showSuccess}
        title="¡Registro exitoso!"
        message="Tu cuenta ha sido creada correctamente."
        buttonText="Ir a iniciar sesión"
        onClose={() => navigate('/login')}
      />
      {/* Fin modal */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <svg width="700" height="700" viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
          <circle cx="350" cy="350" r="300" fill="url(#paint0_radial_reg)" />
          <defs>
            <radialGradient id="paint0_radial_reg" cx="0" cy="0" r="1" gradientTransform="translate(350 350) scale(300)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6ee7b7" />
              <stop offset="1" stopColor="#a5b4fc" stopOpacity="0.7" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 w-full max-w-md border border-gray-200 backdrop-blur-md"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800 tracking-tight drop-shadow">Crear cuenta</h2>

        {error && (
          <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>
        )}

        <EmailInput
          value={email}
          onChange={setEmail}
          externalError={emailError}
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          externalError={passwordError}
        />

        <button
          type="submit"
          className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-2 px-4 w-full rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide"
        >
          Registrarse
        </button>

        <p className="text-center text-sm mt-6 text-gray-700">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
