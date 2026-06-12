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
  return payload
}

export async function GET(req: NextRequest) {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // Increment views for all these posts
    if (posts.length > 0) {
      try {
        await prisma.post.updateMany({
          where: { id: { in: posts.map(p => p.id) } },
          data: { views: { increment: 1 } }
        })
      } catch (viewErr) {
        console.error('Failed to increment post views:', viewErr)
      }
    }

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('Fetch posts error:', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { text, image } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        text: text.trim(),
        image: image || null,
        userId: user.userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ post })
  } catch (err) {
    console.error('Create post error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
