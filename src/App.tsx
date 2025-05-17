import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/login/LoginPage'
import MainLayout from './layouts/MainLayout'
import RegisterPage from './pages/register/RegisterPage'
import HomePage from './pages/home/HomePage'
import CreateWorldPage from './pages/home/CreateWorldPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import WorldDetailPage from './pages/home/WorldDetailPage'

function App() {
  return (
    <Routes>
      {/* Página pública sin layout */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas con layout común */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route path="worlds" element={<HomePage />} />
          <Route path="worlds/create" element={<CreateWorldPage />} />
          <Route path="worlds/:id" element={<WorldDetailPage />} />
        </Route>
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
