import { prisma } from './prisma'

type Goal = {
  id: string
  userId: string
  title: string
  description?: string
  category?: string
  targetDate?: string | null
  budget?: number | null
  priority?: string
  difficulty?: string
  location?: string
  tags?: string[]
  status?: string
  progress?: number
  createdAt: string
  milestones?: any[]
  notes?: any[]
  estimatedCost?: number | null
  amountSaved?: number
}

const formatTags = (tags?: string[] | string) => {
  if (Array.isArray(tags)) return tags.join(',')
  return typeof tags === 'string' ? tags : ''
}

const parseGoal = (goal: any): Goal => ({
  ...goal,
  tags: goal.tags ? goal.tags.split(',').filter((tag: string) => tag.trim().length > 0) : [],
  targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString() : null,
})

export async function createGoal(data: Partial<Goal>) {
  const category = data.category || 'General'
  const visibility = category === 'Personal' ? 'Private' : (data.visibility || 'Private')

  const goal = await prisma.goal.create({
    data: {
      userId: data.userId || '',
      title: data.title || 'Untitled',
      description: data.description || '',
      category,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      budget: data.budget ?? null,
      priority: data.priority || 'Medium',
      difficulty: data.difficulty || 'Medium',
      location: data.location || '',
      tags: formatTags(data.tags),
      visibility,
      status: data.status || 'Not Started',
      progress: data.progress ?? 0,
      estimatedCost: data.estimatedCost ?? null,
      amountSaved: data.amountSaved ?? 0,
    },
  })

  return parseGoal(goal)
}

export async function getGoal(id: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      milestones: {
        orderBy: { order: 'asc' }
      },
      notes: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  return goal ? parseGoal(goal) : null
}

export async function updateGoal(id: string, updates: Partial<Goal>) {
  const existing = await prisma.goal.findUnique({ where: { id } })
  if (!existing) return null

  const category = updates.category ?? existing.category
  const visibility = category === 'Personal' ? 'Private' : (updates.visibility ?? existing.visibility)

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: updates.title ?? existing.title,
      description: updates.description ?? existing.description,
      category,
      targetDate: updates.targetDate === '' ? null : updates.targetDate ? new Date(updates.targetDate) : existing.targetDate,
      budget: updates.budget ?? existing.budget,
      priority: updates.priority ?? existing.priority,
      difficulty: updates.difficulty ?? existing.difficulty,
      location: updates.location ?? existing.location,
      tags: updates.tags ? formatTags(updates.tags) : existing.tags,
      visibility,
      status: updates.status ?? existing.status,
      progress: updates.progress ?? existing.progress,
      estimatedCost: updates.estimatedCost !== undefined ? updates.estimatedCost : existing.estimatedCost,
      amountSaved: updates.amountSaved !== undefined ? updates.amountSaved : existing.amountSaved,
    },
    include: {
      milestones: {
        orderBy: { order: 'asc' }
      },
      notes: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  return parseGoal(goal)
}

export async function deleteGoal(id: string) {
  const goal = await prisma.goal.delete({
    where: { id },
  })

  return parseGoal(goal)
}

export async function listGoals(userId?: string) {
  if (!userId) return []

  const goals = await prisma.goal.findMany({
    where: { userId },
    include: {
      milestones: {
        orderBy: { order: 'asc' }
      },
      notes: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return goals.map(parseGoal)
}
