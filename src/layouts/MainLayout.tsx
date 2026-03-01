import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/worlds', label: 'Mundos', Icon: GlobeIcon },
  { to: '/settings/installation', label: 'Instalación', Icon: CogIcon },
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
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
      {label}
    </Link>
  )
}

export default function MainLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-slate-950 border-r border-slate-800/60 w-60">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">StoryTeller</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-4 mb-3">Navegación</p>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-slate-800/60 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all duration-150"
        >
          <LogoutIcon className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 z-20">
        <Sidebar />
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-60 z-40 md:hidden flex flex-col">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-60 min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-4 bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition">
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm text-white tracking-tight">StoryTeller</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white">
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="p-6 md:p-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
