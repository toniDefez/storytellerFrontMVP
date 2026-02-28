// src/layouts/MainLayout.tsx
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function MainLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Sidebar */}
      <aside className={`z-20 w-64 bg-gradient-to-b from-gray-900 to-gray-700 text-white p-6 shadow-2xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'} md:translate-x-0 fixed md:static h-full xl:w-80 xl:p-10`}> 
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl xl:text-3xl font-extrabold tracking-wide flex items-center gap-2">
            <span role="img" aria-label="book">📖</span> StoryTeller
          </h2>
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <Link to="/worlds" className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-purple-700 transition font-semibold text-lg xl:text-xl">
            <span className="text-2xl">🌍</span> Mundos
          </Link>
          <Link to="/settings/installation" className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-purple-700 transition font-semibold text-lg xl:text-xl">
            <span className="text-2xl">⚙️</span> Instalación
          </Link>
        </nav>
        <div className="mt-8 pt-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-2 px-4 xl:py-3 xl:text-lg rounded-lg shadow transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5 xl:h-6 xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Contenido */}
      <main className="flex-1 transition-all duration-300 p-6">
        {/* Topbar for mobile */}
        <div className="md:hidden flex items-center justify-between bg-white/80 shadow px-4 py-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-700 hover:text-purple-700">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-bold text-lg text-purple-700">StoryTeller</span>
        </div>
        {/* Cabecera común */}
        <header className="mb-6 border-b pb-2 bg-white/80 rounded-t-xl shadow px-4 pt-6 xl:px-10 xl:pt-10">
          <h1 className="text-2xl xl:text-4xl font-semibold text-purple-800 flex items-center gap-2">
            <svg className="h-7 w-7 xl:h-10 xl:w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5zm0-10V4m0 0L3 9m9-5l9 5" /></svg>
            Panel de Control
          </h1>
        </header>
        {/* Renderiza aquí las páginas */}
        <div className="mt-4 xl:mt-10 xl:px-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
