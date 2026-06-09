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
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error('Fetch notifications error:', err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id } = body

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      })
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.userId },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update notifications error:', err)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
