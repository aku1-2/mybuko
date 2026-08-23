export const runtime = 'nodejs'

export async function POST(req: Request) {
  let goalTitle = ''
  let goalDescription = ''

  try {
    const body = await req.json()
    goalTitle = body.goalTitle || ''
    goalDescription = body.goalDescription || ''
  } catch (parseErr) {
    console.warn('Error parsing request body:', parseErr)
  }

  const getMockImprovedGoal = () => ({
    improvedTitle: goalTitle ? `Master: ${goalTitle}` : 'Mastering My Milestone',
    improvedDescription: `Systematically achieve "${goalTitle || 'My Goal'}" by dedicating focused hours, establishing weekly checkpoints, and tracking progress metrics. ${goalDescription ? `Context: ${goalDescription}` : ''}`,
    benefits: [
      "Creates clear accountability and tracking",
      "Breaks a large vision into actionable micro-habits",
      "Increases the likelihood of long-term consistency"
    ],
    timelineWeeks: 12,
    whyBetter: "It translates a general goal into structured milestones with clear time constraints."
  })

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY

    if (!apiKey) {
      console.warn('GROQ API key is not configured. Falling back to mock response.')
      return Response.json({
        success: true,
        improved: getMockImprovedGoal()
      })
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
            content: `Review and improve this goal to make it more SMART (Specific, Measurable, Achievable, Relevant, Time-bound):

Current Goal: ${goalTitle || 'Untitled Goal'}
Description: ${goalDescription || 'None'}

Provide JSON with:
{
  "improvedTitle": "better actionable title",
  "improvedDescription": "more specific description with measurable outcome",
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "timelineWeeks": 12,
  "whyBetter": "explanation of why this structure ensures higher success"
}

Return ONLY valid JSON.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    })

    if (!response.ok) {
      console.warn(`Groq API returned ${response.status}. Falling back to mock improved goal.`)
      return Response.json({ success: true, improved: getMockImprovedGoal() })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    const cleanedContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    const improved = jsonMatch ? JSON.parse(jsonMatch[0]) : getMockImprovedGoal()

    return Response.json({ success: true, improved })
  } catch (error) {
    console.error('AI Improve Goal Error:', error)
    return Response.json({ 
      success: true, 
      improved: getMockImprovedGoal() 
    })
  }
}