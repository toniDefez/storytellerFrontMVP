import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/login/LoginPage'
import MainLayout from './layouts/MainLayout'
import RegisterPage from './pages/register/RegisterPage'
import HomePage from './pages/home/HomePage'
import CreateWorldPage from './pages/home/CreateWorldPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import ErrorPage from './pages/ErrorPage'
import WorldDetailPage from './pages/home/WorldDetailPage'
import SettingsPage from './pages/settings/SettingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage />, errorElement: <ErrorPage /> },
  { path: '/register', element: <RegisterPage />, errorElement: <ErrorPage /> },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <MainLayout />,
        errorElement: <ErrorPage />,
        children: [
          { path: 'worlds', element: <HomePage /> },
          { path: 'worlds/create', element: <CreateWorldPage /> },
          { path: 'worlds/:id', element: <WorldDetailPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/installation', element: <Navigate to="/settings?tab=installation" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
