import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { validateToken } from '../services/api'

export default function ProtectedRoute() {
  const [isValid, setIsValid] = useState<null | boolean>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsValid(false)
      return
    }
    validateToken()
      .then(data => setIsValid(data.status === 'ok'))
      .catch(() => setIsValid(false))
  }, [])

  if (isValid === null) {
    return <div className="w-full h-screen flex items-center justify-center text-lg text-gray-600">Validando sesión...</div>
  }
  if (!isValid) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
