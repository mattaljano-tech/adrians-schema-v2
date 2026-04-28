import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'; 
import { db } from './firebase'; 
import EarnTab from './components/EarnTab'; 
import ShopTab from './components/ShopTab';
import SchemaTab from './components/SchemaTab'; 
import LearnTab from './components/LearnTab';
import AdminTab from './components/AdminTab'; 

const triggerVibrate = () => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(40); } catch (e) {}
  }
};

// --- HJÄLPFUNKTION FÖR SVENSK TID ---
const getSwedishTimeWords = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hourNames = ["tolv", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv"];
  let h = hours % 12;
  let nextH = (h + 1) % 12;
  if (h === 0) h = 12;
  if (nextH === 0) nextH = 12;

  if (minutes === 0) return hourNames[h];
  if (minutes === 5) return `fem över ${hourNames[h]}`;
  if (minutes === 10) return `tio över ${hourNames[h]}`;
  if (minutes === 15) return `kvart över ${hourNames[h]}`;
  if (minutes === 20) return `tjugo över ${hourNames[h]}`;
  if (minutes === 25) return `fem i halv ${hourNames[nextH]}`;
  if (minutes === 30) return `halv ${hourNames[nextH]}`;
  if (minutes === 35) return `fem över halv ${hourNames[nextH]}`;
  if (minutes === 40) return `tjugo i ${hourNames[nextH]}`;
  if (minutes === 45) return `kvart i ${hourNames[nextH]}`;
  if (minutes === 50) return `tio i ${hourNames[nextH]}`;
  if (minutes === 55) return `fem i ${hourNames[nextH]}`;

  return ""; // Förenklad fallback
};

