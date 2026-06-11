import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getUserFromRequest(req: NextRequest) {
    let token = req.cookies.get('token')?.value
    if (!token) {
        const authHeader = req.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7)
        }
    }
    if (!token) return null
    const payload = verifyToken(token)
    if (!payload) return null

    // Handle database reset by ensuring the user exists in DB
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true }
    })
    if (!user) return null

    return payload
}

// POST: like or comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, content } = await req.json()
    const { id: storyId } = await params

    if (action === 'like') {
        const existing = await prisma.storyLike.findUnique({
            where: { storyId_userId: { storyId, userId: user.userId } }
        })
        if (existing) {
            await prisma.storyLike.delete({ where: { id: existing.id } })
            return NextResponse.json({ liked: false })
        } else {
            await prisma.storyLike.create({ data: { storyId, userId: user.userId } })

            // Send Notification for Like
            const story = await prisma.story.findUnique({ where: { id: storyId } })
            if (story && story.userId !== user.userId) {
                const liker = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } })
                await prisma.notification.create({
                    data: {
                        userId: story.userId,
                        senderId: user.userId,
                        type: 'LIKE',
                        storyId,
                        message: `${liker?.name || 'Someone'} liked your story.`
                    }
                })
            }

            return NextResponse.json({ liked: true })
        }
    }

    if (action === 'comment') {
        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

        const story = await prisma.story.findUnique({ where: { id: storyId } })
        if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

        // Create StoryComment in DB so it shows up in stories viewer list
        await prisma.storyComment.create({
            data: {
                storyId,
                userId: user.userId,
                content
            }
        })

        // Find or create direct chat between commenter and story owner
        if (user.userId === story.userId) {
            return NextResponse.json({ success: true, selfComment: true })
        }

        // Find or create direct chat between commenter and story owner
        const existingChats = await prisma.chat.findMany({
            where: {
                AND: [
                    { participants: { some: { userId: user.userId } } },
                    { participants: { some: { userId: story.userId } } }
                ]
            },
            include: { messages: true }
        })

        let chat
        if (existingChats.length > 0) {
            const withMessages = existingChats.filter(c => c.messages.length > 0)
            chat = withMessages.length > 0 ? withMessages[0] : existingChats[0]
            
            const toDelete = existingChats.filter(c => c.id !== chat.id)
            if (toDelete.length > 0) {
                // Move messages to the kept chat before deleting
                for (const extraChat of toDelete) {
                    if (extraChat.messages.length > 0) {
                        await prisma.message.updateMany({
                            where: { chatId: extraChat.id },
                            data: { chatId: chat.id }
                        })
                    }
                }
                await prisma.chat.deleteMany({
                    where: { id: { in: toDelete.map(c => c.id) } }
                })
            }
        } else {
            chat = await prisma.chat.create({
                data: {
                    participants: {
                        create: [
                            { userId: user.userId },
                            { userId: story.userId }
                        ]
                    }
                }
            })
        }

        // Send comment as a private message in that chat
        await prisma.message.create({
            data: {
                chatId: chat.id,
                senderId: user.userId,
                text: `Story Comment: "${content}"`
            }
        })

        // Update parent chat's updatedAt timestamp
        await prisma.chat.update({
            where: { id: chat.id },
            data: { updatedAt: new Date() }
        })

        // Send Notification for Comment
        if (story.userId !== user.userId) {
            const commenter = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } })
            await prisma.notification.create({
                data: {
                    userId: story.userId,
                    senderId: user.userId,
                    type: 'COMMENT',
                    storyId,
                    message: `${commenter?.name || 'Someone'} commented on your story: "${content}"`
                }
            })
        }

        return NextResponse.json({ success: true, sentAsDm: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}