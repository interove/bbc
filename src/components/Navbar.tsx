import { useState } from 'react'
import { Music2, LogOut, User, ChevronDown, LayoutDashboard, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  currentPage: 'dashboard' | 'submit' | 'profile'
  setCurrentPage: (page: 'dashboard' | 'submit' | 'profile') => void
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const { profile, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Music2 size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-none block">憋憋杯</span>
            <span className="text-purple-400 text-[10px] leading-none">第五届</span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
              ${currentPage === 'dashboard' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={15} /> 我的投稿
          </button>
          <button
            onClick={() => setCurrentPage('submit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
              ${currentPage === 'submit' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Upload size={15} /> 上传投稿
          </button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-white text-sm font-medium hidden sm:block max-w-[120px] truncate">
              {profile?.username || '加载中…'}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-white font-medium text-sm truncate">{profile?.username}</p>
                <p className="text-gray-500 text-xs">参赛选手</p>
              </div>
              <button
                onClick={() => { setCurrentPage('dashboard'); setDropdownOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition sm:hidden"
              >
                <LayoutDashboard size={14} /> 我的投稿
              </button>
              <button
                onClick={() => { setCurrentPage('submit'); setDropdownOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition sm:hidden"
              >
                <Upload size={14} /> 上传投稿
              </button>
              <button
                onClick={() => { setCurrentPage('profile'); setDropdownOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                <User size={14} /> 个人资料
              </button>
              <div className="border-t border-white/10">
                <button
                  onClick={() => { signOut(); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                >
                  <LogOut size={14} /> 退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
