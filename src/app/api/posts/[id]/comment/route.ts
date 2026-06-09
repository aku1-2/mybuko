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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { content } = body
    const { id: postId } = await params

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        postId,
        userId: user.userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ comment })
  } catch (err) {
    console.error('Create post comment error:', err)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
