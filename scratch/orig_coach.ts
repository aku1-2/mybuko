import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../lib/auth'

export const runtime = 'nodejs'

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
    const { messages, mode, goalContext } = body

    const apiKey = process.env.GROQ_API_KEY

    // Fallback: If Groq API Key is missing, use intelligent mock generation
    if (!apiKey) {
      console.warn('GROQ API key is not configured. Falling back to mock AI Financial Coach.')
      const reply = generateMockCoachResponse(mode, messages, goalContext)
      return NextResponse.json({ success: true, reply })
    }

    let systemPrompt = ''
    let userMessageContent = ''

    if (mode === 'optimize') {
      systemPrompt = `You are MyBuko's AI Financial Optimizer. You help users find alternative, cheaper ways to achieve their bucket list dreams, suggest optimal timelines, and provide concrete savings adjustments. 
Always return a structured recommendation detailing:
1. Alternative budget-friendly options (e.g. Thailand or Vietnam instead of Japan, local trekking instead of Everest, learning online instead of premium in-person courses).
2. Actionable timeline changes (e.g. postponing by 3 months to reduce monthly savings pressure).
3. Booking/buying tips (e.g. best flight booking seasons, secondhand gear, group booking discounts).
Be precise, realistic, and use the currency symbol ₹ (INR) since MyBuko targets Indian users.`

      userMessageContent = `Optimize this goal:
Goal: ${goalContext.title}
Current Budget: ₹${goalContext.budget || 'Not specified'}
Estimated Cost: ₹${goalContext.estimatedCost || 'Not specified'}
Current Savings: ₹${goalContext.amountSaved || '0'}
Target Timeline: ${goalContext.targetDate ? new Date(goalContext.targetDate).toLocaleDateString() : 'Not specified'}
Category: ${goalContext.category}

Suggest:
1. Three alternative, cheaper options (name, cost in ₹, and brief reason why it saves money).
2. Cost breakdown structure (Flights/Travel, Lodging, Food, Training/Equipment, Misc).
3. Savings optimization tip (concrete adjustment in monthly budget).`
    } else {
      // Default: Conversational Coach
      systemPrompt = `You are MyBuko's Premium AI Financial Coach. You help users plan, save for, and budget their bucket list dreams.
You have access to the user's current goals:
${JSON.stringify(goalContext || [])}

Instructions:
- Be encouraging, highly practical, and act like a mix of YNAB founder, Mint product designer, and a helpful personal wealth manager.
- Suggest clever saving adjustments, side hustles, or timeline shifts.
- Keep answers structured with bullet points.
- Respond in short, readable paragraphs (maximum 150 words).
- Use ₹ (INR) as the default currency unless asked otherwise.`

      // Take the last user message or format messages
      const lastMsg = messages?.[messages.length - 1]?.content || 'Can I afford my dreams?'
      userMessageContent = lastMsg
    }

    // Call Groq Llama-3.1 model
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(mode === 'optimize' 
            ? [{ role: 'user', content: userMessageContent }]
            : messages?.map((m: any) => ({ role: m.role, content: m.content })) || [{ role: 'user', content: userMessageContent }])
        ],
        temperature: 0.7,
        max_tokens: 800,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const reply = data.choices[0].message.content

    return NextResponse.json({ success: true, reply })
  } catch (error: any) {
    console.error('AI Finance Coach Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate financial advice. Falling back to local calculator.',
      reply: 'I encountered a brief issue connecting to my brain. However, here is a general tip: To achieve your dreams faster, try automating ₹1,500 monthly transfers to a separate account right after payday!' 
    }, { status: 500 })
  }
}

