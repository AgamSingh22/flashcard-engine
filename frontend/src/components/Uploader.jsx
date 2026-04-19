import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, X, Loader2, Sparkles } from 'lucide-react'
import axios from 'axios'

export default function Uploader({ onUploadSuccess, onBack, classId }) {
  const [file, setFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const selected = e.target.files[0]
    if (selected?.type === 'application/pdf') {
      setFile(selected)
      setError('')
    } else {
      setError('Please upload a valid PDF file.')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsProcessing(true)
    setError('')
    
    const formData = new FormData()
    formData.append('file', file)
    if (classId) formData.append('class_id', classId)

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload-pdf/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploadSuccess(response.data.deck_id)
    } catch (err) {
      console.error(err)
      setError("AI Engine encountered an error. Please try a smaller PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-card p-12 text-center relative overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent-primary/20 blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-glow-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-secondary/20 blur-[120px] translate-x-1/2 translate-y-1/2 animate-glow-pulse" />

        <div className="relative z-10">
          <div className="mb-6 inline-flex p-4 bg-accent-primary/10 rounded-full border border-accent-primary/20">
            <UploadCloud className="text-accent-primary animate-bounce" size={40} />
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Drop your knowledge</h2>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
            Upload a PDF and watch our AI transform it into an elite spaced-repetition deck.
          </p>

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-accent-primary/50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-400 group-hover:text-gray-300">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF (MAX. 50MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="application/pdf" onChange={handleFile} />
                </label>
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary/10 rounded-lg">
                    <FileText className="text-accent-primary" size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-500"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mb-4 font-medium"
            >
              {error}
            </motion.p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className={`glass-button w-full h-14 ${!file || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Synthesizing Cards...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate AI Flashcards</span>
                </>
              )}
            </button>
            
            <button 
              onClick={onBack}
              disabled={isProcessing}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
