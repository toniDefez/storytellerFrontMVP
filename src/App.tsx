import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/login/LoginPage'
import MainLayout from './layouts/MainLayout'
import RegisterPage from './pages/register/RegisterPage'
import HomePage from './pages/home/HomePage'
import CreateWorldPage from './pages/home/CreateWorldPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import WorldDetailPage from './pages/home/WorldDetailPage'
import CreateCharacterPage from './pages/characters/CreateCharacterPage'
import CharacterDetailPage from './pages/characters/CharacterDetailPage'
import CreateScenePage from './pages/scenes/CreateScenePage'
import SceneDetailPage from './pages/scenes/SceneDetailPage'
import InstallationPage from './pages/settings/InstallationPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route path="worlds" element={<HomePage />} />
          <Route path="worlds/create" element={<CreateWorldPage />} />
          <Route path="worlds/:id" element={<WorldDetailPage />} />
          <Route path="worlds/:id/characters/create" element={<CreateCharacterPage />} />
          <Route path="worlds/:worldId/characters/:characterId" element={<CharacterDetailPage />} />
          <Route path="worlds/:id/scenes/create" element={<CreateScenePage />} />
          <Route path="worlds/:worldId/scenes/:sceneId" element={<SceneDetailPage />} />
          <Route path="settings/installation" element={<InstallationPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
