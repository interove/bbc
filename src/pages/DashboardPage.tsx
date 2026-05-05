import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  FileArchive, Music, Clock, CheckCircle, XCircle, AlertCircle,
  User, Users, Trophy, Gamepad2, Trash2, Download, RefreshCw, Upload
} from 'lucide-react'

interface Submission {
  id: string
  song_name: string
  composer: string
  charter: string
  difficulty: string
  difficulty_level: number
  track_type: 'regular' | 'entertainment'
  mode: 'solo' | 'collab'
  partner_username: string | null
  file_name: string
  file_size: number
  file_path: string
  notes: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface DashboardPageProps {
  onSubmit: () => void
  onCountChange: (count: number) => void
}

const STATUS_LABELS = {
  pending: { label: '审核中', icon: Clock, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  accepted: { label: '已通过', icon: CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  rejected: { label: '未通过', icon: XCircle, color: 'text-red-400 bg-red-400/10 border-red-400/30' },
}

const DIFF_COLORS: Record<string, string> = {
  EZ: 'bg-green-500/20 text-green-300 border-green-500/40',
  HD: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  IN: 'bg-red-500/20 text-red-300 border-red-500/40',
  AT: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  Legacy: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
}

export default function DashboardPage({ onSubmit, onCountChange }: DashboardPageProps) {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data)
      onCountChange(data.length)
    }
    setLoading(false)
  }, [user, onCountChange])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleDelete = async (submission: Submission) => {
    if (confirmDelete !== submission.id) {
      setConfirmDelete(submission.id)
      return
    }

    setDeletingId(submission.id)
    setConfirmDelete(null)

    // Delete file from storage
    await supabase.storage.from('submissions').remove([submission.file_path])

    // Delete database record
    await supabase.from('submissions').delete().eq('id', submission.id)

    setSubmissions(prev => {
      const updated = prev.filter(s => s.id !== submission.id)
      onCountChange(updated.length)
      return updated
    })
    setDeletingId(null)
  }

  const handleDownload = async (submission: Submission) => {
    const { data } = await supabase.storage
      .from('submissions')
      .createSignedUrl(submission.file_path, 60)

    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = submission.file_name
      a.click()
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">我的投稿</h2>
          <p className="text-gray-400 text-sm mt-1">
            共 {submissions.length}/5 个投稿
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSubmissions}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="刷新"
          >
            <RefreshCw size={16} />
          </button>
          {submissions.length < 5 && (
            <button
              onClick={onSubmit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium transition shadow-lg shadow-purple-600/20"
            >
              <Upload size={15} /> 新增投稿
            </button>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <FileArchive size={32} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">暂无投稿</h3>
          <p className="text-gray-500 text-sm mb-6">上传你的第一个谱面作品，参与第五届憋憋杯！</p>
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium transition shadow-lg shadow-purple-600/20"
          >
            <Upload size={16} /> 立即投稿
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map(submission => {
            const statusInfo = STATUS_LABELS[submission.status]
            const StatusIcon = statusInfo.icon
            const diffColor = DIFF_COLORS[submission.difficulty] || DIFF_COLORS['Legacy']

            return (
              <div
                key={submission.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-bold text-lg leading-tight truncate">{submission.song_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${diffColor}`}>
                        {submission.difficulty} {submission.difficulty_level}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon size={11} /> {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Music size={13} className="text-gray-500" />
                        <span>曲师：{submission.composer}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-gray-500" />
                        <span>谱师：{submission.charter}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* Track badge */}
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border
                        ${submission.track_type === 'regular'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}>
                        {submission.track_type === 'regular'
                          ? <><Trophy size={11} /> 常规赛道</>
                          : <><Gamepad2 size={11} /> 娱乐赛道</>
                        }
                      </span>

                      {/* Mode badge */}
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border
                        ${submission.mode === 'solo'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          : 'bg-green-500/10 border-green-500/30 text-green-300'
                        }`}>
                        {submission.mode === 'solo'
                          ? <><User size={11} /> 单人</>
                          : <><Users size={11} /> 多人 · {submission.partner_username}</>
                        }
                      </span>

                      {/* File info */}
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border bg-white/5 border-white/10 text-gray-400">
                        <FileArchive size={11} /> {submission.file_name} · {formatFileSize(submission.file_size)}
                      </span>
                    </div>

                    {submission.notes && (
                      <p className="text-gray-500 text-xs mt-2 italic">备注：{submission.notes}</p>
                    )}

                    <p className="text-gray-600 text-xs mt-2">
                      提交于 {formatDate(submission.created_at)}
                    </p>
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(submission)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition"
                      title="下载文件"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(submission)}
                      disabled={deletingId === submission.id}
                      className={`p-2 rounded-lg border transition ${
                        confirmDelete === submission.id
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                          : 'bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border-white/10 hover:border-red-500/30'
                      }`}
                      title={confirmDelete === submission.id ? '再次点击确认删除' : '删除投稿'}
                    >
                      {deletingId === submission.id
                        ? <div className="w-[15px] h-[15px] border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <Trash2 size={15} />
                      }
                    </button>
                  </div>
                </div>

                {confirmDelete === submission.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-red-400 text-sm flex items-center gap-1.5">
                      <AlertCircle size={14} /> 确认删除此投稿？此操作不可撤销。
                    </span>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-gray-500 text-sm hover:text-white transition"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
