// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">StoryTeller</h2>
        <nav className="space-y-2">
          <a href="/worlds" className="block hover:underline">Mundos</a>
          <a href="/characters" className="block hover:underline">Personajes</a>
          <a href="/scenes" className="block hover:underline">Escenas</a>
        </nav>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6">
        {/* Cabecera común */}
        <header className="mb-6 border-b pb-2">
          <h1 className="text-2xl font-semibold">Panel de Control</h1>
        </header>

        {/* Renderiza aquí las páginas */}
        <Outlet />
      </main>
    </div>
  )
}
