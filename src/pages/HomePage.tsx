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
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  UserPlus,
  Users,
  Check,
  X,
  Loader2,
  Bell,
  LogOut
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface Friend {
  odid: string
  odfriendId: string
  odfriendName: string
}

interface FriendRequest {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  status: string
}

export default function HomePage() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)

  // Load friends
  useEffect(() => {
    if (!user) return

    const friendsQuery = query(
      collection(db, 'friends'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
      const friendsList: Friend[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        friendsList.push({
          odid: doc.id,
          odfriendId: data.friendId,
          odfriendName: data.friendName
        })
      })
      setFriends(friendsList)
    })

    return () => unsubscribe()
  }, [user])

  // Load pending friend requests
  useEffect(() => {
    if (!user) return

    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    )

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests: FriendRequest[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        requests.push({
          id: doc.id,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          toUserId: data.toUserId,
          status: data.status
        })
      })
      setPendingRequests(requests)
    })

    return () => unsubscribe()
  }, [user])

  // Load sent requests
  useEffect(() => {
    if (!user) return

    const sentQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'pending')
    )

    const unsubscribe = onSnapshot(sentQuery, (snapshot) => {
      const sent: string[] = []
      snapshot.forEach((doc) => {
        sent.push(doc.data().toUserId)
      })
      setSentRequests(sent)
    })

    return () => unsubscribe()
  }, [user])

  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return

    setSearching(true)
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('displayNameLower', '>=', searchQuery.toLowerCase().trim()),
        where('displayNameLower', '<=', searchQuery.toLowerCase().trim() + '\uf8ff')
      )

      const snapshot = await getDocs(usersQuery)
      const results: { id: string; displayName: string }[] = []

      snapshot.forEach((doc) => {
        if (doc.id !== user?.uid) {
          results.push({
            id: doc.id,
            displayName: doc.data().displayName
          })
        }
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    }
    setSearching(false)
  }

  const sendFriendRequest = async (toUserId: string, toUserName: string) => {
    if (!user || !userData) return

    setSendingRequest(toUserId)
    try {
      // Check if already friends
      const friendCheck = query(
        collection(db, 'friends'),
        where('userId', '==', user.uid),
        where('friendId', '==', toUserId)
      )
      const friendSnapshot = await getDocs(friendCheck)
      if (!friendSnapshot.empty) {
        setSendingRequest(null)
        return
      }

      // Check if request already sent
      const requestCheck = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      )
      const requestSnapshot = await getDocs(requestCheck)
      if (!requestSnapshot.empty) {
        setSendingRequest(null)
        return
      }

      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        fromUserName: userData.displayName,
        toUserId: toUserId,
        toUserName: toUserName,
        status: 'pending',
        createdAt: new Date()
      })

      setSentRequests([...sentRequests, toUserId])
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
    setSendingRequest(null)
  }

  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user || !userData) return

    try {
      // Add friend for both users
      await addDoc(collection(db, 'friends'), {
        userId: user.uid,
        userName: userData.displayName,
        friendId: request.fromUserId,
        friendName: request.fromUserName,
        addedAt: new Date()
      })

      await addDoc(collection(db, 'friends'), {
        userId: request.fromUserId,
        userName: request.fromUserName,
        friendId: user.uid,
        friendName: userData.displayName,
        addedAt: new Date()
      })

      // Delete the request
      await deleteDoc(doc(db, 'friendRequests', request.id))
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const rejectFriendRequest = async (request: FriendRequest) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', request.id))
    } catch (error) {
      console.error('Error rejecting friend request:', error)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.reload()
  }

  const isAlreadyFriend = (userId: string) => {
    return friends.some((f) => f.odfriendId === userId)
  }

  const hasSentRequest = (userId: string) => {
    return sentRequests.includes(userId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-b-3 border-foreground p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CUE SCORE</h1>
            <p className="text-sm font-medium">@{userData?.displayName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="bg-accent">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Richieste di amicizia ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between bg-white border-3 border-foreground p-3"
                >
                  <span className="font-semibold">{request.fromUserName}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => acceptFriendRequest(request)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectFriendRequest(request)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add Friend */}
        <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="secondary">
              <UserPlus className="mr-2 h-5 w-5" />
              Aggiungi Amico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cerca Amico</DialogTitle>
              <DialogDescription>
                Cerca un utente tramite il suo ID per inviare una richiesta di amicizia
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Cerca ID utente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between border-3 border-foreground p-3 bg-white"
                    >
                      <span className="font-semibold">{result.displayName}</span>
                      {isAlreadyFriend(result.id) ? (
                        <span className="text-sm text-success font-medium">Amico</span>
                      ) : hasSentRequest(result.id) ? (
                        <span className="text-sm text-gray-500">Richiesta inviata</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => sendFriendRequest(result.id, result.displayName)}
                          disabled={sendingRequest === result.id}
                        >
                          {sendingRequest === result.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-center text-gray-500 py-4">
                  Nessun utente trovato
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Friends List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              I tuoi Amici ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Non hai ancora amici. Cercane uno per iniziare!
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.odid}
                    onClick={() => navigate(`/friend/${friend.odfriendId}`)}
                    className="w-full flex items-center justify-between border-3 border-foreground p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary border-3 border-foreground flex items-center justify-center font-bold text-lg">
                        {friend.odfriendName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{friend.odfriendName}</span>
                    </div>
                    <span className="text-gray-400">&rarr;</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
