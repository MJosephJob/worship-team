import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useApp } from '../contexts/AppContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard, Package, BookOpen, Megaphone, Users,
  Bell, ChevronLeft, ChevronRight, LogOut,
  Calendar, Star, Music, Settings,
  Plus, Cake, Mic2, CalendarDays
} from 'lucide-react'

// Desktop sidebar nav — all routes
const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Home',      roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/notices',   icon: Megaphone,       label: 'Notices',   roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/prayer',    icon: BookOpen,        label: 'Prayer',    roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/assets',    icon: Package,         label: 'Assets',    roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/events',    icon: Calendar,        label: 'Events',    roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/roster',    icon: Users,           label: 'Roster',    roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/birthdays', icon: Star,            label: 'Birthdays', roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/auditions', icon: Music,           label: 'Auditions', roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
]

// Mobile bottom nav — exactly 5 tabs, Alerts is centre
const BOTTOM_NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Home' },
  { to: '/notices',       icon: Megaphone,       label: 'Notices' },
  { to: '/notifications', icon: Bell,            label: 'Alerts',  centre: true },
  { to: '/prayer',        icon: BookOpen,        label: 'Prayer' },
  { to: '/roster',        icon: Users,           label: 'Roster' },
]

// FAB menu items — ordered bottom→top visually (Assets nearest FAB)
const FAB_ITEMS = [
  { to: '/assets',    icon: Package,      label: 'Assets',    roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/events',    icon: CalendarDays, label: 'Events',    roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/birthdays', icon: Cake,         label: 'Birthdays', roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/auditions', icon: Mic2,         label: 'Auditions', roles: ['MEMBER','ADMIN','SUPER_ADMIN'] },
  { to: '/settings',  icon: Settings,     label: 'Settings',  roles: ['ADMIN','SUPER_ADMIN'] },
]

export default function Layout() {
  const { member, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { teamName, teamLogo } = useApp()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [sideOpen, setSideOpen] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)
  const scrollRef = useRef(null)

  const role = member?.role || 'MEMBER'
  const visibleNav = navItems.filter(n => n.roles.includes(role))
  const visibleFab = FAB_ITEMS.filter(n => n.roles.includes(role))

  const initials = member?.name
    ? member.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // Restore nav on every route change
  useEffect(() => {
    setNavVisible(true)
  }, [location.pathname])

  // Scroll-hide: attached to the scrollable main content div
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const y = el.scrollTop
      const delta = y - lastScrollY.current
      if (delta > 8 && y > 40) {
        setNavVisible(false)
        setFabOpen(false)
      } else if (delta < -8) {
        setNavVisible(true)
      }
      lastScrollY.current = y
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen md:h-screen bg-midnight flex">

      {/* ── Desktop sidebar (unchanged) ──────────────────────────── */}
      <aside className={`hidden md:flex flex-col bg-surface border-r border-border transition-all duration-300 ${sideOpen ? 'w-56' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sideOpen && (
            <span className="font-heading text-gold text-sm font-bold truncate">CBC Worship</span>
          )}
          <button
            onClick={() => setSideOpen(p => !p)}
            className="text-cream-muted hover:text-gold transition-colors ml-auto"
          >
            {sideOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-body text-sm ${
                  isActive ? 'bg-gold/10 text-gold' : 'text-cream-muted hover:text-cream hover:bg-surface-raised'
                }`
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              {sideOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border flex flex-col gap-1">
          {role !== 'MEMBER' && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-body text-sm ${
                  isActive ? 'bg-gold/10 text-gold' : 'text-cream-muted hover:text-cream hover:bg-surface-raised'
                }`
              }
            >
              <Settings size={18} />
              {sideOpen && <span>Settings</span>}
            </NavLink>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cream-muted hover:text-danger hover:bg-danger/10 transition-all font-body text-sm w-full"
          >
            <LogOut size={18} />
            {sideOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main column ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img
              src={teamLogo || '/icons/CBC_logo.png'}
              alt=""
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <span className="font-heading text-gold font-bold text-lg">{teamName}</span>
          </div>

          {/* Theme toggle + avatar pill */}
          <div className="flex items-center gap-2 bg-surface-raised border border-border rounded-full px-2.5 py-1">
            <button
              onClick={toggleTheme}
              className="text-cream-muted hover:text-gold transition-colors"
              data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <div className="w-px h-4 bg-border" />
            <NavLink
              to="/profile"
              className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center overflow-hidden hover:border-gold transition-colors"
              data-tooltip="My Profile"
            >
              {(member?.photoUrl || member?.photoBase64)
                ? <img src={member.photoUrl || member.photoBase64} alt="" className="w-full h-full object-cover" />
                : <span className="font-body text-gold text-[10px] font-bold">{initials}</span>
              }
            </NavLink>
          </div>
        </header>

        {/* Scrollable page content — scroll listener attaches here */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto pb-24 md:pb-6 page-enter">
          <Outlet />
        </main>

        {/* ── Mobile bottom nav ─────────────────────────────────── */}
        <nav
          className={`md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30 bottom-nav transition-transform duration-300 ${
            navVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex justify-around items-end py-2 px-1">
            {BOTTOM_NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={`flex flex-col items-center gap-0.5 px-2${item.centre ? ' -mt-2' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative flex items-center justify-center ${
                      item.centre
                        ? `w-[46px] h-[46px] rounded-[14px] ${isActive ? 'bg-gold/10 text-gold' : 'bg-surface-raised text-cream-muted'}`
                        : `w-9 h-9 rounded-[10px] ${isActive ? 'bg-gold/10 text-gold' : 'text-cream-muted'}`
                    }`}>
                      <item.icon size={item.centre ? 24 : 18} />
                      {item.centre && unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-gold text-midnight text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className={`font-body text-[9px] ${isActive ? 'text-gold font-medium' : 'text-cream-muted'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* FAB overlay — closes menu on backdrop tap */}
        {fabOpen && (
          <div
            className="md:hidden fixed inset-0 z-[15] bg-black/40"
            onClick={() => setFabOpen(false)}
          />
        )}

        {/* ── FAB system ────────────────────────────────────────── */}
        {/* Container pinned just above nav; hides with nav on scroll */}
        <div
          className={`md:hidden fixed bottom-[88px] right-4 z-20 flex flex-col items-end gap-2 transition-all duration-300 ${
            navVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
          }`}
        >
          {/* Menu items: reversed in DOM so Assets renders last (closest to FAB) */}
          {fabOpen && [...visibleFab].reverse().map((item, displayIdx) => {
            const delay = (visibleFab.length - 1 - displayIdx) * 40
            return (
              <div
                key={item.to}
                className="flex items-center gap-2 fab-item-in"
                style={{ animationDelay: `${delay}ms` }}
              >
                <span className="bg-surface border border-border text-cream font-body text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                  {item.label}
                </span>
                <button
                  onClick={() => { navigate(item.to); setFabOpen(false) }}
                  className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-gold shadow-sm flex-shrink-0"
                >
                  <item.icon size={16} />
                </button>
              </div>
            )
          })}

          {/* FAB trigger */}
          <button
            onClick={() => setFabOpen(o => !o)}
            className="w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-lg"
          >
            <Plus
              size={22}
              color="#111"
              style={{
                transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </div>

      </div>
    </div>
  )
}
