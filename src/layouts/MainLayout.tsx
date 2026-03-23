import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Globe, Settings, LogOut, Menu } from 'lucide-react'

const NAV_ITEM_DEFS = [
  { to: '/worlds', labelKey: 'nav.worlds', Icon: Globe },
  { to: '/settings', labelKey: 'nav.settings', Icon: Settings },
]

function NavItem({ to, labelKey, Icon }: { to: string; labelKey: string; Icon: React.FC<{ className?: string }> }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'border-l-2 border-entity-world-muted bg-entity-world/[0.12] text-[#e8d5c8]'
          : 'text-[#8a7a9e] hover:text-[#c9b8ae] hover:bg-white/[0.04] border border-transparent'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-entity-world-muted' : ''}`} />
      {t(labelKey)}
    </Link>
  )
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation()

  return (
    <aside aria-label={t('a11y.sidebar')} className="flex flex-col h-full bg-[#100d16] border-r border-[#1c1926]/60 w-60">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="font-display italic text-[#e8d5c8] text-base font-normal tracking-tight">
            StoryTeller
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label={t('a11y.sidebarNav')} className="flex-1 px-3 space-y-1">
        <p className="text-[10px] font-semibold text-[#5a4a72] uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>
        {NAV_ITEM_DEFS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-[#1c1926]/60 pt-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}

export default function MainLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-violet-700 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg"
      >
        {t('a11y.skipToContent')}
      </a>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 z-20">
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Sidebar mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SheetTitle className="sr-only">{t('a11y.sidebarNav')}</SheetTitle>
          <Sidebar onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main id="main-content" aria-label={t('a11y.mainContent')} className="flex-1 md:ml-60 min-h-screen vellum-texture">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-4 bg-[#100d16] border-b border-[#1c1926] px-4 py-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition"
            aria-label={t('a11y.openNavMenu')}
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
