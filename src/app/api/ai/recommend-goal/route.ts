export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const {
  title,
  description,
  category,
  budget,
  targetDate,
  location,
  userGoals
} = await req.json()
    const apiKey = process.env.GROQ_API_KEY 

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
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
           content: `
You are MyBuko's AI Aspiration Coach.

MyBuko helps people transform aspirations into reality.

User Input:

Title:
${title || 'Not provided'}

Description:
${description || 'Not provided'}

Category:
${category}

Budget:
${budget || 'Not specified'}

Target Date:
${targetDate || 'Not specified'}

Location:
${location || 'Not specified'}

Existing Goals:
${userGoals.map((g: any) => g.title).join(', ') || 'None'}

Instructions:

1. If the title is provided:
   - Build recommendations around that aspiration.
   - Make them realistic and actionable.
   - Expand the user's idea.

2. If title is empty:
   - Generate 3 inspiring goals in the selected category.

3. Include:
   - title
   - why
   - milestones (3-5)
   - timeframe
   - estimatedBudget

IMPORTANT:
If a title is provided, do NOT generate unrelated goals.
You must build recommendations around the user's title and description.

For example:
Title: Visit Tokyo

Good:
- Visit Tokyo in Spring 2027
- 10-Day Tokyo Cultural Trip
- Tokyo + Kyoto Travel Experience

Bad:
- Explore Beaches
- Learn Guitar
- Start a Business

Return ONLY valid JSON array containing EXACTLY 3 recommendations.

Example:
[
  {
    "title": "Goal 1",
    "why": "...",
    "milestones": ["..."],
    "timeframe": "...",
    "estimatedBudget": "..."
  },
  {
    "title": "Goal 2",
    "why": "...",
    "milestones": ["..."],
    "timeframe": "...",
    "estimatedBudget": "..."
  },
  {
    "title": "Goal 3",
    "why": "...",
    "milestones": ["..."],
    "timeframe": "...",
    "estimatedBudget": "..."
  }
]
`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API error ${response.status}: ${errorText}`)
    }
console.log('Groq response status:', response.status)

    const data = await response.json()
    const content = data.choices[0].message.content
console.log('AI content:', content)
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('AI response did not include valid recommendations')
    }

    let recommendations

    try {
      const parsed = JSON.parse(jsonMatch[0])

      if (Array.isArray(parsed)) {
        recommendations = parsed
      } else {
        recommendations = [parsed]
      }
    } catch (err) {
      console.error('JSON Parse Error:', err)
      throw new Error('Invalid JSON returned by AI')
    }

    return Response.json({ 
      success: true, 
      recommendations,
      raw: content 
    })
  } catch (error) {
    console.error('AI Error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to generate recommendations' 
    }, { status: 500 })
  }
}