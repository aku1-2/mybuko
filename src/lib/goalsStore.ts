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
  const goal = await prisma.goal.create({
    data: {
      userId: data.userId || '',
      title: data.title || 'Untitled',
      description: data.description || '',
      category: data.category || 'General',
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      budget: data.budget ?? null,
      priority: data.priority || 'Medium',
      difficulty: data.difficulty || 'Medium',
      location: data.location || '',
      tags: formatTags(data.tags),
      status: data.status || 'Not Started',
      progress: data.progress ?? 0,
    },
  })

  return parseGoal(goal)
}

export async function getGoal(id: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
  })

  return goal ? parseGoal(goal) : null
}

export async function updateGoal(id: string, updates: Partial<Goal>) {
  const existing = await prisma.goal.findUnique({ where: { id } })
  if (!existing) return null

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: updates.title ?? existing.title,
      description: updates.description ?? existing.description,
      category: updates.category ?? existing.category,
      targetDate: updates.targetDate === '' ? null : updates.targetDate ? new Date(updates.targetDate) : existing.targetDate,
      budget: updates.budget ?? existing.budget,
      priority: updates.priority ?? existing.priority,
      difficulty: updates.difficulty ?? existing.difficulty,
      location: updates.location ?? existing.location,
      tags: updates.tags ? formatTags(updates.tags) : existing.tags,
      status: updates.status ?? existing.status,
      progress: updates.progress ?? existing.progress,
    },
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
    orderBy: { createdAt: 'desc' },
  })

  return goals.map(parseGoal)
}
