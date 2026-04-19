import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Sun, Monitor, User, Shield, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SettingsModal({ isOpen, onClose, user }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-2xl relative z-10 overflow-hidden flex flex-col md:flex-row min-h-[500px]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col gap-2">
              <h2 className="text-xl font-bold mb-4 px-2">Settings</h2>
              <button className="flex items-center gap-3 px-4 py-2 bg-accent-primary/20 text-accent-primary rounded-xl font-medium text-left">
                <User size={18} /> General
              </button>
              <button className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-left">
                <Shield size={18} /> Security
              </button>
              <button className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-left">
                <Bell size={18} /> Notifications
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-8">
                {/* Theme Section */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Appearance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' },
                      { id: 'dark', icon: Moon, label: 'Dark' },
                      { id: 'system', icon: Monitor, label: 'System' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${theme === t.id ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                      >
                        <t.icon size={24} />
                        <span className="text-xs font-bold uppercase">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Account Section */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Account</h3>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center font-bold text-accent-primary">
                      {user?.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{user?.email}</p>
                      <p className="text-xs text-gray-500 italic">Account Active</p>
                    </div>
                  </div>
                </section>

                {/* Info Section */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Cuemath Flashcard Engine v2.0 (2026 Build). 
                    Designed for long-term retention and rapid mastery.
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
