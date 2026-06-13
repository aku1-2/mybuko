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

    // 1. Enforce mutual follow (both follow each other)
    const [mutual, mutual2] = await Promise.all([
      prisma.follow.findFirst({ where: { followerId: verified.userId, followingId: participantId } }),
      prisma.follow.findFirst({ where: { followerId: participantId, followingId: verified.userId } })
    ])
    
    if (!mutual || !mutual2) {
      return NextResponse.json({ error: 'Chat allowed only between mutual followers' }, { status: 403 })
    }

    // 2. Find if a chat already exists between both participants
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: verified.userId } } },
          { participants: { some: { userId: participantId } } }
        ]
      },
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
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (existingChat) {
      return NextResponse.json({ chat: existingChat })
    }

    // 3. Create chat and participants
    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: verified.userId },
            { userId: participantId }
          ]
        }
      },
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
        },
        messages: true
      }
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

    // 1. Fetch all participants with chat details in a single query (optimized selection)
    const participants = await prisma.chatParticipant.findMany({
      where: { userId: verified.userId },
      include: {
        chat: {
          include: {
            participants: {
              where: { userId: { not: verified.userId } },
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
            },
            messages: {
              where: {
                NOT: { deletedFor: { contains: verified.userId } }
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    // 2. Fetch unread counts concurrently using Promise.all
    const resultChats = await Promise.all(
      participants
        .filter(p => p.chat.messages.length > 0) // Only return active chats
        .map(async (p) => {
          const chat = p.chat
          const otherParticipantRecord = chat.participants[0]
          const otherParticipant = otherParticipantRecord?.user || null
          const lastMessage = chat.messages[0] || null

          // Count messages sent by other users after the current user's lastSeenAt
          const unreadCount = await prisma.message.count({
            where: {
              chatId: chat.id,
              createdAt: { gt: p.lastSeenAt },
              senderId: { not: verified.userId },
              NOT: { deletedFor: { contains: verified.userId } }
            }
          })

          return {
            id: chat.id,
            updatedAt: chat.updatedAt,
            otherParticipant,
            lastMessage,
            unreadCount,
            lastSeenAt: p.lastSeenAt,
            otherLastSeenAt: otherParticipantRecord?.lastSeenAt || null
          }
        })
    )

    // 3. Sort by last activity (updatedAt desc)
    resultChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json({ chats: resultChats })
  } catch (err) {
    console.error('List chats error', err)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}
