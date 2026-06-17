import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (token) {
      verifyToken(token)
    }

    // Fetch users with their goals to calculate true database-driven leaderboard rankings
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        profileImage: true,
        goals: {
          where: {
            category: { not: 'Personal' }
          },
          select: {
            progress: true,
            status: true
          }
        }
      }
    })

    const leaderboard = users.map(u => {
      const totalGoals = u.goals.length
      const completedGoals = u.goals.filter(g => g.status === 'Completed').length
      const totalProgress = u.goals.reduce((acc, g) => acc + g.progress, 0)
      
      // Calculate XP score: 500 XP per completed goal + 10 XP per progress percentage point
      const xp = completedGoals * 500 + totalProgress * 10
      
      // Calculate streak based on completed goals
      const streak = totalGoals > 0 ? Math.min(60, totalGoals * 4 + completedGoals * 6) : 0
      
      return {
        id: u.id,
        name: u.name,
        profileImage: u.profileImage,
        xp,
        streak
      }
    })
    // Sort by XP descending
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5)

    return NextResponse.json(leaderboard)
  } catch (err) {
    console.error('Leaderboard fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
  }
}
