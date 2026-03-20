import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://utube-summarizer.vercel.app/',
      "X-Title": 'AI Personal OS - Research',
    }
  })

  try {
    const body = await req.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a research question.' }, { status: 400 })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 500 })
    }

    const sanitizedQuery = query.trim().substring(0, 1000)

    const prompt = `
You are an AI research assistant. The user is asking a research question. Provide a thorough, well-researched answer.

Your response must follow this exact structure:

## Answer
Provide a comprehensive answer to the question with detailed explanations.

## Key Facts
- List the most important facts as bullet points
- Each fact should be concise and informative
- Include 4-6 key facts

## Sources & References
Provide credible sources that would contain information about this topic. Format each as:
- **[Source Name]** - Brief description of what information can be found (URL if applicable)

Include 3-5 relevant sources.

## Further Reading
Suggest 2-3 related topics the user might want to explore next.

Format everything in clean Markdown with proper headers, bold text, and bullet points.

Question: ${sanitizedQuery}
    `

    const completion = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "You are an expert research assistant. You provide thorough, accurate, and well-sourced answers to questions. Always structure your responses clearly with headers and bullet points. Cite sources when possible."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
    })

    const answer = completion.choices[0]?.message?.content || "Could not generate an answer."

    return NextResponse.json({ answer, query: sanitizedQuery })

  } catch (error: any) {
    console.error('Error in research route:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
