import { Link, useLocation } from 'react-router-dom'
import { Users, UsersRound, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/contexts/I18nContext'

const navItems = [
  { labelKey: 'nav.friends', to: '/', icon: Users },
  { labelKey: 'nav.groups', to: '/groups', icon: UsersRound },
  { labelKey: 'nav.tournaments', to: '/tournaments', icon: Trophy },
]

export default function MobileBottomNav() {
  const location = useLocation()
  const { t } = useI18n()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-3 border-foreground bg-background md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
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
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
