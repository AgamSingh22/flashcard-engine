import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function FlashcardPlayer({ deckId }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionFinished, setSessionFinished] = useState(false)

  // Fetch only cards that are "Due" for review today or earlier
  useEffect(() => {
    async function loadCards() {
      // Create a buffer until the very end of the current day (11:59:59 PM)
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      const cutoffTime = endOfToday.toISOString()
      
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .lte('next_review', cutoffTime) // Ask for everything due before midnight tonight
        .order('next_review', { ascending: true })
      
      if (error) console.error("Error fetching cards:", error)
      if (data) setCards(data)
      setLoading(false)
    }
    loadCards()
  }, [deckId])

  if (loading) return <h3>Loading your study session...</h3>
  if (cards.length === 0 || sessionFinished) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>🎉 Session Complete!</h2>
        <p style={{ color: '#666' }}>You have studied all due cards for this deck. Come back tomorrow!</p>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  // The Brain: Spaced Repetition Math (SM-2 Algorithm)
  const handleReview = async (grade) => {
    // grade: 0=Again, 1=Hard, 2=Good, 3=Easy
    let { repetition, easiness_factor, interval } = currentCard

    if (grade === 0) {
      // Failed it. Reset repetition.
      repetition = 0
      interval = 1
    } else {
      // Passed it. Calculate new interval.
      if (repetition === 0) interval = 1
      else if (repetition === 1) interval = 6
      else interval = Math.round(interval * easiness_factor)
      
      repetition += 1
    }

    // Update Easiness Factor based on grade
    easiness_factor = easiness_factor + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02))
    if (easiness_factor < 1.3) easiness_factor = 1.3 // Clamp it so it doesn't get too hard

    // Calculate exactly when you should see it next
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + interval)

    // 1. Save the new brain stats to Supabase
    await supabase
      .from('cards')
      .update({
        repetition: repetition,
        interval: interval,
        easiness_factor: easiness_factor,
        next_review: nextReviewDate.toISOString()
      })
      .eq('id', currentCard.id)

    // 2. Move to the next card in the UI
    setIsFlipped(false)
    setTimeout(() => {
      if (currentIndex + 1 >= cards.length) {
        setSessionFinished(true)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    }, 200)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
      
      {/* 3D Flipping Card */}
      <div 
        onClick={() => !isFlipped && setIsFlipped(true)}
        style={{
          perspective: '1000px', width: '100%', height: '300px',
          cursor: isFlipped ? 'default' : 'pointer', marginBottom: '30px'
        }}
      >
        <div style={{
          width: '100%', height: '100%', transition: 'transform 0.6s',
          transformStyle: 'preserve-3d', position: 'relative',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}>
          
          {/* FRONT */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
            backgroundColor: '#ffffff', border: '2px solid #e0e0e0', borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: '20px', fontSize: '1.4rem', fontWeight: 'bold'
          }}>
            <span style={{ position: 'absolute', top: '15px', left: '20px', fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>
              {currentCard.card_type}
            </span>
            {currentCard.front}
            {!isFlipped && (
              <span style={{ position: 'absolute', bottom: '15px', fontSize: '0.9rem', color: '#aaa', fontWeight: 'normal' }}>
                Click to reveal answer
              </span>
            )}
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
            backgroundColor: '#f8f9fa', border: '2px solid #000', borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: '20px', fontSize: '1.2rem',
            transform: 'rotateY(180deg)'
          }}>
            {currentCard.back}
          </div>

        </div>
      </div>

      <p style={{ color: '#666', marginBottom: '20px' }}>
        Card {currentIndex + 1} of {cards.length}
      </p>

      {/* The Memory Buttons (Only show when answer is revealed) */}
      <div style={{ visibility: isFlipped ? 'visible' : 'hidden', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => handleReview(0)} style={btnStyle('#ff4d4d')}>Again (1d)</button>
        <button onClick={() => handleReview(1)} style={btnStyle('#ff9900')}>Hard</button>
        <button onClick={() => handleReview(2)} style={btnStyle('#33cc33')}>Good</button>
        <button onClick={() => handleReview(3)} style={btnStyle('#3399ff')}>Easy</button>
      </div>

    </div>
  )
}

// Quick helper for button styling
const btnStyle = (color) => ({
  padding: '12px 20px',
  fontSize: '1rem',
  fontWeight: 'bold',
  backgroundColor: '#fff',
  color: color,
  border: `2px solid ${color}`,
  borderRadius: '8px',
  cursor: 'pointer',
  transition: '0.2s',
})