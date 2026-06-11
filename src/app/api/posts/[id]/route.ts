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

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true }
  })
  if (!user) return null

  return payload
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ success: true, alreadyDeleted: true })
    }

    if (post.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete post error:', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
