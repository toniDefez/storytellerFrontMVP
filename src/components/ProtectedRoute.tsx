import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function ProtectedRoute() {
  const [isValid, setIsValid] = useState<null | boolean>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsValid(false)
      return
    }
    fetch(`${API_URL}/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        setIsValid(data.status === 'ok')
      })
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
