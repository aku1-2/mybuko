import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const followers = await prisma.follow.findMany({ where: { followingId: userId }, include: { follower: true } })
    const list = followers.map(f => ({ id: f.follower.id, name: f.follower.name, email: f.follower.email }))
    return NextResponse.json({ followers: list })
  } catch (err) {
    console.error('Get followers error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
