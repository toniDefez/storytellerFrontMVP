import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Globe, Settings, LogOut, Menu } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/worlds', label: 'Mundos', Icon: Globe },
  { to: '/settings', label: 'Configuración', Icon: Settings },
]

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: React.FC<{ className?: string }> }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
      {label}
    </Link>
  )
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside aria-label="Barra lateral" className="flex flex-col h-full bg-slate-950 border-r border-slate-800/60 w-60">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight font-[var(--font-display)]">StoryTeller</span>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navegacion principal" className="flex-1 px-3 space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-4 mb-3">Navegacion</p>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-slate-800/60 pt-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-violet-700 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 z-20">
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Sidebar mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SheetTitle className="sr-only">Navegacion</SheetTitle>
          <Sidebar onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main id="main-content" aria-label="Contenido principal" className="flex-1 md:ml-60 min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-4 bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition"
            aria-label="Abrir menu de navegacion"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm text-white tracking-tight">StoryTeller</span>
        </div>

        {/* Page content */}
        <motion.div
          key={location.pathname}
          className="p-6 md:p-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
