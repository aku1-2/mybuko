import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')
    const verified = verifyToken(token)
    if (!verified) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: chatId } = await params
    const cursor = req.nextUrl.searchParams.get('cursor')
    const limit = 20

    // Ensure requesting user is indeed a participant
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId, userId: verified.userId }
      }
    })
    if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Build selective Prisma query
    const queryOptions: any = {
      where: {
        chatId,
        NOT: { deletedFor: { contains: verified.userId } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        text: true,
        fileUrl: true,
        fileType: true,
        createdAt: true,
        senderId: true,
        deletedForEveryone: true,
        reactions: true
      }
    }

    if (cursor) {
      queryOptions.cursor = { id: cursor }
      queryOptions.skip = 1 // Skip the cursor message itself
    }

    // Fetch messages and recipient info concurrently
    const [messages, otherRecord] = await Promise.all([
      prisma.message.findMany(queryOptions),
      prisma.chatParticipant.findFirst({
        where: { chatId, userId: { not: verified.userId } },
        select: {
          lastSeenAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true
            }
          }
        }
      })
    ])

    // Reverse messages to return chronological ascending order for chat window rendering
    messages.reverse()

    return NextResponse.json({
      messages,
      other: otherRecord?.user || null,
      otherLastSeenAt: otherRecord?.lastSeenAt || null
    })
  } catch (err) {
    console.error('Fetch messages error', err)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')
    const verified = verifyToken(token)
    if (!verified) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: chatId } = await params
    const { text, fileUrl, fileType } = await req.json()

    // Verify participant
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId, userId: verified.userId }
      }
    })
    if (!participant) return NextResponse.json({ error: 'Not a chat participant' }, { status: 403 })

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: verified.userId,
        text: text ?? null,
        fileUrl: fileUrl ?? null,
        fileType: fileType ?? null
      },
      select: {
        id: true,
        text: true,
        fileUrl: true,
        fileType: true,
        createdAt: true,
        senderId: true,
        deletedForEveryone: true,
        reactions: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      }
    })

    const now = new Date()
    // Concurrently update chat updatedAt and sender's lastSeenAt
    await Promise.all([
      prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: now }
      }),
      prisma.chatParticipant.update({
        where: {
          chatId_userId: { chatId, userId: verified.userId }
        },
        data: { lastSeenAt: now }
      })
    ])

    return NextResponse.json({ message })
  } catch (err) {
    console.error('Send message error', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
