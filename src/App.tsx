import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import SubmitPage from './pages/SubmitPage'
import ProfilePage from './pages/ProfilePage'
import SetupGuide from './pages/SetupGuide'
import Navbar from './components/Navbar'

type Page = 'dashboard' | 'submit' | 'profile'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const IS_CONFIGURED = SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [submissionCount, setSubmissionCount] = useState(0)

  const handleCountChange = useCallback((count: number) => {
    setSubmissionCount(count)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">正在加载…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e]">
      {/* Background decorations */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {currentPage === 'dashboard' && (
          <DashboardPage
            onSubmit={() => setCurrentPage('submit')}
            onCountChange={handleCountChange}
          />
        )}
        {currentPage === 'submit' && (
          <SubmitPage
            onSuccess={() => setCurrentPage('dashboard')}
            submissionCount={submissionCount}
          />
        )}
        {currentPage === 'profile' && <ProfilePage />}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-gray-600 text-xs">第五届憋憋杯 · Phigros 自制谱面创作大赛</span>
          <span className="text-gray-700 text-xs">Powered by Supabase + GitHub Pages</span>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [setupDismissed, setSetupDismissed] = useState(false)

  if (!IS_CONFIGURED && !setupDismissed) {
    return <SetupGuide onDismiss={() => setSetupDismissed(true)} />
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
