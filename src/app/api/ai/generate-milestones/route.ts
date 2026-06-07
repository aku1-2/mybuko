export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { goalTitle, goalDescription, targetDate } = await req.json()
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY

    if (!apiKey) {
      throw new Error('GROQ API key is not configured')
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: `Create a detailed milestone roadmap for this goal:

Goal: ${goalTitle}
Description: ${goalDescription}
Target Date: ${targetDate}

Generate 5-7 specific, measurable milestones with:
- Title
- Description
- Suggested completion date (as percentage: 20%, 40%, 60%, 80%, 100%)
- Key actions to complete it

Make them SMART (Specific, Measurable, Achievable, Relevant, Time-bound).

Format as JSON array: [{title, description, percentage, actions[]}]`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const milestones = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return Response.json({ 
      success: true, 
      milestones 
    })
  } catch (error) {
    console.error('AI Error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to generate milestones' 
    }, { status: 500 })
  }
}