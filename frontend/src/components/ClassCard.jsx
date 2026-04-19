import { motion } from 'framer-motion'
import { GraduationCap, Trash2, ChevronRight, BookOpen } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import ConfirmDeleteModal from './ConfirmDeleteModal'

export default function ClassCard({ cls, onClick, onDelete }) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/classes/${cls.id}`)
      onDelete(cls.id)
    } catch (err) {
      alert("Failed to delete class.")
    }
  }

  return (
    <>
      <ConfirmDeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={cls.name}
        type="class"
      />
      
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card p-6 cursor-pointer flex flex-col gap-4 relative overflow-hidden group border border-accent-primary/20"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent-primary/10 transition-colors" />
        
        <div className="flex justify-between items-start z-10">
          <div className="p-3 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
            <GraduationCap className="text-accent-primary" size={24} />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(true); }}
            className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>

      <div className="z-10 mt-2">
        <h3 className="text-2xl font-bold group-hover:text-accent-primary transition-colors">
          {cls.name}
        </h3>
        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
          <BookOpen size={14} /> Enter Class to manage chapters
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-primary">Open Section</span>
        <ChevronRight size={20} className="text-accent-primary group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
    </>
  )
}
