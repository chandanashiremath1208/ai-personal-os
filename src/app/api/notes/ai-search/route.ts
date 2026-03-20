import { NextResponse } from 'next/server'
import { createClient } from '@utils/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

    // 1. Fetch all notes for the user
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, content')
      .eq('user_id', user.id)

    if (notesError) return NextResponse.json({ error: notesError.message }, { status: 500 })
    if (!notes || notes.length === 0) {
      return NextResponse.json({ answer: "I couldn't find any notes to search through. Try creating some first!", results: [] })
    }

    // 2. Prepare context for AI
    const notesContext = notes.map(n => `ID: ${n.id}\nTitle: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n')

    const prompt = `
You are an AI assistant for a Personal OS. The user is searching through their private notes.
Below is a list of their notes. Your task is to answer the user's question based ONLY on the content of these notes.

If the information is not in the notes, say you don't know and suggest what they might want to add.
If you find the answer, specify which note(s) it came from by referring to their titles.

USER QUESTION: "${query}"

USER'S NOTES:
${notesContext}

Return a concise answer in Markdown. Also return a list of Note IDs that are most relevant to this query.
    `

    const response = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        { role: "system", content: "You are a helpful assistant that searches through user notes." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    // Note: Requesting JSON from openrouter auto might be tricky if it doesn't support it strictly,
    // so let's adjust the prompt to ensure it's a good response.
    // Actually, let's just use standard text completion for better compatibility and parse manually if needed.
    
    // Changing approach to simple completion + heuristic matching
    const completion = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        { role: "system", content: "You are a helpful assistant that searches through user notes. Answer the question based on the notes provided." },
        { role: "user", content: prompt }
      ],
    })

    const answer = completion.choices[0]?.message?.content || ""
    
    // Heuristic: Find Note IDs mentioned in the answer or context
    const mentionedIds = notes.filter(n => answer.includes(n.title) || answer.includes(n.id)).map(n => n.id)

    return NextResponse.json({ answer, mentionedIds })

  } catch (error: any) {
    console.error('AI Note Search Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
