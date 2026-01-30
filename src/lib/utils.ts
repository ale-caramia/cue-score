import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { GroupMatch, GroupRanking } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getStartOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getStartOfYear(date: Date): Date {
  const d = new Date(date)
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Calculate points awarded to the winning team
 * Points = number of defeated opponents
 */
export function calculateMatchPoints(teamASize: number, teamBSize: number, winningTeam: 'A' | 'B'): number {
  return winningTeam === 'A' ? teamBSize : teamASize
}

/**
 * Calculate group rankings from matches
 * Each player gets points equal to the number of defeated opponents when their team wins
 */
export function calculateGroupRankings(
  matches: GroupMatch[],
  memberIds: string[],
  memberNames: Map<string, string>,
  startDate?: Date
): GroupRanking[] {
  const rankings = new Map<string, { points: number; matchesPlayed: number; matchesWon: number }>()

  // Initialize rankings for all members
  memberIds.forEach(userId => {
    rankings.set(userId, { points: 0, matchesPlayed: 0, matchesWon: 0 })
  })

  // Filter matches by date if provided
  const filteredMatches = startDate
    ? matches.filter(match => match.date >= startDate)
    : matches

  // Calculate points for each match
  filteredMatches.forEach(match => {
    const { teamA, teamB, winningTeam, pointsAwarded } = match

    // Update stats for team A players
    teamA.forEach(playerId => {
      const stats = rankings.get(playerId)
      if (stats) {
        stats.matchesPlayed++
        if (winningTeam === 'A') {
          stats.points += pointsAwarded
          stats.matchesWon++
        }
      }
    })

    // Update stats for team B players
    teamB.forEach(playerId => {
      const stats = rankings.get(playerId)
      if (stats) {
        stats.matchesPlayed++
        if (winningTeam === 'B') {
          stats.points += pointsAwarded
          stats.matchesWon++
        }
      }
    })
  })

  // Convert to array and sort by points (descending)
  return Array.from(rankings.entries())
    .map(([userId, stats]) => ({
      userId,
      userName: memberNames.get(userId) || 'Unknown',
      points: stats.points,
      matchesPlayed: stats.matchesPlayed,
      matchesWon: stats.matchesWon,
    }))
    .sort((a, b) => {
      // Sort by points descending, then by matches won, then by name
      if (b.points !== a.points) return b.points - a.points
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon
      return a.userName.localeCompare(b.userName)
    })
}
