export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { goalTitle, currentProgress, lastUpdate, daysActive } = await req.json()
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
            content: `You are a supportive goal achievement coach.

Goal: ${goalTitle}
Progress: ${currentProgress}%
Days Active: ${daysActive}
Last Updated: ${lastUpdate}

Provide:
1. Encouraging analysis of current progress
2. 3 specific next steps to move forward
3. 1 motivational quote
4. Potential obstacles and how to overcome them

Keep it concise and action-oriented!`
          }
        ],
        temperature: 0.8,
        max_tokens: 800,
      })
    })

    const data = await response.json()
    const tips = data.choices[0].message.content

    return Response.json({ success: true, tips })
  } catch (error) {
    console.error('AI Error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to generate tips' 
    }, { status: 500 })
  }
}