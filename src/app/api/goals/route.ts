import { NextRequest, NextResponse } from 'next/server'
import { createGoal, listGoals } from '../../../lib/goalsStore'
import { verifyToken } from '../../../lib/auth'

const getUserIdFromRequest = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const goal = await createGoal({ ...body, userId })
    return NextResponse.json(goal, { status: 201 })
  } catch (err) {
    console.error('Create goal error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const goals = await listGoals(userId)
  return NextResponse.json(goals)
}
