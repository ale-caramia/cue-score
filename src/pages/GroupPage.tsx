import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from '@/components/ui/alert-dialog'
import { db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  orderBy,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
  Timestamp,
  updateDoc,
  arrayUnion,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  ArrowLeft,
  Trophy,
  Plus,
  Calendar,
  Trash2,
  UserPlus,
  Users,
  Medal,
  Info,
  MoreVertical,
  Percent,
  Hash,
  Link2,
  UserX,
} from 'lucide-react'
import {
  formatDate,
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfYear,
  calculateGroupRankings,
  calculateMatchPoints,
} from '@/lib/utils'
import type { Group, GroupMember, GroupMatch, GroupRanking, GroupSortOption, UnregisteredGroupUser } from '@/lib/types'
import DesktopSidebar from '@/components/DesktopSidebar'

type PeriodView = 'day' | 'week' | 'month' | 'year'

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [matches, setMatches] = useState<GroupMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<PeriodView>('week')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addMatchOpen, setAddMatchOpen] = useState(false)
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [sortOption, setSortOption] = useState<GroupSortOption>('points')
  const [linkUserOpen, setLinkUserOpen] = useState(false)
  const [memberToLink, setMemberToLink] = useState<GroupMember | null>(null)
  const [unregisteredUsers, setUnregisteredUsers] = useState<UnregisteredGroupUser[]>([])

  // Load group details
  useEffect(() => {
    if (!groupId) return

    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setGroup({
          id: snapshot.id,
          name: data.name,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
          memberIds: data.memberIds || [],
        })
      }
    })

    return () => unsubscribe()
  }, [groupId])

  // Load group members
  useEffect(() => {
    if (!groupId) return

    const membersQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId)
    )

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const membersList: GroupMember[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        membersList.push({
          id: doc.id,
          groupId: data.groupId,
          userId: data.userId,
          userName: data.userName,
          joinedAt: data.joinedAt.toDate(),
        })
      })
      setMembers(membersList)
    })

    return () => unsubscribe()
  }, [groupId])

  // Load group matches
  useEffect(() => {
    if (!groupId) return

    const matchesQuery = query(
      collection(db, 'groupMatches'),
      where('groupId', '==', groupId),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const matchesList: GroupMatch[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        matchesList.push({
          id: doc.id,
          groupId: data.groupId,
          teamA: data.teamA,
          teamB: data.teamB,
          teamANames: data.teamANames,
          teamBNames: data.teamBNames,
          winningTeam: data.winningTeam,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          createdBy: data.createdBy,
          pointsAwarded: data.pointsAwarded,
          allPlayerIds: data.allPlayerIds,
        })
      })
      setMatches(matchesList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [groupId])

  // Load unregistered users for this group
  useEffect(() => {
    if (!groupId) return

    const unregisteredQuery = query(
      collection(db, 'unregisteredGroupUsers'),
      where('groupId', '==', groupId)
    )

    const unsubscribe = onSnapshot(unregisteredQuery, (snapshot) => {
      const usersList: UnregisteredGroupUser[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        usersList.push({
          id: doc.id,
          name: data.name,
          groupId: data.groupId,
          createdAt: data.createdAt.toDate(),
          createdBy: data.createdBy,
          linkedToUserId: data.linkedToUserId,
          linkedAt: data.linkedAt?.toDate(),
        })
      })
      setUnregisteredUsers(usersList)
    })

    return () => unsubscribe()
  }, [groupId])

  // Load user's preferred view for this group
  useEffect(() => {
    if (!user || !groupId) return

    const loadPreference = async () => {
      const preferenceId = `${user.uid}_${groupId}`
      const preferenceDoc = await getDoc(
        doc(db, 'userGroupPreferences', preferenceId)
      )
      if (preferenceDoc.exists()) {
        setCurrentView(preferenceDoc.data().preferredView)
      }
    }

    loadPreference()
  }, [user, groupId])

  // Save user's preferred view when it changes
  const handleViewChange = async (view: PeriodView) => {
    setCurrentView(view)
    if (!user || !groupId) return

    const preferenceId = `${user.uid}_${groupId}`
    await setDoc(doc(db, 'userGroupPreferences', preferenceId), {
      userId: user.uid,
      groupId,
      preferredView: view,
      lastUpdated: Timestamp.now(),
    })
  }

  // Calculate rankings for the current period (includes both registered and unregistered users)
  const getRankings = (): GroupRanking[] => {
    const memberNames = new Map<string, string>()
    members.forEach((m) => memberNames.set(m.userId, m.userName))
    // Add unregistered users with unregistered_ prefix
    unregisteredUsers.forEach((u) => memberNames.set(`unregistered_${u.id}`, u.name))

    let startDate: Date | undefined
    switch (currentView) {
      case 'day':
        startDate = getStartOfDay(new Date())
        break
      case 'week':
        startDate = getStartOfWeek(new Date())
        break
      case 'month':
        startDate = getStartOfMonth(new Date())
        break
      case 'year':
        startDate = getStartOfYear(new Date())
        break
    }

    const memberIds = [
      ...members.map((m) => m.userId),
      ...unregisteredUsers.map((u) => `unregistered_${u.id}`),
    ]
    return calculateGroupRankings(matches, memberIds, memberNames, startDate, sortOption)
  }

  const rankings = getRankings()

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteDoc(doc(db, 'groupMatches', matchId))
      setDeleteMatchId(null)
    } catch (error) {
      console.error('Error deleting match:', error)
      alert(t('group.deleteMatchError'))
    }
  }

  const handleDeleteGroup = async () => {
    if (!user || !groupId || !group) return
    if (group.createdBy !== user.uid) {
      alert(t('group.deleteGroupUnauthorized'))
      return
    }

    setDeletingGroup(true)
    try {
      const commitBatches = async (docs: QueryDocumentSnapshot<DocumentData>[]) => {
        let batch = writeBatch(db)
        let batchCount = 0

        for (const snapshotDoc of docs) {
          batch.delete(snapshotDoc.ref)
          batchCount += 1

          if (batchCount >= 450) {
            await batch.commit()
            batch = writeBatch(db)
            batchCount = 0
          }
        }

        if (batchCount > 0) {
          await batch.commit()
        }
      }

      // Delete all group members
      const membersSnapshot = await getDocs(
        query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
      )
      await commitBatches(membersSnapshot.docs)

      // Delete all group matches
      const matchesSnapshot = await getDocs(
        query(collection(db, 'groupMatches'), where('groupId', '==', groupId))
      )
      await commitBatches(matchesSnapshot.docs)

      // Delete all user preferences for this group
      const preferencesSnapshot = await getDocs(
        query(collection(db, 'userGroupPreferences'), where('groupId', '==', groupId))
      )
      await commitBatches(preferencesSnapshot.docs)

      // Delete all unregistered users for this group
      const unregisteredSnapshot = await getDocs(
        query(collection(db, 'unregisteredGroupUsers'), where('groupId', '==', groupId))
      )
      await commitBatches(unregisteredSnapshot.docs)

      // Finally, delete the group document separately
      // This must be done AFTER deleting related docs because the rules use get()
      await deleteDoc(doc(db, 'groups', groupId))

      // Navigate back to groups list
      navigate('/groups')
    } catch (error) {
      console.error('Error deleting group:', error)
      alert(t('group.deleteGroupError'))
    } finally {
      setDeletingGroup(false)
      setDeleteGroupOpen(false)
    }
  }

  const getPeriodLabel = () => {
    switch (currentView) {
      case 'day':
        return t('friend.today')
      case 'week':
        return t('friend.thisWeek')
      case 'month':
        return t('friend.thisMonth')
      case 'year':
        return t('friend.thisYear')
    }
  }

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:pl-64">
      <DesktopSidebar />
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/groups')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {group.name}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setInfoDialogOpen(true)}
              className="h-10 w-10"
            >
              <Info className="h-5 w-5" />
            </Button>
            {user && group.createdBy === user.uid && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteGroupOpen(true)}
                className="h-10 w-10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={addMatchOpen} onOpenChange={setAddMatchOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                {t('group.addMatch')}
              </Button>
            </DialogTrigger>
            <RecordMatchDialog
              groupId={groupId!}
              members={members}
              unregisteredUsers={unregisteredUsers}
              onClose={() => setAddMatchOpen(false)}
            />
          </Dialog>

          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full" size="lg">
                <UserPlus className="mr-2 h-5 w-5" />
                {t('group.addMember')}
              </Button>
            </DialogTrigger>
            <AddMemberDialog
              groupId={groupId!}
              currentMembers={members}
              unregisteredUsers={unregisteredUsers}
              onClose={() => setAddMemberOpen(false)}
            />
          </Dialog>
        </div>

        {/* Rankings Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {t('group.rankingsTitle')} - {getPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentView} onValueChange={(v) => handleViewChange(v as PeriodView)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="day">{t('group.day')}</TabsTrigger>
                <TabsTrigger value="week">{t('group.week')}</TabsTrigger>
                <TabsTrigger value="month">{t('group.month')}</TabsTrigger>
                <TabsTrigger value="year">{t('group.year')}</TabsTrigger>
              </TabsList>

              {/* Sorting Options */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setSortOption('points')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border-3 border-foreground text-sm font-semibold transition-all ${
                    sortOption === 'points'
                      ? 'bg-primary text-foreground shadow-brutal-sm'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <Hash className="h-4 w-4" />
                  {t('group.sortByPoints')}
                </button>
                <button
                  onClick={() => setSortOption('winPercentage')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border-3 border-foreground text-sm font-semibold transition-all ${
                    sortOption === 'winPercentage'
                      ? 'bg-primary text-foreground shadow-brutal-sm'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <Percent className="h-4 w-4" />
                  {t('group.sortByWinRate')}
                </button>
              </div>

              <TabsContent value={currentView} className="mt-4">
                {rankings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t('group.noRankings')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {rankings.map((ranking, index) => (
                      <div
                        key={ranking.userId}
                        className="flex items-center justify-between p-3 rounded-lg border-2 border-foreground bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background font-bold">
                            {index === 0 && <Medal className="h-5 w-5 text-accent" />}
                            {index !== 0 && <span>{index + 1}</span>}
                          </div>
                          <div>
                            <p className="font-semibold">{ranking.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('group.matchesWon', {
                                won: ranking.matchesWon,
                                total: ranking.matchesPlayed,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {sortOption === 'points' ? (
                            <>
                              <p className="text-2xl font-bold text-primary">
                                {ranking.points}
                              </p>
                              <p className="text-xs text-muted-foreground">{t('common.points')}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-primary">
                                {ranking.winPercentage}%
                              </p>
                              <p className="text-xs text-muted-foreground">{t('group.winRate')}</p>
                            </>
                          )}
                        </div>
                        {/* Show secondary stat in smaller text */}
                        {sortOption === 'points' && ranking.matchesPlayed > 0 && (
                          <div className="text-right ml-3 min-w-[50px]">
                            <p className="text-sm font-semibold text-secondary">
                              {ranking.winPercentage}%
                            </p>
                            <p className="text-xs text-muted-foreground">{t('group.winRate')}</p>
                          </div>
                        )}
                        {sortOption === 'winPercentage' && (
                          <div className="text-right ml-3 min-w-[50px]">
                            <p className="text-sm font-semibold text-secondary">
                              {ranking.points}
                            </p>
                            <p className="text-xs text-muted-foreground">{t('common.points')}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('group.membersTitle', { count: members.length + unregisteredUsers.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Registered members */}
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded border border-foreground"
                >
                  <span className="font-medium">{member.userName}</span>
                  {member.userId === group.createdBy && (
                    <span className="text-xs bg-accent text-foreground px-2 py-1 rounded font-semibold">
                      {t('group.adminLabel')}
                    </span>
                  )}
                </div>
              ))}
              {/* Unregistered members */}
              {unregisteredUsers.map((unregUser) => (
                <div
                  key={unregUser.id}
                  className="flex items-center justify-between p-2 rounded border border-foreground bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{unregUser.name}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {t('group.unregisteredLabel')}
                    </span>
                  </div>
                  {!unregUser.linkedToUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setMemberToLink({
                          id: unregUser.id,
                          groupId: unregUser.groupId,
                          userId: `unregistered_${unregUser.id}`,
                          userName: unregUser.name,
                          joinedAt: unregUser.createdAt,
                          isUnregistered: true,
                        })
                        setLinkUserOpen(true)
                      }}
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      {t('group.linkUser')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Match History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('group.matchesTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t('group.noMatches')}
              </p>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="p-3 rounded-lg border-2 border-foreground bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(match.date)}
                      </p>
                      {match.createdBy === user?.uid && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => setDeleteMatchId(match.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`p-2 rounded border-2 ${
                          match.winningTeam === 'A'
                            ? 'border-success bg-success/10'
                            : 'border-foreground'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1">{t('group.teamA')}</p>
                        <p className="text-sm">{match.teamANames.join(', ')}</p>
                      </div>
                      <div
                        className={`p-2 rounded border-2 ${
                          match.winningTeam === 'B'
                            ? 'border-success bg-success/10'
                            : 'border-foreground'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1">{t('group.teamB')}</p>
                        <p className="text-sm">{match.teamBNames.join(', ')}</p>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {t('group.pointsAwarded', { points: match.pointsAwarded })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Match Confirmation */}
        <AlertDialog
          open={deleteMatchId !== null}
          onOpenChange={() => setDeleteMatchId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('group.deleteMatchTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('group.deleteMatchDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMatchId && handleDeleteMatch(deleteMatchId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Info Dialog */}
        <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('group.infoTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {t('group.infoDescription')}
              </p>
              <div className="space-y-2">
                <p className="font-semibold">{t('group.exampleTitle')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{t('group.infoExample1')}</li>
                  <li>{t('group.infoExample2')}</li>
                  <li>{t('group.infoExample3')}</li>
                  <li>{t('group.infoExample4')}</li>
                  <li>{t('group.infoExample5')}</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Group Confirmation */}
        <AlertDialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('group.deleteGroupTitle', { name: group.name })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('group.deleteGroupDescription')}
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('group.deleteGroupMembers', { count: members.length })}</li>
                  <li>{t('group.deleteGroupMatches', { count: matches.length })}</li>
                  <li>{t('group.deleteGroupStats')}</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingGroup}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={deletingGroup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingGroup ? t('group.deletingGroup') : t('group.deleteGroupAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Link User Dialog */}
        <Dialog open={linkUserOpen} onOpenChange={setLinkUserOpen}>
          <LinkUserDialog
            groupId={groupId!}
            memberToLink={memberToLink}
            currentMembers={members}
            onClose={() => {
              setLinkUserOpen(false)
              setMemberToLink(null)
            }}
          />
        </Dialog>
      </div>
    </div>
  )
}

// Record Match Dialog Component
function RecordMatchDialog({
  groupId,
  members,
  unregisteredUsers,
  onClose,
}: {
  groupId: string
  members: GroupMember[]
  unregisteredUsers: UnregisteredGroupUser[]
  onClose: () => void
}) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0])
  const [teamA, setTeamA] = useState<string[]>([])
  const [teamB, setTeamB] = useState<string[]>([])
  const [winningTeam, setWinningTeam] = useState<'A' | 'B' | ''>('')
  const [saving, setSaving] = useState(false)

  // Combine registered members and unregistered users into a single list
  const allPlayers = [
    ...members.map((m) => ({ id: m.userId, name: m.userName, isUnregistered: false })),
    ...unregisteredUsers.map((u) => ({ id: `unregistered_${u.id}`, name: u.name, isUnregistered: true })),
  ]

  const togglePlayerTeamA = (playerId: string) => {
    if (teamA.includes(playerId)) {
      setTeamA(teamA.filter((id) => id !== playerId))
    } else {
      setTeamA([...teamA, playerId])
      setTeamB(teamB.filter((id) => id !== playerId))
    }
  }

  const togglePlayerTeamB = (playerId: string) => {
    if (teamB.includes(playerId)) {
      setTeamB(teamB.filter((id) => id !== playerId))
    } else {
      setTeamB([...teamB, playerId])
      setTeamA(teamA.filter((id) => id !== playerId))
    }
  }

  const canSave =
    teamA.length >= 1 &&
    teamB.length >= 1 &&
    teamA.length + teamB.length <= allPlayers.length &&
    winningTeam !== ''

  const handleSave = async () => {
    if (!user || !canSave) return

    setSaving(true)
    try {
      const teamANames = teamA.map(
        (id) => allPlayers.find((p) => p.id === id)?.name || ''
      )
      const teamBNames = teamB.map(
        (id) => allPlayers.find((p) => p.id === id)?.name || ''
      )

      const pointsAwarded = calculateMatchPoints(teamA.length, teamB.length, winningTeam)

      await addDoc(collection(db, 'groupMatches'), {
        groupId,
        teamA,
        teamB,
        teamANames,
        teamBNames,
        winningTeam,
        date: Timestamp.fromDate(new Date(matchDate)),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        pointsAwarded,
        allPlayerIds: [...teamA, ...teamB],
      })

      onClose()
    } catch (error) {
      console.error('Error saving match:', error)
      alert(t('group.saveMatchError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{t('group.addMatch')}</DialogTitle>
        <DialogDescription>
          {t('group.recordMatchDescription')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Date */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            {t('group.matchDateLabel')}
          </label>
          <Input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Team A */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            {t('group.teamA')} ({teamA.length})
          </label>
          <div className="space-y-2">
            {allPlayers.map((player) => (
              <Button
                key={player.id}
                variant={teamA.includes(player.id) ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => togglePlayerTeamA(player.id)}
              >
                <span className="flex items-center gap-2">
                  {player.name}
                  {player.isUnregistered && (
                    <UserX className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Team B */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            {t('group.teamB')} ({teamB.length})
          </label>
          <div className="space-y-2">
            {allPlayers.map((player) => (
              <Button
                key={player.id}
                variant={teamB.includes(player.id) ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => togglePlayerTeamB(player.id)}
              >
                <span className="flex items-center gap-2">
                  {player.name}
                  {player.isUnregistered && (
                    <UserX className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Winner */}
        {teamA.length > 0 && teamB.length > 0 && (
          <div>
            <label className="text-sm font-semibold mb-2 block">{t('group.winner')}</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={winningTeam === 'A' ? 'default' : 'outline'}
                onClick={() => setWinningTeam('A')}
              >
                {t('group.teamA')}
              </Button>
              <Button
                variant={winningTeam === 'B' ? 'default' : 'outline'}
                onClick={() => setWinningTeam('B')}
              >
                {t('group.teamB')}
              </Button>
            </div>
            {winningTeam && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {t('group.pointsAwarded', {
                  points: calculateMatchPoints(teamA.length, teamB.length, winningTeam),
                })}
              </p>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={!canSave || saving} className="w-full">
          {saving ? t('common.saving') : t('group.saveMatch')}
        </Button>
      </div>
    </DialogContent>
  )
}

// Add Member Dialog Component
function AddMemberDialog({
  groupId,
  currentMembers,
  unregisteredUsers,
  onClose,
}: {
  groupId: string
  currentMembers: GroupMember[]
  unregisteredUsers: UnregisteredGroupUser[]
  onClose: () => void
}) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [mode, setMode] = useState<'registered' | 'unregistered'>('registered')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [unregisteredName, setUnregisteredName] = useState('')
  const [creatingUnregistered, setCreatingUnregistered] = useState(false)

  const currentMemberIds = currentMembers.map((m) => m.userId)
  const existingUnregisteredNames = unregisteredUsers.map((u) => u.name.toLowerCase())

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef,
        where('displayNameLower', '>=', searchQuery.toLowerCase()),
        where('displayNameLower', '<=', searchQuery.toLowerCase() + '\uf8ff')
      )

      const snapshot = await getDocs(q)
      const results: { id: string; displayName: string }[] = []
      snapshot.forEach((doc) => {
        if (!currentMemberIds.includes(doc.id)) {
          results.push({
            id: doc.id,
            displayName: doc.data().displayName,
          })
        }
      })
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddMember = async (userId: string, userName: string) => {
    if (!user) return

    setAdding(userId)
    try {
      // Add to groupMembers collection
      await addDoc(collection(db, 'groupMembers'), {
        groupId,
        userId,
        userName,
        joinedAt: Timestamp.now(),
      })

      // Update group's memberIds array
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: arrayUnion(userId),
      })

      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Error adding member:', error)
      alert(t('group.addMemberError'))
    } finally {
      setAdding(null)
    }
  }

  const handleCreateUnregisteredUser = async () => {
    if (!user || !unregisteredName.trim()) return

    // Check if name already exists
    if (existingUnregisteredNames.includes(unregisteredName.trim().toLowerCase())) {
      alert(t('group.unregisteredNameExists'))
      return
    }

    setCreatingUnregistered(true)
    try {
      await addDoc(collection(db, 'unregisteredGroupUsers'), {
        name: unregisteredName.trim(),
        groupId,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
      })

      setUnregisteredName('')
      onClose()
    } catch (error) {
      console.error('Error creating unregistered user:', error)
      alert(t('group.createUnregisteredError'))
    } finally {
      setCreatingUnregistered(false)
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t('group.addMemberTitle')}</DialogTitle>
        <DialogDescription>
          {t('group.addMemberDescription')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('registered')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border-3 border-foreground text-sm font-semibold transition-all ${
              mode === 'registered'
                ? 'bg-primary text-foreground shadow-brutal-sm'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            {t('group.registeredUser')}
          </button>
          <button
            onClick={() => setMode('unregistered')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border-3 border-foreground text-sm font-semibold transition-all ${
              mode === 'unregistered'
                ? 'bg-primary text-foreground shadow-brutal-sm'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <UserX className="h-4 w-4" />
            {t('group.unregisteredUser')}
          </button>
        </div>

        {mode === 'registered' ? (
          <>
            <div className="flex gap-2">
              <Input
                placeholder={t('group.addMemberSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? t('group.searching') : t('common.search')}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-2 rounded border border-foreground"
                  >
                    <span className="font-medium">{result.displayName}</span>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(result.id, result.displayName)}
                      disabled={adding === result.id}
                    >
                      {adding === result.id ? t('group.addingMember') : t('common.add')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !searching && (
              <p className="text-center text-muted-foreground text-sm">
                {t('group.addMemberNoResults')}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('group.unregisteredDescription')}
            </p>
            <div className="space-y-3">
              <Input
                placeholder={t('group.unregisteredNamePlaceholder')}
                value={unregisteredName}
                onChange={(e) => setUnregisteredName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && unregisteredName.trim()) {
                    handleCreateUnregisteredUser()
                  }
                }}
              />
              <Button
                onClick={handleCreateUnregisteredUser}
                disabled={!unregisteredName.trim() || creatingUnregistered}
                className="w-full"
              >
                {creatingUnregistered ? t('common.saving') : t('group.createUnregistered')}
              </Button>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  )
}

// Link User Dialog Component
function LinkUserDialog({
  groupId,
  memberToLink,
  currentMembers,
  onClose,
}: {
  groupId: string
  memberToLink: GroupMember | null
  currentMembers: GroupMember[]
  onClose: () => void
}) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)

  const currentMemberIds = currentMembers.map((m) => m.userId)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef,
        where('displayNameLower', '>=', searchQuery.toLowerCase()),
        where('displayNameLower', '<=', searchQuery.toLowerCase() + '\uf8ff')
      )

      const snapshot = await getDocs(q)
      const results: { id: string; displayName: string }[] = []
      snapshot.forEach((doc) => {
        // Only show users who are NOT already members of the group
        if (!currentMemberIds.includes(doc.id)) {
          results.push({
            id: doc.id,
            displayName: doc.data().displayName,
          })
        }
      })
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleLinkUser = async (registeredUserId: string, registeredUserName: string) => {
    if (!user || !memberToLink) return

    setLinking(registeredUserId)
    try {
      // Get the unregistered user ID from the memberToLink
      const unregisteredId = memberToLink.userId.replace('unregistered_', '')

      const unregisteredUserId = `unregistered_${unregisteredId}`

      // Update group matches to replace the unregistered user with the registered user
      const matchesSnapshot = await getDocs(
        query(collection(db, 'groupMatches'), where('groupId', '==', groupId))
      )

      let batch = writeBatch(db)
      let batchCount = 0

      const replacePlayer = (ids: string[], names: string[]) => {
        const updatedIds: string[] = []
        const updatedNames: string[] = []

        ids.forEach((id, index) => {
          const name = names[index] ?? ''
          const nextId = id === unregisteredUserId ? registeredUserId : id
          const nextName = id === unregisteredUserId ? registeredUserName : name

          if (updatedIds.includes(nextId)) {
            return
          }

          updatedIds.push(nextId)
          updatedNames.push(nextName)
        })

        return { updatedIds, updatedNames }
      }

      for (const matchDoc of matchesSnapshot.docs) {
        const data = matchDoc.data()
        const teamA: string[] = data.teamA || []
        const teamB: string[] = data.teamB || []
        const teamANames: string[] = data.teamANames || []
        const teamBNames: string[] = data.teamBNames || []

        if (!teamA.includes(unregisteredUserId) && !teamB.includes(unregisteredUserId)) {
          continue
        }

        const updatedTeamA = replacePlayer(teamA, teamANames)
        const updatedTeamB = replacePlayer(teamB, teamBNames)
        const updatedAllPlayerIds = Array.from(
          new Set([...updatedTeamA.updatedIds, ...updatedTeamB.updatedIds])
        )

        batch.update(matchDoc.ref, {
          teamA: updatedTeamA.updatedIds,
          teamB: updatedTeamB.updatedIds,
          teamANames: updatedTeamA.updatedNames,
          teamBNames: updatedTeamB.updatedNames,
          allPlayerIds: updatedAllPlayerIds,
        })
        batchCount += 1

        if (batchCount >= 450) {
          await batch.commit()
          batch = writeBatch(db)
          batchCount = 0
        }
      }

      if (batchCount > 0) {
        await batch.commit()
      }

      // Remove the unregistered user entry now that data is reassigned
      await deleteDoc(doc(db, 'unregisteredGroupUsers', unregisteredId))

      // Add the registered user as a new group member
      await addDoc(collection(db, 'groupMembers'), {
        groupId,
        userId: registeredUserId,
        userName: registeredUserName,
        joinedAt: Timestamp.now(),
      })

      // Update group's memberIds array
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: arrayUnion(registeredUserId),
      })

      onClose()
    } catch (error) {
      console.error('Error linking user:', error)
      alert(t('group.linkUserError'))
    } finally {
      setLinking(null)
    }
  }

  if (!memberToLink) return null

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t('group.linkUserTitle')}</DialogTitle>
        <DialogDescription>
          {t('group.linkUserDescription', { name: memberToLink.userName })}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex gap-2">
          <Input
            placeholder={t('group.addMemberSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? t('group.searching') : t('common.search')}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 rounded border border-foreground"
              >
                <span className="font-medium">{result.displayName}</span>
                <Button
                  size="sm"
                  onClick={() => handleLinkUser(result.id, result.displayName)}
                  disabled={linking === result.id}
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  {linking === result.id ? t('group.linking') : t('group.link')}
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !searching && (
          <p className="text-center text-muted-foreground text-sm">
            {t('group.addMemberNoResults')}
          </p>
        )}
      </div>
    </DialogContent>
  )
}
