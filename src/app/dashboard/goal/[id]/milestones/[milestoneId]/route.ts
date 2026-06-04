import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const goal = await prisma.goal.findUnique({ where: { id: params.id } })
    if (!goal || goal.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { completed } = await request.json()

    const milestone = await prisma.milestone.update({
      where: { id: params.milestoneId },
      data: { completed }
    })

    return NextResponse.json(milestone)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const goal = await prisma.goal.findUnique({ where: { id: params.id } })
    if (!goal || goal.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.milestone.delete({ where: { id: params.milestoneId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}