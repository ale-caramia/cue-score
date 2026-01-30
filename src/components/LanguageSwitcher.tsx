import { useI18n } from '@/contexts/I18nContext'
import { cn } from '@/lib/utils'

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n()

  return (
    <label className={cn('flex items-center gap-2 text-sm font-medium', className)}>
      <span className="sr-only">{t('common.language')}</span>
      <select
        className="h-9 rounded-md border-2 border-foreground bg-background px-2 text-sm font-semibold shadow-brutal-sm"
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'it')}
        aria-label={t('common.language')}
      >
        <option value="en">EN</option>
        <option value="it">IT</option>
      </select>
    </label>
  )
}
