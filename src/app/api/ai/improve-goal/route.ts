export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { goalTitle, goalDescription } = await req.json()
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
            content: `Review and improve this goal to make it more SMART (Specific, Measurable, Achievable, Relevant, Time-bound):

Current Goal: ${goalTitle}
Description: ${goalDescription}

Provide JSON with:
{
  "improvedTitle": "better title",
  "improvedDescription": "more specific description",
  "benefits": ["benefit1", "benefit2", "benefit3"],
  "timelineWeeks": number,
  "whyBetter": "explanation"
}

Focus on making it measurable and time-bound!`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const improved = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    return Response.json({ success: true, improved })
  } catch (error) {
    console.error('AI Error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to improve goal' 
    }, { status: 500 })
  }
}