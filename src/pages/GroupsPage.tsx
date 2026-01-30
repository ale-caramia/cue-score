import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  Timestamp,
  orderBy,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, ArrowLeft, Info } from 'lucide-react'
import type { Group } from '@/lib/types'

export default function GroupsPage() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMembers, setGroupMembers] = useState<Map<string, number>>(new Map())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  // Load user's groups
  useEffect(() => {
    if (!user) return

    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('userId', '==', user.uid),
      orderBy('joinedAt', 'desc')
    )

    const unsubscribe = onSnapshot(membersQuery, async (snapshot) => {
      const groupIds: string[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        groupIds.push(data.groupId)
      })

      if (groupIds.length === 0) {
        setGroups([])
        return
      }

      // Fetch group details for each groupId
      const groupPromises = groupIds.map(async (groupId) => {
        const groupDoc = await getDocs(
          query(collection(db, 'groups'), where('__name__', '==', groupId))
        )
        if (!groupDoc.empty) {
          const doc = groupDoc.docs[0]
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toDate(),
            memberIds: data.memberIds || [],
          } as Group
        }
        return null
      })

      const groupsList = (await Promise.all(groupPromises)).filter(
        (g): g is Group => g !== null
      )
      setGroups(groupsList)

      // Load member counts
      const memberCounts = new Map<string, number>()
      for (const group of groupsList) {
        memberCounts.set(group.id, group.memberIds.length)
      }
      setGroupMembers(memberCounts)
    })

    return () => unsubscribe()
  }, [user])

  const handleCreateGroup = async () => {
    if (!user || !userData || !groupName.trim()) return

    setCreating(true)
    try {
      // Create the group
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        memberIds: [user.uid],
      })

      // Add creator as first member
      await addDoc(collection(db, 'groupMembers'), {
        groupId: groupRef.id,
        userId: user.uid,
        userName: userData.displayName,
        joinedAt: Timestamp.now(),
      })

      setGroupName('')
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Errore nella creazione del gruppo. Riprova.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Gruppi</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInfoDialogOpen(true)}
            className="h-10 w-10"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>

        {/* Create Group Button */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Crea Gruppo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea un Nuovo Gruppo</DialogTitle>
              <DialogDescription>
                Scegli un nome per il tuo gruppo. Potrai aggiungere membri in seguito.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Nome del gruppo..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && groupName.trim()) {
                    handleCreateGroup()
                  }
                }}
                maxLength={50}
              />
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || creating}
                className="w-full"
              >
                {creating ? 'Creazione...' : 'Crea Gruppo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Groups List */}
        {groups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Non fai ancora parte di nessun gruppo.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Crea un gruppo per iniziare a giocare con i tuoi amici!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-brutal-lg transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>{group.name}</span>
                    </div>
                    <span className="text-sm font-normal text-muted-foreground">
                      {groupMembers.get(group.id) || 0} membri
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Info Dialog */}
        <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Come Funzionano i Gruppi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Partite a Squadre</h4>
                <p className="text-muted-foreground">
                  Nei gruppi puoi registrare partite con squadre da 1 a N-1 giocatori.
                  Scegli i membri di ogni squadra e registra il vincitore.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Sistema Punti</h4>
                <p className="text-muted-foreground">
                  I punti guadagnati equivalgono al numero di avversari sconfitti.
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                  <li>3v3 vinta: ogni vincitore guadagna 3 punti</li>
                  <li>4v2 vinta dai 4: ogni vincitore guadagna 2 punti</li>
                  <li>4v2 vinta dai 2: ogni vincitore guadagna 4 punti</li>
                  <li>1v1 vinta: il vincitore guadagna 1 punto</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Classifiche</h4>
                <p className="text-muted-foreground">
                  Ogni gruppo ha classifiche per giorno, settimana, mese e anno.
                  L'app ricorda la tua vista preferita per ogni gruppo.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
