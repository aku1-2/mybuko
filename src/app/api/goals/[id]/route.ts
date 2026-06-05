import { NextRequest, NextResponse } from 'next/server'
import { getGoal, updateGoal, deleteGoal } from '../../../../lib/goalsStore'
import { verifyToken } from '../../../../lib/auth'

const getUserIdFromRequest = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(_req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const goal = await getGoal(id)
  if (!goal || goal.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(goal)
}

const handleUpdate = async (req: NextRequest, params: { params: Promise<{ id: string }> }) => {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params.params
  const goal = await getGoal(id)
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const updatedGoal = await updateGoal(id, body)
  if (!updatedGoal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updatedGoal)
}

export async function PATCH(req: NextRequest, params: { params: Promise<{ id: string }> }) {
  try {
    return await handleUpdate(req, params)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest, params: { params: Promise<{ id: string }> }) {
  try {
    return await handleUpdate(req, params)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const goal = await getGoal(id)
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await deleteGoal(id)
  return NextResponse.json({ success: true })
}
