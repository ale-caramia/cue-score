import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { registerUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (displayName.trim().length < 3) {
      setError('L\'ID deve avere almeno 3 caratteri')
      return
    }

    if (displayName.trim().length > 20) {
      setError('L\'ID non può superare i 20 caratteri')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(displayName.trim())) {
      setError('L\'ID può contenere solo lettere, numeri e underscore')
      return
    }

    setLoading(true)
    setError('')

    const result = await registerUser(displayName)

    if (!result.success) {
      setError(result.error || 'Errore durante la registrazione')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-primary border-3 border-foreground shadow-brutal flex items-center justify-center">
            <span className="text-4xl font-bold">8</span>
          </div>
          <CardTitle className="text-3xl font-bold">CUE SCORE</CardTitle>
          <CardDescription className="text-base">
            Traccia i punteggi delle tue partite con gli amici
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="displayName" className="font-semibold">
                Scegli il tuo ID utente
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="es. mario_rossi"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                autoComplete="off"
                autoCapitalize="off"
              />
              <p className="text-sm text-gray-600">
                Questo ID sarà visibile ai tuoi amici e servirà per trovarti
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border-3 border-destructive text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !displayName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrazione...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Inizia
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
