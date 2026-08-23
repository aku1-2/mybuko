export const runtime = 'nodejs'

export async function POST(req: Request) {
  let goalTitle = ''
  let currentProgress = 0
  let lastUpdate = ''
  let daysActive = 1

  try {
    const body = await req.json()
    goalTitle = body.goalTitle || 'My Goal'
    currentProgress = body.currentProgress || 0
    lastUpdate = body.lastUpdate || 'Today'
    daysActive = body.daysActive || 1
  } catch (parseErr) {
    console.warn('Error parsing request body:', parseErr)
  }

  const getMockTips = () => `### Progress Analysis
You are doing great! With **${currentProgress}%** progress over **${daysActive}** active days on **"${goalTitle}"**, you are building real momentum. The key is consistent execution.

### Recommended Next Steps
1. **Focus on the next milestone**: Pick your closest unchecked milestone and dedicate 30 focused minutes today.
2. **Review your timeline**: Keep your target date realistic and break larger tasks into sub-steps.
3. **Share your progress**: Log a quick milestone update to keep accountability strong.

### Motivational Quote
> "Success is the sum of small efforts, repeated day in and day out." — Robert Collier

### Potential Obstacles
* **Loss of Motivation**: Prevent this by celebrating small wins along the way.
* **Time Crunch**: Allocate a non-negotiable 15-minute daily focus window.`

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY

    if (!apiKey) {
      console.warn('GROQ API key is not configured. Falling back to mock tips.')
      return Response.json({ 
        success: true, 
        tips: getMockTips()
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
            content: `You are a supportive goal achievement coach.

Goal: ${goalTitle}
Progress: ${currentProgress}%
Days Active: ${daysActive}
Last Updated: ${lastUpdate}

Provide markdown with:
### Progress Analysis
(encouraging analysis)

### Recommended Next Steps
(3 specific next steps)

### Motivational Quote
(1 quote)

### Potential Obstacles
(2 obstacles and how to overcome them)

Keep it concise and action-oriented!`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      })
    })

    if (!response.ok) {
      console.warn(`Groq API returned ${response.status}. Falling back to mock tips.`)
      return Response.json({ success: true, tips: getMockTips() })
    }

    const data = await response.json()
    const tips = data.choices?.[0]?.message?.content || getMockTips()

    return Response.json({ success: true, tips })
  } catch (error) {
    console.error('AI Progress Tips Error:', error)
    return Response.json({ 
      success: true, 
      tips: getMockTips()
    })
  }
}