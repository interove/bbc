import { useState } from 'react'
import { Database, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Music2 } from 'lucide-react'

const SQL_SETUP = `-- Run this in Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  song_name TEXT NOT NULL,
  composer TEXT NOT NULL,
  charter TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'IN',
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  track_type TEXT NOT NULL DEFAULT 'regular' CHECK (track_type IN ('regular', 'entertainment')),
  mode TEXT NOT NULL DEFAULT 'solo' CHECK (mode IN ('solo', 'collab')),
  partner_username TEXT,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Submissions policies
CREATE POLICY "Users can view their own submissions"
  ON public.submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions"
  ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions"
  ON public.submissions FOR DELETE USING (auth.uid() = user_id);

-- 6. Storage bucket policy (run after creating bucket named 'submissions')
-- In Supabase Dashboard > Storage > submissions bucket > Policies:
-- Add policy: Authenticated users can upload to their own folder
-- Add policy: Users can read/delete their own files`

const ENV_EXAMPLE = `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`

export default function SetupGuide({ onDismiss }: { onDismiss: () => void }) {
  const [copiedSQL, setCopiedSQL] = useState(false)
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const copy = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e] flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-3 shadow-lg shadow-purple-500/30">
            <Music2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">憋憋杯 · 第五届</h1>
          <p className="text-amber-400 text-sm mt-1 flex items-center justify-center gap-1">
            ⚠️ 需要配置 Supabase 才能使用
          </p>
        </div>

        <div className="bg-white/5 border border-amber-500/30 rounded-2xl overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition"
          >
            <span className="text-white font-semibold flex items-center gap-2">
              <Database size={16} className="text-amber-400" />
              Supabase 配置指南
            </span>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expanded && (
            <div className="px-5 pb-5 space-y-5 border-t border-white/10">
              <div className="space-y-2 pt-4">
                <h3 className="text-white font-medium text-sm">Step 1：创建 Supabase 项目</h3>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm transition"
                >
                  前往 supabase.com 注册并创建项目 <ExternalLink size={12} />
                </a>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium text-sm">Step 2：创建存储桶</h3>
                <p className="text-gray-400 text-sm">在 Supabase Dashboard → Storage → New bucket，命名为 <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">submissions</code>，设为 <strong className="text-white">Private</strong></p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium text-sm">Step 3：执行 SQL 初始化</h3>
                <p className="text-gray-400 text-sm">在 Supabase Dashboard → SQL Editor 中执行以下 SQL：</p>
                <div className="relative">
                  <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-300 overflow-auto max-h-48 font-mono">{SQL_SETUP}</pre>
                  <button
                    onClick={() => copy(SQL_SETUP, setCopiedSQL)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition"
                  >
                    {copiedSQL ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium text-sm">Step 4：Storage 策略</h3>
                <p className="text-gray-400 text-sm">前往 Storage → submissions → Policies，添加以下策略：</p>
                <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside pl-1">
                  <li>允许已登录用户上传：<code className="bg-white/10 px-1 rounded text-xs">INSERT</code>（检查 <code className="bg-white/10 px-1 rounded text-xs">auth.uid()::text = (storage.foldername(name))[1]</code>）</li>
                  <li>允许已登录用户读取自己的文件：<code className="bg-white/10 px-1 rounded text-xs">SELECT</code></li>
                  <li>允许已登录用户删除自己的文件：<code className="bg-white/10 px-1 rounded text-xs">DELETE</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium text-sm">Step 5：配置环境变量</h3>
                <p className="text-gray-400 text-sm">在项目根目录创建 <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">.env</code> 文件：</p>
                <div className="relative">
                  <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-300 font-mono">{ENV_EXAMPLE}</pre>
                  <button
                    onClick={() => copy(ENV_EXAMPLE, setCopiedEnv)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition"
                  >
                    {copiedEnv ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs">在 Supabase Dashboard → Settings → API 中获取 URL 和 anon key</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium text-sm">Step 6：GitHub Pages 部署</h3>
                <p className="text-gray-400 text-sm">在 GitHub repo → Settings → Secrets → Actions 中添加 <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">VITE_SUPABASE_URL</code> 和 <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">VITE_SUPABASE_ANON_KEY</code></p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-300 text-sm transition"
          >
            我已配置完成，继续使用 →
          </button>
        </div>
      </div>
    </div>
  )
}