// Intelligent mock responses when GROQ key is missing or fails
function generateMockCoachResponse(mode: string, messages: any[], goalContext: any) {
  if (mode === 'optimize') {
    const title = goalContext?.title || 'Japan Trip'
    if (title.toLowerCase().includes('japan')) {
      return `### 🌟 Budget Optimization for: Japan Trip
Your user budget is currently ₹100,000, which is ₹50,000 lower than the AI-estimated cost of ₹150,000. Here are some optimized strategies:

#### 1. Cheaper Alternatives
*   **Thailand (Bangkok & Chiang Mai):** ₹70,000 (Savings of ₹80,000). Incredible street food, cultural temples, and pristine beaches at a fraction of the cost.
*   **Vietnam (Hanoi & Halong Bay):** ₹60,000 (Savings of ₹90,000). Highly affordable lodging, rich history, and breath-taking landscapes.
*   **South Korea (Seoul & Busan):** ₹110,000 (Savings of ₹40,000). High-tech cities, modern transit, and K-culture with similar vibes to Japan but lower flight/hotel costs.

#### 2. Cost Breakdown Estimate (Thailand alternative)
*   **Flights:** ₹25,000 (Book 4 months in advance)
*   **Accommodation:** ₹20,000 (Premium hostels or cozy local Airbnbs)
*   **Food & Local Transit:** ₹15,050
*   **Activities & Sightseeing:** ₹10,000

#### 3. Recommended Optimization
*   *Strategy:* Postpone the Japan Trip by 3 months. By doing this, you reduce your monthly saving requirement from ₹12,500/month to ₹8,333/month, making it 33% more affordable with your current savings stream.`
    }

    return `### 🌟 Budget Optimization for: ${title}
We noticed a gap between your target budget and the estimated costs.

#### 1. Cheaper Alternatives
*   **Option A (Budget Route):** Save 45% by opting for local/domestic alternatives instead of international bookings.
*   **Option B (Off-Peak Booking):** Save 25% by adjusting your dates to off-season (e.g. monsoon/shoulder season).
*   **Option C (Self-Guided):** Save 15% by choosing self-planned trails/itineraries rather than all-inclusive agency packages.

#### 2. Booking Adjustments
*   Book flights on mid-week days (Tuesdays/Wednesdays).
*   Rent or borrow training equipment and specialized gear (backpacks, camera lenses, trekking poles) rather than buying brand new.`
  }

  // Conversational response
  const userText = messages?.[messages.length - 1]?.content?.toLowerCase() || ''

  if (userText.includes('afford') || userText.includes('can i')) {
    return `To assess if you can afford your current dreams:
1. **Analyze the Gap:** You have saved ₹${goalContext?.amountSaved || 0} towards your goals. Your next target requires ₹${goalContext?.budget || 50000}.
2. **Review Income:** Based on your current income stream, try capping non-essential leisure expenses to 15% of your income.
3. **Automated Allocations:** Allocate savings using the **40/30/20/10 priority ratio** from your Dream Wallet dashboard (40% to your top goal, 30% to the second, etc.). This ensures your most urgent dream stays funded first.`
  }

  if (userText.includes('save faster') || userText.includes('more money')) {
    return `Here are the top 3 strategies to fast-track your dream savings:
*   **The "Rule of 72 hours":** Wait 3 days before any non-essential purchase over ₹1,000. If you still want it, buy it. You'll cut impulsive buying by 40%.
*   **Unsubscribe Cleanup:** Review your active subscriptions. Canceling just two unused streaming/app services can unlock ₹800–₹1,200 monthly to route directly to your wallet.
*   **Micro-investing:** Put your savings into low-risk short-term liquid funds. It keeps the money out of daily spending reach and earns a 5-6% yield.`
  }

  return `Hello! I am your MyBuko AI Financial Coach. 

Here are some insights based on your bucket-list planning:
- You have **${Array.isArray(goalContext) ? goalContext.length : 0} active goals** registered.
- Setting up a **Savings Streak** by committing as little as ₹500/month will unlock exclusive command center badges.
- Adjust your timelines in **Budget Simulation Mode** to see how delaying a goal by 2-3 months reduces monthly saving stress by up to 30%.

What financial strategy or goal optimization would you like to discuss today?`
}
