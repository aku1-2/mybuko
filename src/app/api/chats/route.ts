import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')
    const verified = verifyToken(token)
    if (!verified) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { participantId } = body
    if (!participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })

    // Ensure mutual follow exists (both follow each other)
    const mutual = await prisma.follow.findFirst({ where: { followerId: verified.userId, followingId: participantId } })
    const mutual2 = await prisma.follow.findFirst({ where: { followerId: participantId, followingId: verified.userId } })
    if (!mutual || !mutual2) return NextResponse.json({ error: 'Chat allowed only between mutual followers' }, { status: 403 })

    // Find existing chat with both participants
    const existing = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: verified.userId } } },
          { participants: { some: { userId: participantId } } },
        ]
      },
      include: { participants: { include: { user: true } }, messages: true }
    })

    if (existing) return NextResponse.json({ chat: existing })

    // create chat and participants
    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: verified.userId },
            { userId: participantId }
          ]
        }
      },
      include: { participants: { include: { user: true } }, messages: true }
    })

    return NextResponse.json({ chat })
  } catch (err) {
    console.error('Create chat error', err)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')
    const verified = verifyToken(token)
    if (!verified) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const chats = await prisma.chat.findMany({ where: { participants: { some: { userId: verified.userId } } }, include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } })

    return NextResponse.json({ chats })
  } catch (err) {
    console.error('List chats error', err)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}
