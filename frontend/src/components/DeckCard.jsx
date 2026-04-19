import { motion } from 'framer-motion'
import { FolderOpen, BookOpen, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import ConfirmDeleteModal from './ConfirmDeleteModal'

export default function DeckCard({ deck, onClick, onDelete }) {
  const [stats, setStats] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/decks/${deck.id}/stats`)
        setStats(res.data)
      } catch (err) {
        console.error("Stats fetch error", err)
      }
    }
    fetchStats()
  }, [deck.id])

  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/decks/${deck.id}`)
      onDelete(deck.id)
    } catch (err) {
      alert("Failed to delete deck.")
    }
  }

  return (
    <>
      <ConfirmDeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={deck.title}
        type="deck"
      />
      
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card p-6 cursor-pointer flex flex-col gap-4 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-accent-primary/20 transition-colors" />
        
        <div className="flex justify-between items-start z-10">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <FolderOpen className="text-accent-primary" size={24} />
          </div>
          <div className="flex gap-2">
            {stats?.due > 0 && (
              <div className="px-3 py-1.5 bg-red-500 text-white text-xs font-black rounded-full shadow-lg shadow-red-500/40 flex items-center gap-1 animate-pulse">
                <Clock size={12} /> {stats.due} DUE
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(true); }}
              className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg border border-white/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="z-10 mt-2">
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-accent-primary transition-colors">
            {deck.title.replace('.pdf', '')}
          </h3>
          {stats && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                stats.comfort_label === 'Expert' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                stats.comfort_label === 'Solid' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                stats.comfort_label === 'Average' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                'bg-gray-500/10 border-white/10 text-gray-400'
              }`}>
                {stats.comfort_label}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Comfort Level</span>
            </div>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-3 mt-auto z-10">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Chapters</span>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <BookOpen size={14} className="text-accent-secondary" />
                <span>{stats.total} Cards</span>
              </div>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Mastery</span>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={14} className="text-green-400" />
                <span>{stats.progress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Mini Bar */}
        {stats && (
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden z-10 border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.progress}%` }}
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary shadow-[0_0_12px_rgba(99,102,241,0.6)]"
            />
          </div>
        )}
      </motion.div>
    </>
  )
}
