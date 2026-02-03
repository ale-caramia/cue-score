import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '@/contexts/I18nContext'
import { RefreshCw, X, Sparkles } from 'lucide-react'

export default function PWAUpdatePrompt() {
  const { t } = useI18n()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
      // Check for updates periodically (every hour)
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
      console.log('SW registered:', swUrl)
    },
    onRegisterError(error: Error) {
      console.error('SW registration error:', error)
    },
  })

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-foreground/50">
      <div className="w-full max-w-sm bg-card border-3 border-foreground shadow-brutal-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-3 border-foreground bg-accent">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-bold text-lg">{t('pwa.updateTitle')}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-foreground/10 rounded transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('pwa.updateDescription')}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 px-4 border-3 border-foreground bg-white font-semibold hover:bg-gray-50 transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-brutal-sm"
            >
              {t('pwa.updateLater')}
            </button>
            <button
              onClick={handleUpdate}
              className="flex-1 py-3 px-4 border-3 border-foreground bg-primary font-semibold shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t('pwa.updateNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
