import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/login/LoginPage'
import MainLayout from './layouts/MainLayout'
import RegisterPage from './pages/register/RegisterPage'
import HomePage from './pages/home/HomePage'
import CreateWorldPage from './pages/home/CreateWorldPage'
import EditWorldPage from './pages/home/EditWorldPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import WorldDetailPage from './pages/home/WorldDetailPage'
import WorldBiblePage from './pages/home/WorldBiblePage'
import CreateCharacterPage from './pages/characters/CreateCharacterPage.sanderson'
import EditCharacterPage from './pages/characters/EditCharacterPage'
import CharacterDetailPage from './pages/characters/CharacterDetailPage'
import CreateScenePage from './pages/scenes/CreateScenePage'
import EditScenePage from './pages/scenes/EditScenePage'
import SceneDetailPage from './pages/scenes/SceneDetailPage'
import SettingsPage from './pages/settings/SettingsPage'

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
          <Route path="worlds/:id/bible" element={<WorldBiblePage />} />
          <Route path="worlds/:id/edit" element={<EditWorldPage />} />
          <Route path="worlds/:id/characters/create" element={<CreateCharacterPage />} />
          <Route path="worlds/:worldId/characters/:characterId" element={<CharacterDetailPage />} />
          <Route path="worlds/:worldId/characters/:characterId/edit" element={<EditCharacterPage />} />
          <Route path="worlds/:id/scenes/create" element={<CreateScenePage />} />
          <Route path="worlds/:worldId/scenes/:sceneId" element={<SceneDetailPage />} />
          <Route path="worlds/:worldId/scenes/:sceneId/edit" element={<EditScenePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/installation" element={<Navigate to="/settings?tab=installation" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
