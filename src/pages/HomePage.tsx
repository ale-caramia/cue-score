import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
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
  onSnapshot,
  getDoc,
  writeBatch
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
import MobileBottomNav from '@/components/MobileBottomNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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

interface SearchResult {
  id: string
  displayName: string
  email?: string
}

export default function HomePage() {
  const { user, userData, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  )

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
      const searchLower = searchQuery.toLowerCase().trim()
      const resultsMap = new Map<string, SearchResult>()

      // Search by username
      const usernameQuery = query(
        collection(db, 'users'),
        where('displayNameLower', '>=', searchLower),
        where('displayNameLower', '<=', searchLower + '\uf8ff')
      )
      const usernameSnapshot = await getDocs(usernameQuery)
      usernameSnapshot.forEach((doc) => {
        if (doc.id !== user?.uid) {
          const data = doc.data()
          resultsMap.set(doc.id, {
            id: doc.id,
            displayName: data.displayName,
            email: data.email
          })
        }
      })

      // Search by email
      const emailQuery = query(
        collection(db, 'users'),
        where('emailLower', '>=', searchLower),
        where('emailLower', '<=', searchLower + '\uf8ff')
      )
      const emailSnapshot = await getDocs(emailQuery)
      emailSnapshot.forEach((doc) => {
        if (doc.id !== user?.uid && !resultsMap.has(doc.id)) {
          const data = doc.data()
          resultsMap.set(doc.id, {
            id: doc.id,
            displayName: data.displayName,
            email: data.email
          })
        }
      })

      setSearchResults(Array.from(resultsMap.values()))
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
    console.log('acceptFriendRequest called', { request, user: user?.uid, userData })
    if (!user || !userData) {
      console.error('No user or userData')
      alert(t('home.noUserDataError'))
      return
    }
    if (processingRequestId) {
      console.log('Already processing:', processingRequestId)
      return
    }

    setProcessingRequestId(request.id)
    try {
      console.log('Step 1: Getting request document')
      const requestRef = doc(db, 'friendRequests', request.id)
      const requestSnapshot = await getDoc(requestRef)
      if (!requestSnapshot.exists()) {
        console.error('Request does not exist')
        alert(t('home.requestMissingError'))
        return
      }
      const requestData = requestSnapshot.data()
      console.log('Request data:', requestData)
      if (requestData.status !== 'pending') {
        console.error('Request is not pending:', requestData.status)
        alert(t('home.requestNotPendingError'))
        return
      }

      console.log('Step 2: Checking existing friendships')
      const friendCheckCurrent = query(
        collection(db, 'friends'),
        where('userId', '==', user.uid),
        where('friendId', '==', request.fromUserId)
      )
      const friendCheckSender = query(
        collection(db, 'friends'),
        where('userId', '==', request.fromUserId),
        where('friendId', '==', user.uid)
      )

      console.log('Executing queries...')
      const [currentSnapshot, senderSnapshot] = await Promise.all([
        getDocs(friendCheckCurrent),
        getDocs(friendCheckSender)
      ])
      console.log('Query results:', {
        currentEmpty: currentSnapshot.empty,
        senderEmpty: senderSnapshot.empty
      })

      console.log('Step 3: Creating batch')
      const batch = writeBatch(db)
      if (currentSnapshot.empty) {
        console.log('Adding friend entry for current user')
        batch.set(doc(collection(db, 'friends')), {
          userId: user.uid,
          userName: userData.displayName,
          friendId: request.fromUserId,
          friendName: request.fromUserName,
          addedAt: new Date()
        })
      }
      if (senderSnapshot.empty) {
        console.log('Adding friend entry for sender')
        batch.set(doc(collection(db, 'friends')), {
          userId: request.fromUserId,
          userName: request.fromUserName,
          friendId: user.uid,
          friendName: userData.displayName,
          addedAt: new Date()
        })
      }

      console.log('Step 4: Deleting request and committing batch')
      batch.delete(requestRef)
      await batch.commit()
      console.log('SUCCESS: Friend request accepted!')
      alert(t('home.acceptSuccess'))
    } catch (error) {
      console.error('Error accepting friend request:', error)
      alert(
        t('home.acceptError', {
          message: error instanceof Error ? error.message : String(error)
        })
      )
    } finally {
      setProcessingRequestId(null)
    }
  }

  const rejectFriendRequest = async (request: FriendRequest) => {
    console.log('rejectFriendRequest called', { request })
    if (processingRequestId) {
      console.log('Already processing:', processingRequestId)
      return
    }

    setProcessingRequestId(request.id)
    try {
      console.log('Deleting friend request')
      await deleteDoc(doc(db, 'friendRequests', request.id))
      console.log('SUCCESS: Friend request rejected!')
      alert(t('home.rejectSuccess'))
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      alert(
        t('home.rejectError', {
          message: error instanceof Error ? error.message : String(error)
        })
      )
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleLogout = async () => {
    await signOut()
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
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t('common.signOut')}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 pb-24 md:pb-4 space-y-4">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="bg-accent">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('home.friendRequests', { count: pendingRequests.length })}
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
                      disabled={processingRequestId === request.id}
                    >
                      {processingRequestId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectFriendRequest(request)}
                      disabled={processingRequestId === request.id}
                    >
                      {processingRequestId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="secondary">
                <UserPlus className="mr-2 h-5 w-5" />
                {t('home.addFriend')}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('home.searchFriendTitle')}</DialogTitle>
              <DialogDescription>
                {t('home.searchFriendDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t('home.searchPlaceholder')}
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
                      <div>
                        <span className="font-semibold block">{result.displayName}</span>
                        {result.email && (
                          <span className="text-xs text-gray-500">{result.email}</span>
                        )}
                      </div>
                      {isAlreadyFriend(result.id) ? (
                        <span className="text-sm text-success font-medium">
                          {t('home.friendLabel')}
                        </span>
                      ) : hasSentRequest(result.id) ? (
                        <span className="text-sm text-gray-500">
                          {t('home.requestSent')}
                        </span>
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
                  {t('home.noUsersFound')}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>

        {/* Friends List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('home.friendsTitle', { count: friends.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {t('home.noFriends')}
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
      <MobileBottomNav />
    </div>
  )
}
