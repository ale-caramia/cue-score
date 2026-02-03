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
  getDoc,
  doc,
  addDoc,
  onSnapshot,
  Timestamp,
  orderBy,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, ArrowLeft, Info, Loader2 } from 'lucide-react'
import type { Group } from '@/lib/types'
import MobileBottomNav from '@/components/MobileBottomNav'
import DesktopSidebar from '@/components/DesktopSidebar'

export default function GroupsPage() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMembers, setGroupMembers] = useState<Map<string, number>>(new Map())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load user's groups
  useEffect(() => {
    if (!user) return

    setLoading(true)
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
        setGroupMembers(new Map())
        setLoading(false)
        return
      }

      // Fetch group details for each groupId
      const groupPromises = groupIds.map(async (groupId) => {
        const groupDocRef = doc(db, 'groups', groupId)
        const groupDocSnap = await getDoc(groupDocRef)

        if (groupDocSnap.exists()) {
          const data = groupDocSnap.data()
          return {
            id: groupDocSnap.id,
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
      const unregisteredCounts = await Promise.all(
        groupsList.map(async (group) => {
          const unregisteredSnapshot = await getDocs(
            query(
              collection(db, 'unregisteredGroupUsers'),
              where('groupId', '==', group.id)
            )
          )
          return unregisteredSnapshot.size
        })
      )

      groupsList.forEach((group, index) => {
        const guestCount = unregisteredCounts[index] ?? 0
        memberCounts.set(group.id, group.memberIds.length + guestCount)
      })
      setGroupMembers(memberCounts)
      setLoading(false)
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
      alert(t('groups.createError'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 md:pb-4 md:pl-64">
      <DesktopSidebar />
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
          <h1 className="text-2xl font-bold">{t('groups.title')}</h1>
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
              {t('groups.createGroup')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('groups.createGroupTitle')}</DialogTitle>
              <DialogDescription>
                {t('groups.createGroupDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder={t('groups.groupNamePlaceholder')}
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
                {creating ? t('groups.creating') : t('groups.createGroup')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Groups List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t('groups.noGroupsTitle')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('groups.noGroupsDescription')}
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
                      {t('common.members', {
                        count: groupMembers.get(group.id) || 0,
                      })}
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
              <DialogTitle>{t('groups.infoTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">{t('groups.infoTeamsTitle')}</h4>
                <p className="text-muted-foreground">
                  {t('groups.infoTeamsDescription')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('groups.infoPointsTitle')}</h4>
                <p className="text-muted-foreground">
                  {t('groups.infoPointsDescription')}
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                  <li>{t('groups.infoPointsExample1')}</li>
                  <li>{t('groups.infoPointsExample2')}</li>
                  <li>{t('groups.infoPointsExample3')}</li>
                  <li>{t('groups.infoPointsExample4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('groups.infoRankingsTitle')}</h4>
                <p className="text-muted-foreground">
                  {t('groups.infoRankingsDescription')}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <MobileBottomNav />
    </div>
  )
}
