import MobileBottomNav from '@/components/MobileBottomNav'
import { useI18n } from '@/contexts/I18nContext'

export default function TournamentsPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-4 md:pb-4">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">{t('tournaments.title')}</h1>
        <div className="rounded-lg border-3 border-foreground bg-card p-6 text-center text-muted-foreground">
          {t('tournaments.placeholder')}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
