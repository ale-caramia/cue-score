import { Link, useLocation } from 'react-router-dom'
import { Users, UsersRound, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/contexts/I18nContext'

const navItems = [
  { labelKey: 'nav.friends', to: '/', icon: Users },
  { labelKey: 'nav.groups', to: '/groups', icon: UsersRound },
  { labelKey: 'nav.tournaments', to: '/tournaments', icon: Trophy },
]

export default function DesktopSidebar() {
  const location = useLocation()
  const { t } = useI18n()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r-3 border-foreground bg-card z-40">
      {/* Logo */}
      <div className="p-6 border-b-3 border-foreground bg-primary">
        <h1 className="text-2xl font-bold text-foreground">CUE SCORE</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 border-3 border-foreground font-semibold transition-all',
                isActive
                  ? 'bg-secondary text-foreground shadow-brutal-sm'
                  : 'bg-white text-foreground hover:bg-gray-50 hover:translate-x-1'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-3 border-foreground">
        <p className="text-xs text-muted-foreground text-center">
          {t('nav.desktopHint')}
        </p>
      </div>
    </aside>
  )
}
