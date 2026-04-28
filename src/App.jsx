import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'; // <-- NYTT: Lade till collection
import { db } from './firebase'; 
import EarnTab from './components/EarnTab'; 
import ShopTab from './components/ShopTab';
import SchemaTab from './components/SchemaTab'; // <-- NYTT: Importerar Schemat

const triggerVibrate = () => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(40); } catch (e) {}
  }
};

const App = () => {
  const [view, setView] = useState('schema'); // <-- NYTT: Startar på schema nu
  const [activeToast, setActiveToast] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- FIREBASE STATES ---
  const [bankBalance, setBankBalance] = useState(0);
  const [claimedQuests, setClaimedQuests] = useState({});
  const [activities, setActivities] = useState([]); // <-- NYTT: Håller koll på schemat
  const [adminName, setAdminName] = useState(''); // <-- NYTT: Förebildens namn
  const [dailyMessage, setDailyMessage] = useState(''); // <-- NYTT: Dagens meddelande

  const appId = 'gaming-schema-app-light'; 

  // 1. Klockan (Uppdaterar varje sekund)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Lyssna på Banken OCH meddelanden
  useEffect(() => {
    const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
    const unsubBank = onSnapshot(bankDoc, (d) => {
      if (d.exists()) {
        const data = d.data();
        setBankBalance(data.balance || 0);
        setClaimedQuests(data.claimedQuests || {});
        setAdminName(data.adminName || 'Din kompis'); // <-- NYTT
        setDailyMessage(data.dailyMessage || ''); // <-- NYTT
      } else {
        setDoc(bankDoc, { balance: 0, claimedQuests: {}, adminName: 'Förälder', dailyMessage: '' }).catch(console.error);
      }
    });

    return () => unsubBank();
  }, []);

  // 3. Lyssna på Schemat (Aktiviteter) <-- NYTT
  useEffect(() => {
    const colPath = collection(db, 'artifacts', appId, 'public', 'data', 'schedule_items');
    const unsubSchema = onSnapshot(colPath, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sortera så att det som händer först ligger överst
      items.sort((a, b) => a.startTime - b.startTime);
      setActivities(items);
    });

    return () => unsubSchema();
  }, []);

  // Funktion för att tjäna pengar (Uppdrag)
  const handleClaim = async (amount, questId, title) => {
    triggerVibrate();
    showToast(`Bra jobbat! +${amount} kr`);

    try {
      const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
      await updateDoc(bankDoc, {
        balance: bankBalance + amount,
        [`claimedQuests.${questId}`]: Date.now() 
      });
    } catch (err) {
      console.error("Kunde inte uppdatera banken", err);
    }
  };

  // Funktion för att köpa saker (Butik)
  const handleBuy = async (item) => {
    if (bankBalance >= item.cost) {
      triggerVibrate();
      showToast(`Köpt: ${item.title}! 🎉`);

      try {
        const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
        await updateDoc(bankDoc, {
          balance: bankBalance - item.cost
        });
      } catch (err) {
        console.error("Kunde inte genomföra köpet", err);
      }
    }
  };

  // En funktion för att visa snygga bekräftelser
  const showToast = (message) => {
    setActiveToast(message);
    setTimeout(() => setActiveToast(null), 3000);
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
      { id: 'schema', label: 'Schema', icon: '🏠', color: 'text-blue-600' },
      { id: 'learn', label: 'Lär mig', icon: '🧠', color: 'text-purple-600' },
      { id: 'earn', label: 'Uppdrag', icon: '🎯', color: 'text-emerald-600' },
      { id: 'shop', label: 'Butik', icon: '🛒', color: 'text-amber-500' }
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
                  className="absolute inset-0 bg-slate-100 rounded-[1.5rem] -z-10 border-2 border-slate-200"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-2xl drop-shadow-sm">{tab.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${view === tab.id ? tab.color : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-32 font-sans selection:bg-blue-500">
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
            >
              {/* <-- HÄR ÄR NYA SCHEMAT INKOPPLAT --> */}
              <SchemaTab 
                activities={activities}
                currentTime={currentTime}
                dailyMessage={dailyMessage}
                adminName={adminName}
              />
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
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Lär dig klockan kommer snart...</p>
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
              <EarnTab 
                bankBalance={bankBalance} 
                handleClaim={handleClaim} 
                claimedQuests={claimedQuests} 
              />
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
              <ShopTab 
                bankBalance={bankBalance} 
                handleBuy={handleBuy} 
              />
            </motion.section>
          )}

        </AnimatePresence>
      </main>

      <Navbar />
    </div>
  );
};

export default App;