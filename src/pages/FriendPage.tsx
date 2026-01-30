import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  getDoc
} from 'firebase/firestore'
import {
  ArrowLeft,
  Trophy,
  Plus,
  Calendar,
  Trash2,
  Loader2
} from 'lucide-react'
import { formatDate, getStartOfDay, getStartOfWeek, getStartOfMonth, getStartOfYear } from '@/lib/utils'

interface Match {
  id: string
  player1Id: string
  player1Name: string
  player2Id: string
  player2Name: string
  winnerId: string
  winnerName: string
  date: Date
  createdAt: Date
}

interface Stats {
  wins: number
  losses: number
  total: number
}

export default function FriendPage() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const { user, userData } = useAuth()
  const [friendName, setFriendName] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [addMatchOpen, setAddMatchOpen] = useState(false)
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0])
  const [winner, setWinner] = useState<'me' | 'friend' | ''>('')
  const [saving, setSaving] = useState(false)
  const [_deleteMatchId, setDeleteMatchId] = useState<string | null>(null)

  // Load friend name
  useEffect(() => {
    if (!friendId) return

    const loadFriend = async () => {
      const friendDoc = await getDoc(doc(db, 'users', friendId))
      if (friendDoc.exists()) {
        setFriendName(friendDoc.data().displayName)
      }
    }

    loadFriend()
  }, [friendId])

  // Load matches
  useEffect(() => {
    if (!user || !friendId) return

    const matchesQuery = query(
      collection(db, 'matches'),
      where('players', 'array-contains', user.uid),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const matchesList: Match[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        // Filter only matches with this friend
        if (
          (data.player1Id === user.uid && data.player2Id === friendId) ||
          (data.player2Id === user.uid && data.player1Id === friendId)
        ) {
          matchesList.push({
            id: doc.id,
            player1Id: data.player1Id,
            player1Name: data.player1Name,
            player2Id: data.player2Id,
            player2Name: data.player2Name,
            winnerId: data.winnerId,
            winnerName: data.winnerName,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate()
          })
        }
      })
      setMatches(matchesList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, friendId])

  const calculateStats = (periodStart: Date): Stats => {
    const periodMatches = matches.filter((m) => m.date >= periodStart)
    const wins = periodMatches.filter((m) => m.winnerId === user?.uid).length
    const losses = periodMatches.filter((m) => m.winnerId === friendId).length

    return { wins, losses, total: wins + losses }
  }

  const dailyStats = calculateStats(getStartOfDay(new Date()))
  const weeklyStats = calculateStats(getStartOfWeek(new Date()))
  const monthlyStats = calculateStats(getStartOfMonth(new Date()))
  const yearlyStats = calculateStats(getStartOfYear(new Date()))
  const allTimeStats = calculateStats(new Date(0))

  const saveMatch = async () => {
    if (!user || !userData || !friendId || !winner) return

    setSaving(true)
    try {
      const winnerId = winner === 'me' ? user.uid : friendId
      const winnerName = winner === 'me' ? userData.displayName : friendName

      await addDoc(collection(db, 'matches'), {
        player1Id: user.uid,
        player1Name: userData.displayName,
        player2Id: friendId,
        player2Name: friendName,
        players: [user.uid, friendId],
        winnerId,
        winnerName,
        date: new Date(matchDate),
        createdAt: new Date(),
        createdBy: user.uid
      })

      setAddMatchOpen(false)
      setWinner('')
      setMatchDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error('Error saving match:', error)
    }
    setSaving(false)
  }

  const deleteMatch = async (matchId: string) => {
    try {
      await deleteDoc(doc(db, 'matches', matchId))
      setDeleteMatchId(null)
    } catch (error) {
      console.error('Error deleting match:', error)
    }
  }

  const StatsCard = ({ title, stats }: { title: string; stats: Stats }) => (
    <div className="bg-white border-3 border-foreground p-4">
      <h3 className="font-bold text-sm text-gray-600 mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-success">{stats.wins}</p>
          <p className="text-xs text-gray-500">Vittorie</p>
        </div>
        <div className="text-3xl font-bold text-gray-300">-</div>
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
          <p className="text-xs text-gray-500">Sconfitte</p>
        </div>
      </div>
      {stats.total > 0 && (
        <p className="text-center text-xs text-gray-500 mt-2">
          {stats.total} partite totali
        </p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary border-b-3 border-foreground p-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border-3 border-foreground flex items-center justify-center font-bold text-xl">
              {friendName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{friendName}</h1>
              <p className="text-sm">vs {userData?.displayName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Add Match Button */}
        <Dialog open={addMatchOpen} onOpenChange={setAddMatchOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              Registra Partita
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuova Partita</DialogTitle>
              <DialogDescription>
                Registra il risultato di una partita con {friendName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-semibold">Data partita</label>
                <Input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold">Chi ha vinto?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWinner('me')}
                    className={`p-4 border-3 border-foreground font-semibold transition-all overflow-hidden ${
                      winner === 'me'
                        ? 'bg-success text-white shadow-brutal-sm'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Trophy className="h-6 w-6 mx-auto mb-2" />
                    <span className="block truncate">{userData?.displayName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinner('friend')}
                    className={`p-4 border-3 border-foreground font-semibold transition-all overflow-hidden ${
                      winner === 'friend'
                        ? 'bg-success text-white shadow-brutal-sm'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Trophy className="h-6 w-6 mx-auto mb-2" />
                    <span className="block truncate">{friendName}</span>
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={saveMatch}
                disabled={!winner || saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Partita'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Statistiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="daily">Oggi</TabsTrigger>
                <TabsTrigger value="weekly">Sett.</TabsTrigger>
                <TabsTrigger value="monthly">Mese</TabsTrigger>
                <TabsTrigger value="yearly">Anno</TabsTrigger>
              </TabsList>
              <TabsContent value="daily">
                <StatsCard title="Oggi" stats={dailyStats} />
              </TabsContent>
              <TabsContent value="weekly">
                <StatsCard title="Questa settimana" stats={weeklyStats} />
              </TabsContent>
              <TabsContent value="monthly">
                <StatsCard title="Questo mese" stats={monthlyStats} />
              </TabsContent>
              <TabsContent value="yearly">
                <StatsCard title="Quest'anno" stats={yearlyStats} />
              </TabsContent>
            </Tabs>

            {/* All time stats */}
            <div className="mt-4 pt-4 border-t-3 border-foreground">
              <StatsCard title="Totale (tutte le partite)" stats={allTimeStats} />
            </div>
          </CardContent>
        </Card>

        {/* Match History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronologia Partite
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nessuna partita registrata con {friendName}
              </p>
            ) : (
              <div className="space-y-2">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between border-3 border-foreground p-3 ${
                      match.winnerId === user?.uid
                        ? 'bg-success/10'
                        : 'bg-destructive/10'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">
                        {match.winnerId === user?.uid ? (
                          <span className="text-success">Vittoria</span>
                        ) : (
                          <span className="text-destructive">Sconfitta</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(match.date)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Elimina partita</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare questa partita del{' '}
                            {formatDate(match.date)}? Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMatch(match.id)}>
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
