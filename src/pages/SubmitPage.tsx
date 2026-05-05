import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Upload, Music, FileArchive, User, Users, Trophy, Gamepad2,
  CheckCircle, AlertCircle, X, Info
} from 'lucide-react'

interface SubmitPageProps {
  onSuccess: () => void
  submissionCount: number
}

const DIFFICULTIES = ['EZ', 'HD', 'IN', 'AT', 'Legacy']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function SubmitPage({ onSuccess, submissionCount }: SubmitPageProps) {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [songName, setSongName] = useState('')
  const [composer, setComposer] = useState('')
  const [charter, setCharter] = useState('')
  const [difficulty, setDifficulty] = useState('IN')
  const [difficultyLevel, setDifficultyLevel] = useState<number | ''>('')
  const [trackType, setTrackType] = useState<'regular' | 'entertainment'>('regular')
  const [mode, setMode] = useState<'solo' | 'collab'>('solo')
  const [partnerUsername, setPartnerUsername] = useState('')
  const [partnerSearchLoading, setPartnerSearchLoading] = useState(false)
  const [partnerFound, setPartnerFound] = useState<{ id: string; username: string } | null>(null)
  const [partnerError, setPartnerError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const canSubmit = submissionCount < 5

  const handleFileSelect = (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase()
    if (!name.endsWith('.pez') && !name.endsWith('.zip')) {
      setError('只接受 .pez 或 .zip 格式的文件')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('文件大小不能超过 100MB')
      return
    }
    setFile(selectedFile)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  const searchPartner = async () => {
    if (!partnerUsername.trim()) return
    if (partnerUsername.toLowerCase() === profile?.username?.toLowerCase()) {
      setPartnerError('不能选择自己作为合作伙伴')
      setPartnerFound(null)
      return
    }
    setPartnerSearchLoading(true)
    setPartnerError(null)
    setPartnerFound(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', partnerUsername.trim())
      .single()

    setPartnerSearchLoading(false)
    if (error || !data) {
      setPartnerError('未找到该用户，请确认用户名是否正确')
    } else {
      setPartnerFound(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return setError('你已达到最大投稿数量（5个）')
    if (!file) return setError('请上传谱面文件（.pez 或 .zip）')
    if (!songName.trim()) return setError('请填写曲目名称')
    if (!composer.trim()) return setError('请填写曲师名称')
    if (!charter.trim()) return setError('请填写谱师名称')
    if (difficultyLevel === '' || isNaN(Number(difficultyLevel))) return setError('请填写难度等级')
    if (mode === 'collab' && !partnerFound) return setError('多人模式需要选择合作伙伴')

    setUploading(true)
    setError(null)

    try {
      // Upload file to Supabase Storage
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${user!.id}/${Date.now()}_${safeName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error('文件上传失败: ' + uploadError.message)

      // Insert submission record
      const { error: insertError } = await supabase.from('submissions').insert({
        user_id: user!.id,
        username: profile!.username,
        song_name: songName.trim(),
        composer: composer.trim(),
        charter: charter.trim(),
        difficulty,
        difficulty_level: Number(difficultyLevel),
        track_type: trackType,
        mode,
        partner_username: mode === 'collab' ? partnerFound?.username || null : null,
        partner_user_id: mode === 'collab' ? partnerFound?.id || null : null,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        notes: notes.trim() || null,
        status: 'pending',
      })

      if (insertError) {
        // Cleanup uploaded file if insert fails
        await supabase.storage.from('submissions').remove([filePath])
        throw new Error('投稿信息保存失败: ' + insertError.message)
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">投稿成功！</h2>
        <p className="text-gray-400">你的谱面已成功提交，正在跳转到投稿列表…</p>
      </div>
    )
  }

  if (!canSubmit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4">
          <AlertCircle size={36} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">已达投稿上限</h2>
        <p className="text-gray-400">每人最多可投稿 5 个谱面，你已达到上限。</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">上传投稿</h2>
        <p className="text-gray-400 mt-1 text-sm">
          本届大赛每人最多投稿 5 个谱面，当前已投稿 {submissionCount} 个
        </p>
        {/* Quota bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${(submissionCount / 5) * 100}%` }}
            />
          </div>
          <span className="text-gray-400 text-xs">{submissionCount}/5</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
            ${dragOver ? 'border-purple-400 bg-purple-500/10' : file ? 'border-green-500/50 bg-green-500/5 cursor-default' : 'border-white/15 hover:border-purple-500/50 hover:bg-purple-500/5'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pez,.zip"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                  <FileArchive size={22} className="text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm truncate max-w-[240px]">{file.name}</p>
                  <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto mb-3">
                <Upload size={24} className="text-purple-400" />
              </div>
              <p className="text-white font-medium">拖拽文件到此处，或点击选择文件</p>
              <p className="text-gray-500 text-sm mt-1">支持 .pez 或 .zip 格式，最大 100MB</p>
              <div className="mt-3 flex items-center justify-center gap-1 text-gray-600 text-xs">
                <Info size={11} />
                <span>文件内应包含 info.txt、音频文件（.mp3 等）和封面图（.png 等）</span>
              </div>
            </>
          )}
        </div>

        {/* Song Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Music size={16} className="text-purple-400" /> 谱面信息
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">曲目名称 *</label>
              <input
                type="text"
                value={songName}
                onChange={e => setSongName(e.target.value)}
                placeholder="歌曲名"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">曲师 *</label>
              <input
                type="text"
                value={composer}
                onChange={e => setComposer(e.target.value)}
                placeholder="作曲家 / 音乐人"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">谱师 *</label>
              <input
                type="text"
                value={charter}
                onChange={e => setCharter(e.target.value)}
                placeholder="制谱人"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">难度等级 *</label>
              <input
                type="number"
                value={difficultyLevel}
                onChange={e => setDifficultyLevel(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="如：15"
                min={1}
                max={20}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          {/* Difficulty selector */}
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">难度标签 *</label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${difficulty === d
                      ? d === 'EZ' ? 'bg-green-500/20 border-green-500/50 text-green-300'
                        : d === 'HD' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : d === 'IN' ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : d === 'AT' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-gray-500/20 border-gray-500/50 text-gray-300'
                      : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Track Type */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Trophy size={16} className="text-purple-400" /> 参赛赛道
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTrackType('regular')}
              className={`p-4 rounded-xl border text-left transition-all
                ${trackType === 'regular' ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <Trophy size={20} className={trackType === 'regular' ? 'text-purple-400 mb-2' : 'text-gray-500 mb-2'} />
              <p className={`font-semibold text-sm ${trackType === 'regular' ? 'text-white' : 'text-gray-400'}`}>常规赛道</p>
              <p className="text-gray-500 text-xs mt-1">正式竞技，角逐最终大奖</p>
            </button>
            <button
              type="button"
              onClick={() => setTrackType('entertainment')}
              className={`p-4 rounded-xl border text-left transition-all
                ${trackType === 'entertainment' ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <Gamepad2 size={20} className={trackType === 'entertainment' ? 'text-amber-400 mb-2' : 'text-gray-500 mb-2'} />
              <p className={`font-semibold text-sm ${trackType === 'entertainment' ? 'text-white' : 'text-gray-400'}`}>娱乐赛道</p>
              <p className="text-gray-500 text-xs mt-1">轻松参与，享受创作乐趣</p>
            </button>
          </div>
        </div>

        {/* Mode */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Users size={16} className="text-purple-400" /> 参赛模式
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setMode('solo'); setPartnerFound(null); setPartnerError(null) }}
              className={`p-4 rounded-xl border text-left transition-all
                ${mode === 'solo' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <User size={20} className={mode === 'solo' ? 'text-blue-400 mb-2' : 'text-gray-500 mb-2'} />
              <p className={`font-semibold text-sm ${mode === 'solo' ? 'text-white' : 'text-gray-400'}`}>单人模式</p>
              <p className="text-gray-500 text-xs mt-1">独立完成谱面创作</p>
            </button>
            <button
              type="button"
              onClick={() => setMode('collab')}
              className={`p-4 rounded-xl border text-left transition-all
                ${mode === 'collab' ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <Users size={20} className={mode === 'collab' ? 'text-green-400 mb-2' : 'text-gray-500 mb-2'} />
              <p className={`font-semibold text-sm ${mode === 'collab' ? 'text-white' : 'text-gray-400'}`}>多人模式</p>
              <p className="text-gray-500 text-xs mt-1">与合作伙伴共同创作</p>
            </button>
          </div>

          {/* Partner search */}
          {mode === 'collab' && (
            <div className="pt-2 border-t border-white/10">
              <label className="text-gray-400 text-xs mb-2 block">搜索合作伙伴（输入对方用户名）*</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerUsername}
                  onChange={e => { setPartnerUsername(e.target.value); setPartnerFound(null); setPartnerError(null) }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchPartner())}
                  placeholder="合作伙伴用户名"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={searchPartner}
                  disabled={partnerSearchLoading}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition"
                >
                  {partnerSearchLoading ? '搜索中…' : '搜索'}
                </button>
              </div>
              {partnerError && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {partnerError}
                </p>
              )}
              {partnerFound && (
                <div className="mt-2 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-green-300 text-sm">找到用户：<strong>{partnerFound.username}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <label className="text-gray-400 text-xs mb-2 block">备注（可选）</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="对本次投稿的补充说明……"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !canSubmit}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              上传中…
            </>
          ) : (
            <>
              <Upload size={18} />
              提交投稿
            </>
          )}
        </button>
      </form>
    </div>
  )
}
