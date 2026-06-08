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
      console.warn('GROQ API key is not configured. Falling back to mock recommendations.')
      const recommendations = generateMockRecommendations(title, description, category, budget, location)
      return Response.json({ 
        success: true, 
        recommendations,
        raw: JSON.stringify(recommendations)
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

function generateMockRecommendations(
  title?: string,
  description?: string,
  category?: string,
  budget?: string | number | null,
  location?: string
) {
  const normalizedCategory = (category || 'Travel').toLowerCase();
  
  if (title && title.trim().length > 0) {
    const cleanTitle = title.trim();
    return [
      {
        title: `Comprehensive: ${cleanTitle}`,
        why: `Establish a detailed, structured roadmap to fully achieve your goal: "${cleanTitle}". This approach focuses on building long-term habits and tracking progress systematically.`,
        milestones: [
          `Research, set clear milestones, and map out requirements for "${cleanTitle}"`,
          `Set up weekly checkpoints and share your plan with accountability partners`,
          `Dedicate first 30 days to building consistency and solidifying core routines`,
          `Complete 50% milestone and conduct a mid-way progress review`,
          `Final execution phase, celebratory showcase, and reflection on key learnings`
        ],
        timeframe: '3 to 6 months',
        estimatedBudget: budget ? `₹${budget}` : '₹5,000 - ₹15,000'
      },
      {
        title: `Accelerated: ${cleanTitle} (Express)`,
        why: `A high-intensity, sprint-based approach to fast-track "${cleanTitle}". Designed for high focus and quick wins.`,
        milestones: [
          `Determine critical path actions and eliminate non-essential distractions`,
          `Complete first major milestone in an intensive 2-week sprint`,
          `Achieve 80% completion through daily deep-focus sessions`,
          `Final push to cross the finish line and log achievement`
        ],
        timeframe: '4 to 6 weeks',
        estimatedBudget: budget ? `₹${budget}` : '₹2,000 - ₹5,000'
      },
      {
        title: `Mindful: ${cleanTitle} (Lifestyle Integrated)`,
        why: `Integrate "${cleanTitle}" smoothly into your daily routine without causing burnout. Emphasizes steady, daily micro-habits.`,
        milestones: [
          `Identify small, 15-minute daily actions aligned with "${cleanTitle}"`,
          `Maintain a 21-day streak tracker to solidify the micro-habit`,
          `Progressively scale up daily effort as confidence builds`,
          `Reflect on personal growth, mindset shifts, and new routines established`
        ],
        timeframe: '6 to 12 months',
        estimatedBudget: budget ? `₹${budget}` : 'Minimal budget'
      }
    ];
  }

  if (normalizedCategory === 'skills') {
    return [
      {
        title: 'Master Modern Web Development',
        why: 'Acquire high-income, in-demand technical skills to build full-stack web applications and launch a tech career.',
        milestones: [
          'Learn HTML, CSS, JavaScript fundamentals & DOM manipulation',
          'Build 3 responsive landing pages and publish them to GitHub',
          'Learn React.js, component architecture, and state management',
          'Create a full-stack Next.js app with database integration',
          'Deploy your personal developer portfolio site and resume'
        ],
        timeframe: '3 to 6 months',
        estimatedBudget: '₹1,500'
      },
      {
        title: 'Learn Public Speaking and Debate',
        why: 'Overcome the fear of speaking, improve articulation, and boost professional presence.',
        milestones: [
          'Record and critique yourself giving 3 short speeches',
          'Join a local Toastmasters club or debate group',
          'Practice structuring speeches using storytelling frameworks',
          'Deliver a 10-minute presentation to a live audience',
          'Host a group meeting or workshop to apply your skills'
        ],
        timeframe: '2 to 3 months',
        estimatedBudget: '₹2,500'
      },
      {
        title: 'Conversational Language Proficiency',
        why: 'Unlock travel opportunities, improve cognitive agility, and connect with people from other cultures.',
        milestones: [
          'Build a 1000-word vocabulary using daily flashcards',
          'Complete a structured 60-day language program',
          'Have a 15-minute conversation with a native speaker',
          'Read a children\'s book and watch a movie in the target language',
          'Maintain a daily journaling streak in the target language'
        ],
        timeframe: '6 months',
        estimatedBudget: '₹3,000'
      }
    ];
  } else if (normalizedCategory === 'health') {
    return [
      {
        title: 'Train for a 10K Run',
        why: 'Build cardiovascular endurance, mental toughness, and a consistent physical training habit.',
        milestones: [
          'Establish a baseline by running 2K without stopping',
          'Follow a structured 8-week Couch to 10K running plan',
          'Incorporate 2 days of strength/mobility training per week',
          'Complete a 7K training run and practice pacing strategies',
          'Race day! Complete a local 10K run under target time'
        ],
        timeframe: '8 to 12 weeks',
        estimatedBudget: '₹2,000'
      },
      {
        title: 'Establish a Whole-Food Nutrition Plan',
        why: 'Improve energy levels, optimize physical health, and build sustainable healthy cooking habits.',
        milestones: [
          'Track current meals and identify areas for healthy replacements',
          'Meal prep healthy lunches every Sunday for 4 consecutive weeks',
          'Replace processed snacks with nuts, fruits, and whole foods',
          'Learn to cook 5 high-protein, nutrient-dense signature dishes',
          'Maintain balanced nutrition with consistent energy levels for 60 days'
        ],
        timeframe: '2 months',
        estimatedBudget: '₹4,000/month'
      },
      {
        title: 'Consistent Daily Mindfulness & Yoga',
        why: 'Reduce chronic stress, increase physical flexibility, and improve overall mental wellbeing.',
        milestones: [
          'Meditate for 5 minutes every morning for 14 straight days',
          'Learn 10 basic yoga sequences and correct breathing patterns',
          'Increase mindfulness practice to 15 minutes daily',
          'Attend a yoga class/workshop or complete a 30-day online challenge',
          'Establish a reliable daily routine for body-mind recovery'
        ],
        timeframe: '3 months',
        estimatedBudget: '₹1,000'
      }
    ];
  } else if (normalizedCategory === 'adventure') {
    return [
      {
        title: 'Climb a Mountain Peak',
        why: 'Experience stunning high-altitude nature, challenge physical endurance, and build summit resiliency.',
        milestones: [
          'Begin a daily cardio and leg-strength conditioning routine',
          'Complete a weekend trek of at least 1,500m elevation gain',
          'Acquire appropriate hiking gear and learn basic alpine navigation',
          'Join an organized expedition team for safety and logistics',
          'Summit the peak and celebrate your achievement safely'
        ],
        timeframe: '4 to 6 months',
        estimatedBudget: '₹15,000 - ₹30,000'
      },
      {
        title: 'Learn Scuba Diving (PADI Certification)',
        why: 'Explore marine biodiversity and unlock the ability to dive anywhere in the world.',
        milestones: [
          'Complete the theoretical PADI e-learning coursework online',
          'Complete pool training modules with a certified instructor',
          'Perform 4 open-water training dives at a coastal destination',
          'Receive PADI Open Water Diver certification card',
          'Log your first post-certification recreational dive'
        ],
        timeframe: '2 to 3 months',
        estimatedBudget: '₹25,000 - ₹35,000'
      },
      {
        title: 'Bicycle Touring (200km Trip)',
        why: 'Combine adventure travel, low-impact exercise, and outdoor exploration over a multi-day journey.',
        milestones: [
          'Select/upgrade a reliable touring bike and pannier bags',
          'Complete a 50km training ride carrying loaded bags',
          'Map out the 200km route, campsite/hotel stops, and food supply points',
          'Do an overnight test trip to verify gear configuration',
          'Complete the 200km tour over 3 days'
        ],
        timeframe: '3 months',
        estimatedBudget: '₹8,000'
      }
    ];
  } else if (normalizedCategory === 'personal') {
    return [
      {
        title: 'Read 24 Books This Year',
        why: 'Expand vocabulary, absorb diverse ideas, and replace screen time with deep focus reading.',
        milestones: [
          'Create a reading list of 24 books across 4 different genres',
          'Establish a habit of reading 20 pages every single night',
          'Complete 6 books and write brief summaries in a journal',
          'Reach the halfway mark of 12 books completed',
          'Achieve the 24 books milestone and share your top 5 recommendations'
        ],
        timeframe: '12 months',
        estimatedBudget: '₹3,000'
      },
      {
        title: 'Financial Independence Blueprint (Save ₹1 Lakh)',
        why: 'Build a safety net, reduce financial stress, and establish robust savings habits.',
        milestones: [
          'Create a comprehensive monthly budget tracking income/expenses',
          'Cut down non-essential subscription services and dine-out costs',
          'Automate a transfer of ₹15,000 to a separate savings account monthly',
          'Reach ₹50,000 saved and explore safe mutual fund investments',
          'Reach the target of ₹1,00,000 saved'
        ],
        timeframe: '6 to 8 months',
        estimatedBudget: '₹0'
      },
      {
        title: 'Declutter and Minimalize Living Space',
        why: 'Create a calming home environment, reduce decision fatigue, and practice mindful consumption.',
        milestones: [
          'Declutter your wardrobe using the one-year-unworn donate rule',
          'Organize all digital files, cloud storage, and email accounts',
          'Clear all surface areas (tables, counters, desks) of junk',
          'Implement a one-in-one-out purchasing policy',
          'Establish a daily 5-minute reset routine to keep spaces tidy'
        ],
        timeframe: '1 month',
        estimatedBudget: '₹0'
      }
    ];
  } else {
    return [
      {
        title: 'Visit Tokyo, Kyoto & Osaka (10-Day Journey)',
        why: 'Experience the perfect blend of futuristic cityscapes, traditional shrines, and world-class cuisine.',
        milestones: [
          'Create a day-by-day itinerary and estimate total travel costs',
          'Apply for a visa and book round-trip flight tickets',
          'Secure accommodations in Tokyo, Kyoto, and Osaka',
          'Buy a Japan Rail Pass and book themed attractions',
          'Embark on the trip and experience the bullet train journey'
        ],
        timeframe: '6 months',
        estimatedBudget: '₹1,50,000 - ₹2,00,000'
      },
      {
        title: 'Backpacking in Himachal Pradesh',
        why: 'Discover breath-taking Himalayan views, ancient culture, and experience off-grid peacefulness.',
        milestones: [
          'Map out a route covering Dharamshala, Kasol, and Manali',
          'Purchase backpacking gear (rucksack, rain jacket, trekking poles)',
          'Book sleeper bus/train tickets to the base station',
          'Complete the Triund trek and camp under the stars overnight',
          'Document the journey and share travel tips with fellow bucket-listers'
        ],
        timeframe: '3 months',
        estimatedBudget: '₹15,000 - ₹25,000'
      },
      {
        title: 'Solo Trip to a New Country',
        why: 'Step outside your comfort zone, foster independence, and experience cultural immersion.',
        milestones: [
          'Research visa-on-arrival destinations and pick one country',
          'Learn 20 basic phrases in the local language',
          'Set up multi-currency cards and emergency contact travel info',
          'Arrive at the destination and complete a solo walking tour',
          'Share your reflection about solo travel growth in your profile'
        ],
        timeframe: '4 to 6 months',
        estimatedBudget: '₹80,000 - ₹1,20,000'
      }
    ];
  }
}