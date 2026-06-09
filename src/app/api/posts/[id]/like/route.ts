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

    const { id: postId } = await params

    const existing = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.userId
        }
      }
    })

    if (existing) {
      await prisma.postLike.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId: user.userId
        }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error('Like post error:', err)
    return NextResponse.json({ error: 'Failed to toggle post like' }, { status: 500 })
  }
}
