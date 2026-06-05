import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'trending'
    const category = searchParams.get('category')

    let goals = await prisma.goal.findMany({
      where: {
        visibility: 'Public',
        NOT: { userId: decoded.userId } // Don't show user's own goals
      },
      include: { user: { select: { name: true, email: true } } },
      take: 12
    })

    // Filter by category
    if (category && category !== 'All') {
      goals = goals.filter(g => g.category === category)
    }

    // Sort by filter type
    if (filter === 'trending') {
      goals.sort((a, b) => b.progress - a.progress)
    } else if (filter === 'recent') {
      goals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (filter === 'popular') {
      goals.sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0))
    }

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching explore goals:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}