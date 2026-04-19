import { motion } from 'framer-motion'
import { Plus, BookOpen, ChevronLeft, GraduationCap, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

function SidebarDeckItem({ deck, selectedDeckId, onSelectDeck }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/decks/${deck.id}/stats`)
        setStats(res.data)
      } catch (err) {
        console.error("Sidebar stats error", err)
      }
    }
    fetchStats()
  }, [deck.id])

  const isActive = selectedDeckId === deck.id

  return (
    <button
      onClick={() => onSelectDeck(deck.id)}
      className={`w-full group flex flex-col p-3 rounded-xl transition-all relative overflow-hidden ${
        isActive 
        ? 'bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
        : 'hover:bg-white/5 text-gray-400'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-3 truncate">
          <BookOpen size={16} className={isActive ? 'text-accent-primary' : 'text-gray-500 group-hover:text-gray-300'} />
          <span className="text-sm font-medium truncate">{deck.title.replace('.pdf', '')}</span>
        </div>
        
        {stats?.due > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
            {stats.due}
          </span>
        )}
      </div>

      {stats && (
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            className={`h-full ${isActive ? 'bg-accent-primary' : 'bg-gray-600'}`}
          />
        </div>
      )}
    </button>
  )
}

export default function Sidebar({ 
  classes, 
  selectedClass, 
  decks, 
  selectedDeckId, 
  onSelectDeck, 
  onBackToClasses, 
  onUploadNew 
}) {
  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-72 h-screen flex flex-col bg-background/50 backdrop-blur-xl border-r border-[var(--border-color)] sticky top-0"
    >
      <div className="p-6 h-full flex flex-col">
        <button 
          onClick={onBackToClasses}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft size={16} /> Back to My Classes
        </button>

        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-accent-primary/10 rounded-lg">
            <GraduationCap className="text-accent-primary" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg truncate w-40">{selectedClass?.name}</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Class Section</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Chapters</h3>
            <button 
              onClick={onUploadNew}
              className="p-1 hover:bg-white/5 rounded text-accent-primary transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {decks.map((deck) => (
              <SidebarDeckItem 
                key={deck.id}
                deck={deck}
                selectedDeckId={selectedDeckId}
                onSelectDeck={onSelectDeck}
              />
            ))}

            {decks.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <p className="text-xs italic">No chapters yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button 
            onClick={onUploadNew}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent-primary text-white rounded-xl font-bold shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> New Chapter
          </button>
        </div>
      </div>
    </motion.div>
  )
}
