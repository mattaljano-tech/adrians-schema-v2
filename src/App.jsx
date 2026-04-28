import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HÄR KAN VI LÄGGA IN FIREBASE SENARE ---
// import { initializeApp } from "firebase/app";
// ...

const triggerVibrate = () => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(40); } catch (e) {}
  }
};

const App = () => {
  const [view, setView] = useState('schema');
  const [activeToast, setActiveToast] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Klockan i headern
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // En funktion för att visa snygga bekräftelser
  const showToast = (message) => {
    setActiveToast(message);
    triggerVibrate();
    setTimeout(() => setActiveToast(null), 3000); // Försvinner av sig själv efter 3 sekunder
  };

  // --- KOMPONENT: LUGN FEEDBACK (Toast) ---
  const FeedbackToast = () => (
    <AnimatePresence>
      {activeToast && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
        >
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border-2 border-white pointer-events-auto">
            <span className="text-xl drop-shadow-sm">✅</span>
            <span className="font-black uppercase tracking-widest text-xs">{activeToast}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- KOMPONENT: REN NAVIGERING ---
  const Navbar = () => {
    const tabs = [
      { id: 'schema', label: 'Schema', icon: '🏠' },
      { id: 'learn', label: 'Lär mig', icon: '🧠' },
      { id: 'earn', label: 'Uppdrag', icon: '🎯' },
      { id: 'shop', label: 'Butik', icon: '🛒' }
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-slate-200 p-2 pb-6 z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-between relative px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); triggerVibrate(); }}
              className={`relative flex-1 py-4 flex flex-col items-center gap-1 transition-all z-10 ${view === tab.id ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {view === tab.id && (
                <motion.div 
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-blue-50 rounded-[1.5rem] -z-10 border-2 border-blue-100"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-2xl drop-shadow-sm">{tab.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${view === tab.id ? 'text-blue-600' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-32">
      <FeedbackToast />
      
      {/* HEADER */}
      <header className="pt-10 pb-6 px-6 text-center">
        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter drop-shadow-sm">
          Adrian
        </h1>
        <div className="text-xl font-black text-blue-500 mt-2 tracking-widest opacity-80">
          {currentTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* HUVUDINNEHÅLL */}
      <main className="max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          
          {view === 'schema' && (
            <motion.section 
              key="schema"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-sm text-center">
                <span className="text-4xl mb-4 block">📅</span>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Schema kommer här...</p>
                <button 
                  onClick={() => showToast("Bra tryckt!")}
                  className="mt-6 bg-blue-100 text-blue-600 px-6 py-3 rounded-xl font-black uppercase text-xs"
                >
                  Testa grön ruta
                </button>
              </div>
            </motion.section>
          )}

          {view === 'learn' && (
            <motion.section 
              key="learn"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-sm text-center">
                <span className="text-4xl mb-4 block">🧠</span>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Lär dig klockan kommer här...</p>
              </div>
            </motion.section>
          )}

          {view === 'earn' && (
            <motion.section 
              key="earn"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-sm text-center">
                <span className="text-4xl mb-4 block">🎯</span>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Uppdrag kommer här...</p>
              </div>
            </motion.section>
          )}

          {view === 'shop' && (
            <motion.section 
              key="shop"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-sm text-center">
                <span className="text-4xl mb-4 block">🛒</span>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Butik kommer här...</p>
              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </main>

      <Navbar />
    </div>
  );
};

export default App;