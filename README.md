# AI Personal OS 🚀

A comprehensive, unified workspace powered by AI, featuring a YouTube Summarizer, Notes App with AI search, and a deep Research Tool.

![Preview](file:///C:/Users/ADMIN/.gemini/antigravity/brain/4302a12d-13ec-498d-b701-ae01ffae4aee/final_dashboard_check_1773736511397.webp)

## ✨ Features

- 📺 **YouTube Summarizer**: Get instant, well-structured summaries of any YouTube video. Save directly to your notes.
- 📝 **AI Notes**: Manage your personal knowledge with a full CRUD system. Use **AI Insight** to query your notes using natural language.
- 🔍 **AI Research**: Conduct deep research on any topic with structured answers and cited sources.
- 📊 **Admin Dashboard**: Platform-wide analytics and usage tracking.
- 🌓 **Modern UI**: Professionally designed sidebar, responsive layouts, and smooth micro-animations.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database/Auth**: Supabase
- **AI Engine**: OpenRouter (Auto Model)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Supabase Account](https://supabase.com/)
- [OpenRouter API Key](https://openrouter.ai/)

### 2. Setup Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_key
```

### 3. Database Schema
Run the following SQL in your Supabase SQL Editor to create the notes table:

```sql
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Install and Run
```bash
npm install
npm run dev
```

## 🌐 Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub.
2. Link your repository to a new project on Vercel.
3. Add the three Environment Variables from `.env.local` in the Vercel Dashboard.
4. Deploy!

## 📜 License
MIT
