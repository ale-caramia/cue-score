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
