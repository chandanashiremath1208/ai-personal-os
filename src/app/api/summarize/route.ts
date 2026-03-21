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

    // Fetch video metadata and transcript
    const metadata = await getVideoMetadata(videoId);
    const videoMeta = metadata;

    let transcriptText = '';
    let transcriptError = null;

    // --- ROBUST TRANSCRIPT FETCHING LOGIC ---
    try {
      // Method 1: Try the library first (it might still work on some Vercel regions)
      const items = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = items.map(i => i.text).join(' ');
    } catch (e: any) {
      console.warn(`Standard library failed for ${videoId}, trying browser-mimic fallback...`);
      
      try {
        // Method 2: Manual scraping mimic (mimics a real browser request)
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        
        const html = await response.text();
        
        // Search for the caption tracks in the page's initial data
        const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (playerResponseMatch) {
          const playerResponse = JSON.parse(playerResponseMatch[1]);
          const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          
          if (tracks && tracks.length > 0) {
            // Prefer English or the first one available
            const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
            const transcriptResponse = await fetch(track.baseUrl);
            const transcriptXml = await transcriptResponse.text();
            
            // Simple regex to extract text from <text> tags in the XML
            const textMatches = transcriptXml.matchAll(/<text.+?>(.+?)<\/text>/g);
            const lines = [];
            for (const match of textMatches) {
              // Decode basic entities
              lines.push(match[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
              );
            }
            transcriptText = lines.join(' ');
          }
        }
      } catch (fallbackError: any) {
        transcriptError = fallbackError.message;
        console.error('All transcript fetch methods failed:', transcriptError);
      }
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json({
        error: `Could not fetch transcript. This video might not have captions enabled or YouTube is blocking our server. Please try a different video or try again later.`,
        videoMeta,
      }, { status: 400 });
    }

    // Combine transcript text (already combined in the logic above)
    const fullTranscript = transcriptText;


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
