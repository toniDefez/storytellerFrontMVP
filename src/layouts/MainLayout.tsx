import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Globe, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen, GitBranch, Users, Clapperboard } from 'lucide-react'

const NAV_ITEM_DEFS = [
  { to: '/worlds', labelKey: 'nav.worlds', Icon: Globe },
  { to: '/settings', labelKey: 'nav.settings', Icon: Settings },
]

function NavItem({ to, labelKey, Icon, collapsed }: { to: string; labelKey: string; Icon: React.FC<{ className?: string }>; collapsed: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      aria-label={collapsed ? t(labelKey) : undefined}
      title={collapsed ? t(labelKey) : undefined}
      className={`flex items-center gap-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
        collapsed ? 'justify-center px-2' : 'px-4'
      } ${
        isActive
          ? 'border-l-2 border-entity-world-muted bg-entity-world/[0.12] text-[#e8d5c8]'
          : 'text-[#8a7a9e] hover:text-[#c9b8ae] hover:bg-white/[0.04] border border-transparent'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-entity-world-muted' : ''}`} />
      {!collapsed && t(labelKey)}
    </Link>
  )
}

function WorldSubNav({ worldId, collapsed }: { worldId: string; collapsed: boolean }) {
  const location = useLocation()

  const items = [
    { label: 'Grafos', to: `/worlds/${worldId}`, Icon: GitBranch, exact: true },
    { label: 'Personajes', to: `/worlds/${worldId}/characters`, Icon: Users, exact: false },
    { label: 'Escenas', to: `/worlds/${worldId}/scenes`, Icon: Clapperboard, exact: false },
  ]

  return (
    <div className={`${collapsed ? 'px-1' : 'px-3'} space-y-0.5`}>
      {!collapsed && (
        <Link
          to="/worlds"
          className="flex items-center gap-1.5 text-[10px] text-[#5a4a72] hover:text-[#8a7a9e] transition-colors px-4 py-1 mb-1"
        >
          ← Mundos
        </Link>
      )}
      {items.map(({ label, to, Icon, exact }) => {
        const isActive = exact
          ? location.pathname === to
          : location.pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={`flex items-center gap-2.5 py-2 rounded-sm text-xs font-medium transition-all duration-150 ${
              collapsed ? 'justify-center px-2' : 'pl-6 pr-4'
            } ${
              isActive
                ? 'bg-entity-world/[0.12] text-[#e8d5c8]'
                : 'text-[#6a5a82] hover:text-[#c9b8ae] hover:bg-white/[0.04]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && label}
          </Link>
        )
      })}
    </div>
  )
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const location = useLocation()
  const { t } = useTranslation()

  // Detect if we're inside a world detail context
  const worldMatch = location.pathname.match(/^\/worlds\/(\d+)/)
  const worldId = worldMatch ? worldMatch[1] : null

  if (worldId) {
    return (
      <nav aria-label={t('a11y.sidebarNav')} className="flex-1 py-2 space-y-0">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-[#5a4a72] uppercase tracking-widest px-7 mb-2">Este mundo</p>
        )}
        <WorldSubNav worldId={worldId} collapsed={collapsed} />
        <div className="mx-3 my-3 border-t border-[#1c1926]/60" />
        <NavItem to="/settings" labelKey="nav.settings" Icon={Settings} collapsed={collapsed} />
      </nav>
    )
  }

  return (
    <nav aria-label={t('a11y.sidebarNav')} className="flex-1 px-3 space-y-1">
      {!collapsed && (
        <p className="text-[10px] font-semibold text-[#5a4a72] uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>
      )}
      {NAV_ITEM_DEFS.map(item => (
        <NavItem key={item.to} {...item} collapsed={collapsed} />
      ))}
    </nav>
  )
}

function Sidebar({ onLogout, collapsed, onToggle }: {
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()

  return (
    <aside aria-label={t('a11y.sidebar')} className="flex flex-col h-full bg-[#100d16] border-r border-[#1c1926]/60">
      {/* Logo */}
      <div className="px-3 pt-7 pb-6 overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="font-display italic text-[#e8d5c8] text-base font-normal tracking-tight">
            {collapsed ? 'ST' : 'StoryTeller'}
          </span>
        </div>
      </div>

      {/* Nav — contextual */}
      <SidebarNav collapsed={collapsed} />

      {/* Toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={onToggle}
          className="hidden md:flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150"
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4 shrink-0" />
            : <PanelLeftClose className="w-4 h-4 shrink-0" />
          }
          {!collapsed && <span>{t('nav.collapseSidebar')}</span>}
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-[#1c1926]/60 pt-4">
        <button
          onClick={onLogout}
          aria-label={t('nav.logout')}
          title={t('nav.logout')}
          className={`flex items-center gap-2.5 w-full py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150 ${collapsed ? 'justify-center px-2' : 'px-4'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && t('nav.logout')}
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
  const prefersReducedMotion = useReducedMotion()
  const sidebarSpring = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 30 }

  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  )

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar_collapsed', String(next))
  }

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
      <motion.div
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-20 overflow-hidden"
        animate={{ width: collapsed ? 48 : 240 }}
        transition={sidebarSpring}
      >
        <Sidebar onLogout={handleLogout} collapsed={collapsed} onToggle={handleToggle} />
      </motion.div>

      {/* Sidebar mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SheetTitle className="sr-only">{t('a11y.sidebarNav')}</SheetTitle>
          <Sidebar onLogout={handleLogout} collapsed={false} onToggle={() => {}} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <motion.main
        id="main-content"
        aria-label={t('a11y.mainContent')}
        className="flex-1 min-h-screen vellum-texture"
        animate={{ marginLeft: collapsed ? 48 : 240 }}
        transition={sidebarSpring}
        onAnimationComplete={() => window.dispatchEvent(new Event('resize'))}
      >
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
          className="p-6 md:p-8 max-w-6xl ml-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </motion.main>
    </div>
  )
}
