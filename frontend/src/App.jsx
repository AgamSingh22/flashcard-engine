import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Search, GraduationCap, X, ChevronRight } from 'lucide-react'
import { supabase } from './supabaseClient'
import axios from 'axios'
import DeckCard from './components/DeckCard'
import Uploader from './components/Uploader'
import FlashcardPlayer from './components/FlashcardPlayer'
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import SettingsModal from './components/SettingsModal'
import ClassCard from './components/ClassCard'
import Sidebar from './components/Sidebar'

function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('classDashboard') // 'classDashboard', 'dashboard', 'upload', 'study'
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [decks, setDecks] = useState([])
  const [selectedDeckId, setSelectedDeckId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 2. Data Fetching
  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/classes`)
      setClasses(res.data)
    } catch (err) {
      console.error("Classes fetch error", err)
    }
  }

  const fetchDecks = async (classId) => {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('class_id', classId)
      .order('id', { ascending: false })

    if (error) console.error("Error fetching decks:", error)
    if (data) setDecks(data)
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchDecks(selectedClassId)
    }
  }, [selectedClassId])

  const selectedClass = classes.find(c => c.id === selectedClassId)

  // 3. Handlers
  const handleCreateClass = async (e) => {
    e.preventDefault()
    if (!newClassName) return
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/classes`, { name: newClassName })
      setClasses([...classes, res.data])
      setIsCreateClassOpen(false)
      setNewClassName('')
    } catch (err) {
      alert("Failed to create class.")
    }
  }

  if (!session) return <Auth />

  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col">
      <Navbar 
        view={view} 
        setView={setView} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        user={session.user}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={session.user}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 relative">
        <AnimatePresence>
          {(view === 'dashboard' || view === 'upload' || view === 'study') && selectedClassId && (
            <Sidebar 
              classes={classes}
              selectedClass={selectedClass}
              decks={decks}
              selectedDeckId={selectedDeckId}
              onSelectDeck={(id) => {
                setSelectedDeckId(id)
                setView('study')
              }}
              onBackToClasses={() => setView('classDashboard')}
              onUploadNew={() => setView('upload')}
            />
          )}
        </AnimatePresence>

        <main className={`flex-1 px-6 py-12 max-w-7xl mx-auto overflow-y-auto`}>
          <AnimatePresence mode="wait">
            {/* VIEW 1: CLASSES DASHBOARD */}
            {view === 'classDashboard' && (
              <motion.div
                key="classes"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-4xl font-extrabold mb-2 tracking-tight">My Classes</h2>
                    <p className="text-gray-400">Select a section to begin your learning session.</p>
                  </div>
                  <button 
                    onClick={() => setIsCreateClassOpen(true)}
                    className="glass-button h-[56px] !px-8 shadow-lg shadow-accent-primary/20"
                  >
                    <Plus size={24} />
                    <span>Create a Class</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {classes.map(cls => (
                    <ClassCard 
                      key={cls.id} 
                      cls={cls} 
                      onClick={() => {
                        setSelectedClassId(cls.id)
                        setView('dashboard')
                      }}
                      onDelete={(id) => setClasses(prev => prev.filter(c => c.id !== id))}
                    />
                  ))}
                  
                  {classes.length === 0 && (
                    <div 
                      onClick={() => setIsCreateClassOpen(true)}
                      className="glass-card h-64 flex flex-col items-center justify-center border-dashed border-2 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <Plus className="text-gray-500 mb-4" size={40} />
                      <p className="text-gray-500 font-medium text-lg">Create your first class</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW 2: DECKS IN CLASS */}
            {view === 'dashboard' && (
              <motion.div
                key="decks"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-bold mb-1">{selectedClass?.name} <span className="text-gray-500 font-normal">Chapters</span></h2>
                  </div>
                  <button onClick={() => setView('upload')} className="glass-button">
                    <Plus size={20} /> New Chapter
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {decks.map((deck) => (
                    <DeckCard 
                      key={deck.id} deck={deck} 
                      onClick={() => {
                        setSelectedDeckId(deck.id)
                        setView('study')
                      }}
                      onDelete={(id) => setDecks(prev => prev.filter(d => d.id !== id))}
                    />
                  ))}
                  {decks.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-40">
                      <Sparkles size={48} className="mx-auto mb-4" />
                      <p className="text-xl">Upload a PDF to create your first chapter in this class.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW 3: UPLOADER */}
            {view === 'upload' && (
              <Uploader 
                onUploadSuccess={(id) => {
                  setSelectedDeckId(id)
                  fetchDecks(selectedClassId)
                  setView('study')
                }}
                classId={selectedClassId}
                onBack={() => setView('dashboard')}
              />
            )}

            {/* VIEW 4: STUDY */}
            {view === 'study' && selectedDeckId && (
              <FlashcardPlayer 
                deckId={selectedDeckId} 
                onBack={() => setView('dashboard')} 
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* CREATE CLASS POPUP */}
      <AnimatePresence>
        {isCreateClassOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateClassOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Plus size={24} className="text-accent-primary" /> Create New Class
              </h2>
              <form onSubmit={handleCreateClass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">Class Name</label>
                  <input 
                    autoFocus type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Physics 101, History Sem 1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-accent-primary transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreateClassOpen(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 glass-button font-bold">Create Section</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global visual background */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 blur-[120px] rounded-full" />
      </div>
    </div>
  )
}

export default App