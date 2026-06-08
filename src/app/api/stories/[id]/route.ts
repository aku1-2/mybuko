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
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, content } = await req.json()
    const storyId = params.id

    if (action === 'like') {
        const existing = await prisma.storyLike.findUnique({
            where: { storyId_userId: { storyId, userId: user.userId } }
        })
        if (existing) {
            await prisma.storyLike.delete({ where: { id: existing.id } })
            return NextResponse.json({ liked: false })
        } else {
            await prisma.storyLike.create({ data: { storyId, userId: user.userId } })
            return NextResponse.json({ liked: true })
        }
    }

    if (action === 'comment') {
        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })
        const comment = await prisma.storyComment.create({
            data: { storyId, userId: user.userId, content },
            include: { user: { select: { id: true, name: true } } }
        })
        return NextResponse.json(comment)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}