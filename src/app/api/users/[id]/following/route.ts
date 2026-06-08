import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const following = await prisma.follow.findMany({ where: { followerId: userId }, include: { following: true } })
    const list = following.map(f => ({ id: f.following.id, name: f.following.name, email: f.following.email }))
    return NextResponse.json({ following: list })
  } catch (err) {
    console.error('Get following error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
