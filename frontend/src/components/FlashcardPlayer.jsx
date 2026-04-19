import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles, Brain, Clock, ChevronRight, Trophy } from 'lucide-react'
import { supabase } from '../supabaseClient'
import confetti from 'canvas-confetti'

export default function FlashcardPlayer({ deckId, onBack }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionFinished, setSessionFinished] = useState(false)
  const [sessionStats, setSessionStats] = useState({ mastered: 0, struggling: 0 })

  useEffect(() => {
    async function loadCards() {
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .lte('next_review', endOfToday.toISOString())
        .order('next_review', { ascending: true })
      
      if (error) console.error("Error fetching cards:", error)
      if (data) setCards(data)
      setLoading(false)
    }
    loadCards()
  }, [deckId])

  const triggerConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min, max) => Math.random() * (max - min) + min

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
  }

  const handleReview = async (grade) => {
    const currentCard = cards[currentIndex]
    let { repetition, easiness_factor, interval } = currentCard

    // Update session stats
    if (grade >= 2) setSessionStats(prev => ({ ...prev, mastered: prev.mastered + 1 }))
    else setSessionStats(prev => ({ ...prev, struggling: prev.struggling + 1 }))

    // SM-2 Logic
    if (grade === 0) {
      repetition = 0
      interval = 1
    } else {
      if (repetition === 0) interval = 1
      else if (repetition === 1) interval = 6
      else interval = Math.round(interval * easiness_factor)
      repetition += 1
    }

    easiness_factor = easiness_factor + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02))
    if (easiness_factor < 1.3) easiness_factor = 1.3

    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + interval)

    await supabase
      .from('cards')
      .update({
        repetition,
        interval,
        easiness_factor,
        next_review: nextReviewDate.toISOString()
      })
      .eq('id', currentCard.id)

    // Transition
    setIsFlipped(false)
    setTimeout(() => {
      if (currentIndex + 1 >= cards.length) {
        setSessionFinished(true)
        triggerConfetti()
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }, 300)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-4"
      >
        <RotateCcw className="text-accent-primary" size={40} />
      </motion.div>
      <p className="text-gray-400 animate-pulse">Initializing your mind palace...</p>
    </div>
  )

  if (cards.length === 0 || sessionFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto text-center py-12"
      >
        <div className="w-24 h-24 bg-accent-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-primary/20 relative">
          <Trophy className="text-accent-primary" size={48} />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-accent-primary/10 rounded-full blur-xl" 
          />
        </div>
        
        <h2 className="text-4xl font-bold mb-4">Masterpiece!</h2>
        <p className="text-gray-400 mb-12 text-lg">
          {cards.length === 0 
            ? "You've already conquered all due cards today. Rest your brain!" 
            : "Session complete. You've strengthened your neurological paths."}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-12 text-left">
          <div className="glass-card p-6 border-l-4 border-l-green-500">
            <p className="text-sm text-gray-400 mb-1">Reinforced</p>
            <p className="text-3xl font-bold">{sessionStats.mastered}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <p className="text-sm text-gray-400 mb-1">To Re-visit</p>
            <p className="text-3xl font-bold">{sessionStats.struggling}</p>
          </div>
        </div>

        <button onClick={onBack} className="glass-button w-full h-14">
          <ArrowLeft size={18} /> Return to Dashboard
        </button>
      </motion.div>
    )
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex) / cards.length) * 100

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Session</span>
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-accent-primary" />
            <span className="font-bold">{currentIndex + 1} <span className="text-gray-500">of {cards.length}</span></span>
          </div>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/5 rounded-full mb-12 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* The Playing Card */}
      <div className="relative group perspective-1000 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex + (isFlipped ? '-back' : '-front')}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            onClick={() => !isFlipped && setIsFlipped(true)}
            className={`glass-card p-12 min-h-[400px] flex flex-col items-center justify-center text-center cursor-pointer relative ${isFlipped ? 'glow-border' : ''}`}
          >
            <span className="absolute top-8 left-8 text-xs font-bold text-accent-primary/60 bg-accent-primary/5 px-2 py-1 rounded-md border border-accent-primary/20 tracking-tighter">
              {currentCard.card_type}
            </span>
            
            <p className="text-2xl md:text-3xl font-medium leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>

            {!isFlipped && (
              <motion.div 
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-8 text-gray-500 text-sm flex items-center gap-2"
              >
                Tap to Reveal <ChevronRight size={16} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Response Buttons */}
      <div className="mt-12 h-20 overflow-hidden">
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="grid grid-cols-4 gap-3 h-full"
            >
              {[
                { grade: 0, label: 'Again', color: 'bg-red-500/10 border-red-500/30 text-red-400' },
                { grade: 1, label: 'Hard', color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
                { grade: 2, label: 'Good', color: 'bg-green-500/10 border-green-500/30 text-green-400' },
                { grade: 3, label: 'Easy', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
              ].map((btn) => (
                <button
                  key={btn.grade}
                  onClick={() => handleReview(btn.grade)}
                  className={`flex flex-col items-center justify-center rounded-2xl border transition-all hover:scale-105 active:scale-95 ${btn.color}`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
                    Grade {btn.grade}
                  </span>
                  <span className="font-bold">{btn.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
