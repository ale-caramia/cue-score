export interface User {
  id: string
  odisplayName: string
  odcreatedAt: Date
}

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

export interface Friend {
  oduserId: string
  odfrienddisplayName: string
  odfriendId: string
  odaddedAt: Date
}

export interface Match {
  id: string
  odplayer1Id: string
  odplayer1Name: string
  odplayer2Id: string
  odplayer2Name: string
  winnerId: string
  winnerName: string
  date: Date
  createdAt: Date
  createdBy: string
}

export interface Stats {
  wins: number
  losses: number
  total: number
}

export interface Group {
  id: string
  name: string
  createdBy: string
  createdAt: Date
  memberIds: string[]
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  userName: string
  joinedAt: Date
}

export interface GroupMatch {
  id: string
  groupId: string
  teamA: string[] // array of userIds
  teamB: string[] // array of userIds
  teamANames: string[] // array of userNames
  teamBNames: string[] // array of userNames
  winningTeam: 'A' | 'B'
  date: Date
  createdAt: Date
  createdBy: string
  pointsAwarded: number
  allPlayerIds: string[] // for permission checks
}

export interface UserGroupPreference {
  id: string
  userId: string
  groupId: string
  preferredView: 'day' | 'week' | 'month' | 'year'
  lastUpdated: Date
}

export interface GroupRanking {
  userId: string
  userName: string
  points: number
  matchesPlayed: number
  matchesWon: number
}
