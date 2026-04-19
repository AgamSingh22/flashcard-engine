import { Sparkles, LayoutGrid, Settings, LogOut, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'

export default function Navbar({ view, setView, onOpenSettings, user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleExit = () => {
    if (view === 'study' || view === 'upload' || view === 'dashboard') {
      setView('classDashboard')
    } else {
      handleSignOut()
    }
  }

  return (
    <nav className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => setView('dashboard')}
        >
          <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-110 transition-transform">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Cuemath Engine
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <button 
            onClick={() => setView('classDashboard')}
            className={`hover:text-white transition-colors flex items-center gap-2 ${view === 'classDashboard' ? 'text-accent-primary' : ''}`}
          >
            <LayoutGrid size={18} /> Dashboard
          </button>
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleExit}
            className="p-2 text-gray-400 hover:text-white transition-colors relative group"
            title={view === 'dashboard' ? 'Sign Out' : 'Back to Dashboard'}
          >
            {view === 'dashboard' ? <LogOut size={20} /> : <ArrowLeft size={20} />}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {view === 'dashboard' ? 'Sign Out' : 'Exit to Dashboard'}
            </span>
          </motion.button>
          
          {user && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary p-[1px] relative cursor-pointer" onClick={onOpenSettings}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-xs font-bold overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.email?.substring(0, 2).toUpperCase() || '??'
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
