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
    
    // Find the chat and include participants
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true
              }
            }
          }
        }
      }
    })

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

    const isPart = chat.participants.some(p => p.userId === verified.userId)
    if (!isPart) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const other = chat.participants.find(p => p.userId !== verified.userId)?.user || null

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        NOT: {
          deletedFor: {
            contains: verified.userId
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    return NextResponse.json({ messages, other })
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

    // verify sender is participant
    const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId: verified.userId } })
    if (!participant) return NextResponse.json({ error: 'Not a chat participant' }, { status: 403 })

    const message = await prisma.message.create({ data: { chatId, senderId: verified.userId, text: text ?? null, fileUrl: fileUrl ?? null, fileType: fileType ?? null } })
    const created = await prisma.message.findUnique({ where: { id: message.id }, include: { sender: true } })
    return NextResponse.json({ message: created })
  } catch (err) {
    console.error('Send message error', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
