import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { User, Save, CheckCircle, AlertCircle, Key, Mail } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change
  const [newPw, setNewPw] = useState('')
  const [confirmNewPw, setConfirmNewPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || profile?.username })
      .eq('id', user!.id)

    if (error) {
      setSaveMsg({ type: 'error', text: '保存失败：' + error.message })
    } else {
      await refreshProfile()
      setSaveMsg({ type: 'success', text: '个人资料已更新' })
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (newPw.length < 6) return setPwMsg({ type: 'error', text: '新密码长度至少6位' })
    if (newPw !== confirmNewPw) return setPwMsg({ type: 'error', text: '两次密码不一致' })

    setChangingPw(true)

    const { error } = await supabase.auth.updateUser({ password: newPw })

    if (error) {
      setPwMsg({ type: 'error', text: '密码修改失败：' + error.message })
    } else {
      setPwMsg({ type: 'success', text: '密码已成功修改' })
      setNewPw('')
      setConfirmNewPw('')
    }
    setChangingPw(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">个人资料</h2>
        <p className="text-gray-400 text-sm mt-1">管理你的账号信息</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
          <User size={28} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">{profile?.username}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <p className="text-gray-600 text-xs mt-1">参赛选手 · 第五届憋憋杯</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <User size={16} className="text-purple-400" /> 基本信息
        </h3>

        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">用户名（不可更改）</label>
          <input
            type="text"
            value={profile?.username || ''}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">显示名称</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="你的显示名称"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-1.5 block flex items-center gap-1">
            <Mail size={11} /> 邮箱地址
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        {saveMsg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border
            ${saveMsg.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {saveMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {saveMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {saving
            ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
            : <Save size={15} />
          }
          保存更改
        </button>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Key size={16} className="text-purple-400" /> 修改密码
        </h3>

        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">新密码</label>
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="至少6位"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">确认新密码</label>
          <input
            type="password"
            value={confirmNewPw}
            onChange={e => setConfirmNewPw(e.target.value)}
            placeholder="再次输入新密码"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
        </div>

        {pwMsg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border
            ${pwMsg.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {pwMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {pwMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={changingPw}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {changingPw
            ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
            : <Key size={15} />
          }
          修改密码
        </button>
      </form>
    </div>
  )
}
