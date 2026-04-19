import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, type = 'item' }) {
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    if (inputValue.toLowerCase() === 'delete') {
      onConfirm()
      onClose()
      setInputValue('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-md p-8 relative z-10 border-red-500/20"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold">Secure Deletion</h2>
            </div>

            <p className="text-gray-400 mb-6 leading-relaxed">
              You are about to delete <span className="text-white font-bold">"{title}"</span>. 
              This action is <span className="text-red-400 font-bold uppercase underline">irreversible</span>. 
              All associated data and progress will be purged.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Type "delete" to confirm
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type delete..."
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-red-500/50 focus:bg-red-500/5 transition-all font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 text-gray-400 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={inputValue.toLowerCase() !== 'delete'}
                  className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                    inputValue.toLowerCase() === 'delete'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 active:scale-95'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                  }`}
                >
                  Confirm Delete
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
