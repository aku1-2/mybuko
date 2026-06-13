import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')
    const verified = verifyToken(token)
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const { deleteType } = await req.json() // 'me' | 'everyone'

    if (!deleteType || (deleteType !== 'me' && deleteType !== 'everyone')) {
      return NextResponse.json({ error: 'Invalid deleteType' }, { status: 400 })
    }

    // Selective database lookup
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        chatId: true,
        deletedFor: true,
        chat: {
          select: {
            participants: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify user is participant in the chat
    const isParticipant = message.chat.participants.some(p => p.userId === verified.userId)
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (deleteType === 'everyone') {
      // Delete for Everyone: Must be the sender
      if (message.senderId !== verified.userId) {
        return NextResponse.json({ error: 'Only the sender can delete a message for everyone' }, { status: 403 })
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          deletedForEveryone: true,
          text: 'This message was deleted',
          fileUrl: null,
          fileType: null
        },
        select: {
          id: true,
          chatId: true,
          senderId: true,
          text: true,
          fileUrl: true,
          fileType: true,
          createdAt: true,
          deletedForEveryone: true
        }
      })

      return NextResponse.json({ success: true, message: updated })
    } else {
      // Delete for Me (one side)
      const currentDeletedFor = message.deletedFor || ''
      const newList = currentDeletedFor ? `${currentDeletedFor},${verified.userId}` : verified.userId

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          deletedFor: newList
        },
        select: {
          id: true,
          chatId: true,
          senderId: true,
          text: true,
          fileUrl: true,
          fileType: true,
          createdAt: true,
          deletedForEveryone: true
        }
      })

      return NextResponse.json({ success: true, message: updated })
    }
  } catch (err) {
    console.error('Delete message error', err)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