// --- KOMPONENT: ANALOG KLOCKA (För skärmsläckaren) ---
const AnalogClock = ({ date, size = 150 }) => {
  const mDeg = date.getMinutes() * 6 + date.getSeconds() * 0.1;
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  return (
    <div style={{ width: size, height: size }} className="relative bg-slate-800 rounded-full border-[8px] border-slate-700 shadow-2xl flex-shrink-0">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
        <div key={num} className="absolute inset-0 p-2 text-center pointer-events-none" style={{ transform: `rotate(${num * 30}deg)` }}>
          <span className="inline-block text-[14px] font-black text-slate-500" style={{ transform: `rotate(-${num * 30}deg)` }}>{num}</span>
        </div>
      ))}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 border-2 border-slate-600 shadow-sm"></div>
      <div className="absolute top-1/2 left-1/2 w-2 h-[28%] bg-red-500 rounded-full origin-bottom -translate-x-1/2 -translate-y-full z-10" style={{ transform: `translateX(-50%) translateY(-100%) rotate(${hDeg}deg)` }}></div>
      <div className="absolute top-1/2 left-1/2 w-1.5 h-[38%] bg-blue-500 rounded-full origin-bottom -translate-x-1/2 -translate-y-full z-10" style={{ transform: `translateX(-50%) translateY(-100%) rotate(${mDeg}deg)` }}></div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState('schema'); 
  const [activeToast, setActiveToast] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- NYA STATES FÖR LARM & VILA ---
  const [isIdle, setIsIdle] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [prepAlert, setPrepAlert] = useState(null);
  const audioRef = useRef(null);
  const firedNotifs = useRef(new Set());

  // Lås
  const [clickCount, setClickCount] = useState(0);
  const handleSecretUnlock = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount >= 2) { 
      setView('admin');
      setClickCount(0); 
      triggerVibrate();
    }
    setTimeout(() => setClickCount(0), 1500);
  };

  const [bankBalance, setBankBalance] = useState(0);
  const [bankStreak, setBankStreak] = useState(0);
  const [claimedQuests, setClaimedQuests] = useState({});
  const [activities, setActivities] = useState([]); 
  const [adminName, setAdminName] = useState(''); 
  const [dailyMessage, setDailyMessage] = useState(''); 

  const appId = 'test-schema-v2';

  // --- 1. KLOCKAN ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. WAKE LOCK (Håll skärmen vaken) ---
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) { console.warn("Wake lock failed", err); }
    };
    requestWakeLock();
    const handleVis = () => document.visibilityState === 'visible' && requestWakeLock();
    document.addEventListener('visibilitychange', handleVis);
    return () => { wakeLock?.release(); document.removeEventListener('visibilitychange', handleVis); };
  }, []);

  // --- 3. SKÄRMSLÄCKARE (Idle timer) ---
  useEffect(() => {
    let timeoutId;
    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      // Starta 10-minuters timer
      timeoutId = setTimeout(() => {
        if (window.isTimerActive) return; // Stäng inte ner om han promenerar/läser!
        setIsIdle(true);
        setView('schema'); // Hoppa tillbaka till schemat när han väcker appen sen
      }, 600000);
    };

    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    handleActivity(); 

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // --- 4. LARM & NOTISER ---
  useEffect(() => {
    if (!notifsEnabled) return;
    const nowMs = currentTime.getTime();

    activities.forEach(a => {
      // Förberedelse-larm (om du lagt in prepTime i framtiden)
      const prepStart = a.startTime - ((a.prepTime || 0) * 60000);
      if (a.prepTime > 0 && Math.abs(nowMs - prepStart) < 2000 && !firedNotifs.current.has(a.id + '-prep')) {
        audioRef.current?.play().catch(() => {});
        firedNotifs.current.add(a.id + '-prep');
        setPrepAlert(`Dags att förbereda sig för: ${a.title}!`);
      }
      
      // Start-larm (När uppdraget faktiskt börjar)
      if (Math.abs(nowMs - a.startTime) < 2000 && !firedNotifs.current.has(a.id + '-start')) {
        audioRef.current?.play().catch(() => {});
        firedNotifs.current.add(a.id + '-start');
        setPrepAlert(`Nu börjar: ${a.title}!`);
      }
    });
  }, [currentTime, notifsEnabled, activities]);

  // Datahämtning Firebase
  useEffect(() => {
    const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
    const unsubBank = onSnapshot(bankDoc, (d) => {
      if (d.exists()) {
        const data = d.data();
        setBankBalance(data.balance || 0);
        setBankStreak(data.streak || 0);
        setClaimedQuests(data.claimedQuests || {});
        setAdminName(data.adminName || 'Din kompis'); 
        setDailyMessage(data.dailyMessage || ''); 
      }
    });
    const colPath = collection(db, 'artifacts', appId, 'public', 'data', 'schedule_items');
    const unsubSchema = onSnapshot(colPath, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.startTime - b.startTime);
      setActivities(items);
    });
    return () => { unsubBank(); unsubSchema(); };
  }, []);

  const showToast = (message) => {
    setActiveToast(message);
    setTimeout(() => setActiveToast(null), 3000);
  };

  const handleClaim = async (amount, questId, title) => {
    triggerVibrate();
    showToast(`Bra jobbat! +${amount} kr`);
    try {
      const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
      await updateDoc(bankDoc, {
        balance: bankBalance + amount,
        [`claimedQuests.${questId}`]: Date.now() 
      });
    } catch (err) { console.error(err); }
  };

  const handleBuy = async (item) => {
    if (bankBalance >= item.cost) {
      triggerVibrate();
      showToast(`Köpt: ${item.title}! 🎉`);
      try {
        const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
        await updateDoc(bankDoc, { balance: bankBalance - item.cost });
      } catch (err) { console.error(err); }
    }
  };

  // För skärmsläckaren: Hitta nästa uppdrag
  const now = currentTime.getTime();
  const future = activities.filter(a => a.startTime > now);
  const nextActivity = future.length > 0 ? future[0] : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-32 font-sans selection:bg-blue-500">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* --- STORT LARM FÖR FÖRBEREDELSE --- */}
      <AnimatePresence>
        {prepAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[99999] bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="text-[8rem] animate-bounce mb-4">🚨</div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-widest drop-shadow-xl mb-8">{prepAlert}</h1>
            <button 
              onClick={() => { setPrepAlert(null); triggerVibrate(); }}
              className="bg-white text-red-600 px-12 py-5 rounded-full font-black uppercase text-xl shadow-2xl border-4 border-red-300 hover:scale-105 active:scale-95 transition-transform"
            >
              Jag fattar! (Stäng)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SKÄRMSLÄCKARE --- */}
      <AnimatePresence>
        {isIdle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onClick={() => setIsIdle(false)} // Vakna vid klick
            className="fixed inset-0 bg-slate-900 z-[9998] flex flex-col items-center justify-center text-white cursor-pointer"
          >
            <div className="text-slate-400 uppercase tracking-[0.3em] font-black mb-12 text-xl">
              {["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"][currentTime.getDay()]} {currentTime.getDate()} {["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"][currentTime.getMonth()]}
            </div>
            
            <AnalogClock date={currentTime} size={220} />
            
            <div className="text-[7rem] sm:text-[10rem] font-black tracking-tighter mt-8 leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] text-slate-100">
              {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}
            </div>
            <div className="text-3xl font-black uppercase tracking-widest mt-2 text-blue-400 text-center px-4">
              {getSwedishTimeWords(currentTime)}
            </div>
            
            {nextActivity && (
              <div className="mt-16 bg-slate-800 p-6 rounded-[2rem] border-2 border-slate-700 flex flex-col items-center max-w-[90%] text-center shadow-2xl">
                <span className="text-slate-400 uppercase font-black text-xs tracking-widest mb-2">Nästa uppdrag</span>
                <span className="text-2xl font-black text-white">{nextActivity.title}</span>
                <span className="bg-blue-600 text-white px-5 py-2 rounded-full font-black uppercase tracking-wider text-sm mt-4">
                  Börjar kl {new Date(nextActivity.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            )}
            
            <div className="absolute bottom-10 text-slate-500 uppercase font-black tracking-widest animate-pulse text-xs">
              Tryck var som helst för att väcka
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOAST --- */}
      <AnimatePresence>
        {activeToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-6 left-0 right-0 z-[9997] flex justify-center px-4 pointer-events-none">
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border-2 border-white pointer-events-auto">
              <span className="text-xl drop-shadow-sm">✅</span>
              <span className="font-black uppercase tracking-widest text-xs">{activeToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* HEADER */}
      <header className="pt-10 pb-6 px-6 flex flex-col items-center">
        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter drop-shadow-sm text-center">Adrian</h1>
        <div onClick={handleSecretUnlock} className="text-xl font-black text-blue-500 mt-2 tracking-widest opacity-80 cursor-pointer select-none">
          {currentTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {!notifsEnabled && (
          <button 
            onClick={() => {
              setNotifsEnabled(true);
              audioRef.current?.play().catch(e => console.log(e)); // Aktivera ljud i webbläsaren
            }}
            className="mt-6 bg-blue-100 text-blue-700 border-2 border-blue-300 px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest animate-bounce shadow-sm"
          >
            🔔 Slå på Larm & Ljud
          </button>
        )}
      </header>

      {/* HUVUDINNEHÅLL */}
      <main className="max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          {view === 'schema' && (
            <motion.section key="schema" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <SchemaTab 
                activities={activities} 
                currentTime={currentTime} 
                dailyMessage={dailyMessage} 
                adminName={adminName} 
                onNavigateToEarn={() => { setView('earn'); triggerVibrate(); }}
              />
            </motion.section>
          )}
          {view === 'learn' && (
            <motion.section key="learn" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <LearnTab />
            </motion.section>
          )}
          {view === 'earn' && (
            <motion.section key="earn" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <EarnTab bankBalance={bankBalance} bankStreak={bankStreak} handleClaim={handleClaim} claimedQuests={claimedQuests} />
            </motion.section>
          )}
          {view === 'shop' && (
            <motion.section key="shop" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <ShopTab bankBalance={bankBalance} handleBuy={handleBuy} />
            </motion.section>
          )}
          {view === 'admin' && (
            <motion.section key="admin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <AdminTab activities={activities} bankBalance={bankBalance} dailyMessage={dailyMessage} adminName={adminName} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-slate-200 p-2 pb-6 z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-between relative px-2">
          {[
            { id: 'schema', label: 'Schema', icon: '🏠', color: 'text-blue-600' },
            { id: 'learn', label: 'Lär mig', icon: '🧠', color: 'text-purple-600' },
            { id: 'earn', label: 'Uppdrag', icon: '🎯', color: 'text-emerald-600' },
            { id: 'shop', label: 'Butik', icon: '🛒', color: 'text-amber-500' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => { setView(tab.id); triggerVibrate(); }} className={`relative flex-1 py-4 flex flex-col items-center gap-1 transition-all z-10 ${view === tab.id ? 'scale-105' : 'opacity-60 hover:opacity-100'}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
              {view === tab.id && <motion.div layoutId="activeNavPill" className="absolute inset-0 bg-slate-100 rounded-[1.5rem] -z-10 border-2 border-slate-200" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className="text-2xl drop-shadow-sm">{tab.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${view === tab.id ? tab.color : 'text-slate-500'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;