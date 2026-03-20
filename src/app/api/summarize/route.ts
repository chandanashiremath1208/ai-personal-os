import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';

export const dynamic = 'force-dynamic';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getVideoMetadata(videoId: string) {
  try {
    // Use oembed API (no API key needed)
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'Unknown Title',
        author: data.author_name || 'Unknown Channel',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch (e) {
    // Fallback silently
  }
  return {
    title: 'YouTube Video',
    author: 'Unknown Channel',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export async function POST(req: Request) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://utube-summarizer.vercel.app/',
      "X-Title": 'AI YouTube Summarizer',
    }
  });

  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Please provide a YouTube URL.' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 500 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL. Please provide a valid link.' }, { status: 400 });
    }

    // Fetch video metadata and transcript in parallel
    const [metadata, transcriptResult] = await Promise.allSettled([
      getVideoMetadata(videoId),
      YoutubeTranscript.fetchTranscript(videoId),
    ]);

    const videoMeta = metadata.status === 'fulfilled' ? metadata.value : {
      title: 'YouTube Video',
      author: 'Unknown Channel',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };

    if (transcriptResult.status === 'rejected') {
      return NextResponse.json({
        error: 'Could not fetch transcript for this video. Make sure the video has captions/subtitles enabled.',
        videoMeta,
      }, { status: 400 });
    }

    const transcriptItems = transcriptResult.value;

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json({ error: 'No transcript available for this video.', videoMeta }, { status: 400 });
    }

    // Combine transcript text
    const fullTranscript = transcriptItems.map((item: any) => item.text).join(' ');

    // Truncate transcript if it's too long
    const maxChars = 25000;
    const truncatedTranscript = fullTranscript.length > maxChars
      ? fullTranscript.substring(0, maxChars) + '... [transcript truncated]'
      : fullTranscript;

    const prompt = `
      You are an expert content summarizer. Analyze the following YouTube video transcript and provide a comprehensive, well-structured summary.

      Your summary should include:
      1. **Overview**: A 2-3 sentence overview of what the video is about.
      2. **Key Points**: The main points or arguments discussed, as bullet points.
      3. **Key Takeaways**: The most important insights or action items.
      4. **Conclusion**: A brief conclusion summarizing the video's message.

      Format your response in clean Markdown. Use headers (##), bold text, and bullet points for readability.

      Transcript:
      ${truncatedTranscript}
    `;

    const completion = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        { role: "system", content: "You are an expert video content summarizer. You provide clear, structured, and insightful summaries in Markdown format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
    });

    const summaryContent = completion.choices[0]?.message?.content || "Could not generate a summary.";

    return NextResponse.json({
      summary: summaryContent,
      videoMeta,
    });

  } catch (error: any) {
    console.error('Error in summarize route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
