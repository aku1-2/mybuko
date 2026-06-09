import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getUserFromRequest(req: NextRequest) {
  let token = req.cookies.get('token')?.value
  console.log('Cookie token:', token)
  
  if (!token) {
    const authHeader = req.headers.get('authorization')
    console.log('Auth header:', authHeader)
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }
  
  if (!token) {
    console.log('No token found')
    return null
  }
  
  const payload = verifyToken(token)
  console.log('Payload:', payload)
  
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true }
  })
  console.log('User found:', user)
  
  if (!user) return null
  return payload
}

export async function POST(req: NextRequest) {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { mediaUrl, mediaType } = await req.json()
    if (!mediaUrl) return NextResponse.json({ error: 'Media required' }, { status: 400 })

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const story = await prisma.story.create({
        data: { mediaUrl, mediaType, expiresAt, userId: user.userId },
        include: {
            user: { select: { id: true, name: true, profileImage: true } },
            likes: true,
            comments: { include: { user: { select: { id: true, name: true } } } }
        }
    })

    return NextResponse.json(story)
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req)

        if (!user) {
            return NextResponse.json([])
        }

        const follows = await prisma.follow.findMany({
            where: { followerId: user.userId },
            select: { followingId: true }
        })

        const followedIds = follows.map(f => f.followingId)
        const allIds = [user.userId, ...followedIds]

        const stories = await prisma.story.findMany({
            where: {
                userId: { in: allIds },
                expiresAt: { gt: new Date() }
            },
            include: {
                user: { select: { id: true, name: true, profileImage: true } },
                likes: true,
                comments: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(stories)
    } catch (err) {
        console.error('Fetch stories error', err)
        return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }
}