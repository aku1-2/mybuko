import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

const getUserIdFromRequest = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

// GET: Fetch user's financial status, streak, badges, and transaction logs
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        monthlyIncome: true,
        monthlyExpenses: true,
        totalSavings: true,
        savingsStreak: true,
        badges: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get transaction history
    const transactions = await prisma.financeTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      profile: user,
      transactions,
    })
  } catch (error: any) {
    console.error('Error fetching finance details:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

// POST: Log a transaction or update recurring income/expenses
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, type, notes, goalId, monthlyIncome, monthlyExpenses } = body

    // 1. Check if we're just updating the recurring profile (monthlyIncome / monthlyExpenses)
    if (monthlyIncome !== undefined || monthlyExpenses !== undefined) {
      const updateData: any = {}
      if (monthlyIncome !== undefined) updateData.monthlyIncome = parseFloat(monthlyIncome)
      if (monthlyExpenses !== undefined) updateData.monthlyExpenses = parseFloat(monthlyExpenses)

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          monthlyIncome: true,
          monthlyExpenses: true,
          totalSavings: true,
          savingsStreak: true,
          badges: true,
        }
      })

      return NextResponse.json({ success: true, profile: updatedUser })
    }

    // 2. Validate transaction input
    if (amount === undefined || !type) {
      return NextResponse.json({ error: 'Amount and type are required' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // 3. Create the transaction in the database
    const transaction = await prisma.financeTransaction.create({
      data: {
        amount: parsedAmount,
        type,
        notes: notes || '',
        goalId: goalId || null,
        userId,
      }
    })

    // 4. Fetch the user to adjust calculations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalSavings: true,
        badges: true,
        goals: {
          include: {
            milestones: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedTotalSavings = user.totalSavings
    let newStreak = 0

    // Adjust wallet and goals based on transaction type
    if (type === 'SAVINGS' || type === 'CONTRIBUTION') {
      updatedTotalSavings += parsedAmount
    } else if (type === 'EXPENSE') {
      updatedTotalSavings = Math.max(0, updatedTotalSavings - parsedAmount)
    }

    // Update the specific goal if it's a contribution
    if (type === 'CONTRIBUTION' && goalId) {
      const targetGoal = user.goals.find(g => g.id === goalId)
      if (targetGoal) {
        const newSaved = Math.max(0, targetGoal.amountSaved + parsedAmount)
        // Auto-calculate goal progress percentage based on budget
        let newProgress = targetGoal.progress
        if (targetGoal.budget && targetGoal.budget > 0) {
          newProgress = Math.min(100, Math.round((newSaved / targetGoal.budget) * 100))
        }
        
        await prisma.goal.update({
          where: { id: goalId },
          data: {
            amountSaved: newSaved,
            progress: newProgress,
            status: newProgress === 100 ? 'Completed' : targetGoal.status
          }
        })
      }
    }

    // 5. Dynamic Badge Unlocking System
    const existingBadges = user.badges ? user.badges.split(',').map(b => b.trim()).filter(b => b) : []
    const newBadges = [...existingBadges]

    // Rule: First Saver
    if (!newBadges.includes('First Saver') && updatedTotalSavings > 0) {
      newBadges.push('First Saver')
    }

    // Rule: Dream Investor (savings > ₹50,000)
    if (!newBadges.includes('Dream Investor') && updatedTotalSavings >= 50000) {
      newBadges.push('Dream Investor')
    }

    // Fetch transactions count for 'Finance Planner' badge
    const transactionsCount = await prisma.financeTransaction.count({
      where: { userId }
    })
    if (!newBadges.includes('Finance Planner') && transactionsCount >= 3) {
      newBadges.push('Finance Planner')
    }

    // Check if any goal is fully funded
    const freshUserGoals = await prisma.goal.findMany({
      where: { userId }
    })
    const hasFullyFunded = freshUserGoals.some(g => g.budget && g.amountSaved >= g.budget)
    if (hasFullyFunded) {
      if (!newBadges.includes('Goal Funded')) {
        newBadges.push('Goal Funded')
      }
      if (!newBadges.includes('Budget Master')) {
        newBadges.push('Budget Master')
      }
    }

    // Calculate saving streak (e.g. based on months of saving logs, mock-increment for now or calculate from transaction dates)
    const uniqueSavingMonths = await prisma.financeTransaction.findMany({
      where: {
        userId,
        type: { in: ['SAVINGS', 'CONTRIBUTION'] }
      },
      select: { createdAt: true }
    })
    const monthsSet = new Set(uniqueSavingMonths.map(t => new Date(t.createdAt).getMonth()))
    newStreak = Math.max(1, monthsSet.size)

    // Save user finance adjustments
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalSavings: updatedTotalSavings,
        savingsStreak: newStreak,
        badges: newBadges.join(','),
      },
      select: {
        monthlyIncome: true,
        monthlyExpenses: true,
        totalSavings: true,
        savingsStreak: true,
        badges: true,
      }
    })

    return NextResponse.json({
      success: true,
      transaction,
      profile: updatedUser,
      unlockedNewBadge: newBadges.length > existingBadges.length
    })
  } catch (error: any) {
    console.error('Error logging transaction:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
