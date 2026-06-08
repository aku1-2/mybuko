import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: goalId } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { content } = await request.json()

    const goal = await prisma.goal.findUnique({ where: { id: goalId } })
    if (!goal || goal.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const note = await prisma.note.create({
      data: {
        content,
        goalId
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}