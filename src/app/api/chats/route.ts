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

    // Find all existing chats with both participants (to find duplicates)
    const existingChats = await prisma.chat.findMany({
      where: {
        AND: [
          { participants: { some: { userId: verified.userId } } },
          { participants: { some: { userId: participantId } } },
        ]
      },
      include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' } } }
    })

    if (existingChats.length > 0) {
      // Keep the one with messages (or oldest) and delete/merge the rest
      const withMessages = existingChats.filter(c => c.messages.length > 0)
      const targetChat = withMessages.length > 0 ? withMessages[0] : existingChats[0]
      
      const toDelete = existingChats.filter(c => c.id !== targetChat.id)
      if (toDelete.length > 0) {
        // Migrate messages if any of the duplicates had messages
        for (const extraChat of toDelete) {
          if (extraChat.messages.length > 0) {
            await prisma.message.updateMany({
              where: { chatId: extraChat.id },
              data: { chatId: targetChat.id }
            })
          }
        }
        await prisma.chat.deleteMany({
          where: { id: { in: toDelete.map(c => c.id) } }
        })
      }
      return NextResponse.json({ chat: targetChat })
    }

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

    // Find all chats for this user
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId: verified.userId } } },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Identify duplicates and filter out blank chats
    const uniqueChatsMap = new Map<string, any>()
    const chatsToDelete: string[] = []

    for (const chat of chats) {
      const otherParticipant = chat.participants.find(p => p.userId !== verified.userId)
      if (!otherParticipant) {
        chatsToDelete.push(chat.id)
        continue
      }

      const key = otherParticipant.userId
      const existing = uniqueChatsMap.get(key)

      if (existing) {
        // We have a duplicate chat for the same user!
        const existingHasMessages = existing.messages.length > 0
        const currentHasMessages = chat.messages.length > 0

        if (currentHasMessages && !existingHasMessages) {
          chatsToDelete.push(existing.id)
          uniqueChatsMap.set(key, chat)
        } else if (!currentHasMessages && existingHasMessages) {
          chatsToDelete.push(chat.id)
        } else {
          if (chat.messages.length >= existing.messages.length) {
            chatsToDelete.push(existing.id)
            uniqueChatsMap.set(key, chat)
          } else {
            chatsToDelete.push(chat.id)
          }
        }
      } else {
        uniqueChatsMap.set(key, chat)
      }
    }

    if (chatsToDelete.length > 0) {
      // Migrate messages of duplicates before deleting
      for (const delId of chatsToDelete) {
        const chatToDel = chats.find(c => c.id === delId)
        if (chatToDel && chatToDel.messages.length > 0) {
          const otherParticipant = chatToDel.participants.find(p => p.userId !== verified.userId)
          if (otherParticipant) {
            const keptChat = uniqueChatsMap.get(otherParticipant.userId)
            if (keptChat && keptChat.id !== delId) {
              await prisma.message.updateMany({
                where: { chatId: delId },
                data: { chatId: keptChat.id }
              })
              // Merge messages in memory for sorting
              keptChat.messages = [...keptChat.messages, ...chatToDel.messages]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            }
          }
        }
      }

      await prisma.chat.deleteMany({
        where: { id: { in: chatsToDelete } }
      })
    }

    // Now filter unique chats to only return those with messages
    const resultChats = Array.from(uniqueChatsMap.values())
      .filter(chat => chat.messages.length > 0)
      .map(chat => ({
        ...chat,
        // Only return the last message for list view
        messages: chat.messages.slice(0, 1)
      }))

    return NextResponse.json({ chats: resultChats })
  } catch (err) {
    console.error('List chats error', err)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}
