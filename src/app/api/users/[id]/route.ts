import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profileImage: true,
        createdAt: true,
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get goals stats
    const goals = await prisma.goal.findMany({
      where: { userId }
    })
    const totalGoals = goals.length
    const completedGoals = goals.filter(g => g.status === 'Completed').length
    const inProgressGoals = goals.filter(g => g.status === 'In Progress').length
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

    // Get follow metrics
    const followersCount = await prisma.follow.count({ where: { followingId: userId } })
    const followingCount = await prisma.follow.count({ where: { followerId: userId } })

    // Check if requester is following target user
    let isFollowing = false
    let isMutual = false
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (token) {
      const verified = verifyToken(token)
      if (verified && verified.userId !== userId) {
        const followRecord = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: verified.userId,
              followingId: userId,
            }
          }
        })
        isFollowing = !!followRecord

        // Check mutual follow
        const mutualRecord = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: verified.userId,
            }
          }
        })
        isMutual = isFollowing && !!mutualRecord
      }
    }

    return NextResponse.json({
      user: {
        ...targetUser,
        stats: {
          totalGoals,
          completedGoals,
          inProgressGoals,
          completionRate,
        },
        followersCount,
        followingCount,
        isFollowing,
        isMutual,
      }
    })
  } catch (err) {
    console.error('Fetch profile details error:', err)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}
