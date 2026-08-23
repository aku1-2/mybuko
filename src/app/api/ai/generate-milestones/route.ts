export const runtime = 'nodejs'

export async function POST(req: Request) {
  let goalTitle = ''
  let goalDescription = ''
  let targetDate = ''

  try {
    const body = await req.json()
    goalTitle = body.goalTitle || ''
    goalDescription = body.goalDescription || ''
    targetDate = body.targetDate || ''
  } catch (parseErr) {
    console.warn('Error parsing request body:', parseErr)
  }

  const getMockMilestones = () => [
    { title: `Define requirements and roadmap for "${goalTitle || 'Goal'}"`, description: "Research the tools, resources, and steps needed.", percentage: 20, actions: ["Search online for guides", "Make a checklist of resources"] },
    { title: "Initiate daily consistency habit", description: "Establish a fixed time slot daily to work on it.", percentage: 40, actions: ["Block calendar", "Set daily reminder"] },
    { title: "Mid-way progress checkpoint", description: "Assess initial output and refine techniques.", percentage: 60, actions: ["Write self-reflection notes", "Fix bottleneck areas"] },
    { title: "Advanced implementation phase", description: "Scale up speed and quality.", percentage: 80, actions: ["Complete the complex parts", "Get peer feedback"] },
    { title: "Final achievement & celebration", description: "Complete all final items and log in MyBuko.", percentage: 100, actions: ["Verify completion", "Share story with the preview community"] }
  ]

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY

    if (!apiKey) {
      console.warn('GROQ API key is not configured. Falling back to mock milestones.')
      return Response.json({ 
        success: true, 
        milestones: getMockMilestones()
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
            content: `Create a detailed milestone roadmap for this goal:

Goal: ${goalTitle || 'Untitled Goal'}
Description: ${goalDescription || 'None'}
Target Date: ${targetDate || 'Flexible'}

Generate 5 specific, measurable milestones with:
- title: string
- description: string
- percentage: number (20, 40, 60, 80, 100)
- actions: array of strings

Format as a valid JSON array: [{"title": "...", "description": "...", "percentage": 20, "actions": ["..."]}]`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })
    })

    if (!response.ok) {
      console.warn(`Groq API returned ${response.status}. Falling back to mock milestones.`)
      return Response.json({ success: true, milestones: getMockMilestones() })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    const cleanedContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/)
    const milestones = jsonMatch ? JSON.parse(jsonMatch[0]) : getMockMilestones()

    return Response.json({ 
      success: true, 
      milestones: Array.isArray(milestones) && milestones.length > 0 ? milestones : getMockMilestones()
    })
  } catch (error) {
    console.error('AI Generate Milestones Error:', error)
    return Response.json({ 
      success: true, 
      milestones: getMockMilestones()
    })
  }
}