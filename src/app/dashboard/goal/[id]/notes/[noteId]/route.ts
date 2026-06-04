import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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

    await prisma.note.delete({ where: { id: params.noteId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}