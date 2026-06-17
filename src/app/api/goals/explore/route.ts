import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (token) {
      verifyToken(token)
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'trending'
    const category = searchParams.get('category')

    const where: any = { visibility: 'Public' }
    if (category && category !== 'All') {
      where.category = category
    }

    let goals = await prisma.goal.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 12
    })

    if (goals.length < 12) {
      const fallbackGoals = await prisma.goal.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: [
          { progress: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 24
      })
      const merged = [...goals]
      for (const fg of fallbackGoals) {
        if (!merged.some(g => g.id === fg.id)) {
          merged.push(fg)
        }
      }
      goals = merged.slice(0, 12)
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