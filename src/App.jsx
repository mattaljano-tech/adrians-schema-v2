import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'; 
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getToken } from 'firebase/messaging'; // Importerar getToken
import { db, messaging } from './firebase';    // Importerar db och messaging

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

  return "";
};

// --- KOMPONENT: ANALOG KLOCKA (För skärmsläckaren) ---
const AnalogClock = ({ date, size = 150 }) => {
  const mDeg = date.getMinutes() * 6 + date.getSeconds() * 0.1;
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  
  return (
    <div style={{ width: size, height: size }} className="relative bg-[#1E293B] rounded-full border border-slate-700 shadow-2xl flex-shrink-0">
      
      {/* Siffrorna 1-12 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
        <div key={num} className="absolute inset-0 p-2 text-center pointer-events-none" style={{ transform: `rotate(${num * 30}deg)` }}>
          <span className="inline-block text-[14px] font-black text-slate-500" style={{ transform: `rotate(-${num * 30}deg)` }}>{num}</span>
        </div>
      ))}
      
      {/* Mitten-pricken */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 border-2 border-slate-600 shadow-sm"></div>
      
      {/* Timvisare (Röd) */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ transform: `rotate(${hDeg}deg)` }}>
        <div className="absolute bottom-1/2 left-1/2 w-2 h-[28%] bg-red-500 rounded-full -translate-x-1/2"></div>
      </div>
      
      {/* Minutvisare (Blå) */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ transform: `rotate(${mDeg}deg)` }}>
        <div className="absolute bottom-1/2 left-1/2 w-1.5 h-[38%] bg-blue-500 rounded-full -translate-x-1/2"></div>
      </div>

    </div>
  );
};

const App = () => {
  const [view, setView] = useState('schema'); 
  const [activeToast, setActiveToast] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const topRef = useRef(null);

  // Larm & Vila
  const [isIdle, setIsIdle] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [prepAlert, setPrepAlert] = useState(null);
  const audioRef = useRef(null);
  const firedNotifs = useRef(new Set());

  // Lås
  const [clickCount, setClickCount] = useState(0);
  const handleSecretUnlock = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount >= 2) { // <-- Ändrat till 2, vilket ger exakt 3 snabba klick!
      setView('admin');
      setClickCount(0); 
      triggerVibrate();
    }
    setTimeout(() => setClickCount(0), 1500);
  };

  const [bankBalance, setBankBalance] = useState(0);
  const [bankStreak, setBankStreak] = useState(0);
  const [bedtime, setBedtime] = useState('20:00');
  const [claimedQuests, setClaimedQuests] = useState({});
  const [activities, setActivities] = useState([]); 
  const [adminName, setAdminName] = useState(''); 
  const [dailyMessage, setDailyMessage] = useState(''); 
  const [childName, setChildName] = useState('Adrian');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [localChildName, setLocalChildName] = useState('');

  const appId = 'test-schema-v2';

  const handleSaveName = async () => {
    try {
      const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
      await updateDoc(bankDoc, { childName: localChildName });
      setIsEditingName(false);
    } catch(e) { console.error(e); }
  };

  // --- 0. TYST INLOGGNING (SÄKERHET) ---
  useEffect(() => {
    const auth = getAuth();
    signInAnonymously(auth).catch((error) => {
      console.error("Kunde inte logga in tyst i bakgrunden:", error);
    });
  }, []);

  // --- 0.5 KOLLA BEFINTLIGA NOTIS-RÄTTIGHETER ---
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotifsEnabled(true);
      }
    }
  }, []);


  // --- 1. KLOCKAN ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. WAKE LOCK
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

  // 3. SKÄRMSLÄCKARE (Idle timer)
  useEffect(() => {
    let timeoutId;
    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.isTimerActive) return; 
        setIsIdle(true);
        setView('schema'); 
      }, 600000); // 10 min
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

  // 4. LARM & NOTISER (Frontend-timers)
  useEffect(() => {
    if (!notifsEnabled) return;
    const nowMs = currentTime.getTime();

    activities.forEach(a => {
      const prepStart = a.startTime - ((a.prepTime || 0) * 60000);
      if (a.prepTime > 0 && Math.abs(nowMs - prepStart) < 2000 && !firedNotifs.current.has(a.id + '-prep')) {
        audioRef.current?.play().catch(() => {});
        firedNotifs.current.add(a.id + '-prep');
        setPrepAlert(`Dags att förbereda sig för: ${a.title}!`);
      }
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
        setBedtime(data.bedtime || '22:00');
        setClaimedQuests(data.claimedQuests || {});
        setAdminName(data.adminName || 'Din kompis'); 
        setChildName(data.childName || 'Adrian');
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


 

  // =====================================================================
  // HÄR ÄR DEN NYA FUNKTIONEN FÖR FIREBASE-NOTISER MED VAPID-NYCKELN!
  // =====================================================================
  const requestNotificationPermission = async () => {
    try {
      console.log("Frågar om notis-behörighet...");
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log("Behörighet beviljad! Hämtar token...");
        
        // HÄR ANVÄNDS DIN VAPID-NYCKEL
        const token = await getToken(messaging, { 
          vapidKey: 'BKc6JIfn6UU5KfzfPe0l56Pj5gFfQflQeroH8hEenz3OoeiFrfQIdwhKD1c380MP9ydhPVdOyvIE4C-Schh-0sA' 
        });

        if (token) {
          console.log('Din enhets-token är:', token);
          
          // Spara till backendens exakta sökväg
          const tokenRef = doc(db, 'artifacts/gaming-schema-app-light/public/data/device_tokens/adrians_telefon');
          await setDoc(tokenRef, { tokens: [token] }, { merge: true });
          
          showToast("Larm och notiser aktiverade!");
        } else {
          console.log('Kunde inte generera token.');
        }
      } else {
        console.log("Användaren nekade notiser.");
      }
    } catch (error) {
      console.error('Fel vid hämtning av notis-token:', error);
    }
  };
  // =====================================================================

  const now = currentTime.getTime();
  const future = activities.filter(a => a.startTime > now);
  const nextActivity = future.length > 0 ? future[0] : null;

  return (
    // Den mjuka isblå/grå bakgrunden som gör att de vita korten "poppar"
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 pb-32 font-sans selection:bg-blue-500">
      <div ref={topRef} />
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* --- STORT LARM FÖR FÖRBEREDELSE (Mjukare design) --- */}
      <AnimatePresence>
        {prepAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[99999] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="text-[7rem] animate-pulse mb-6 drop-shadow-lg">🚨</div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#1E293B] tracking-tight mb-8 leading-tight">{prepAlert}</h1>
            <button 
              onClick={() => { setPrepAlert(null); triggerVibrate(); }}
              className="bg-red-500 text-white px-10 py-4 rounded-full font-black uppercase text-sm sm:text-base shadow-[0_8px_30px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-colors"
            >
              Jag fattar! (Stäng)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SKÄRMSLÄCKARE (Elegans) --- */}
      <AnimatePresence>
        {isIdle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            onClick={() => setIsIdle(false)} 
            className="fixed inset-0 bg-slate-900 z-[9998] flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm"
          >
            <div className="text-slate-400 uppercase tracking-[0.3em] font-black mb-12 text-sm sm:text-base">
              {["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"][currentTime.getDay()]} {currentTime.getDate()} {["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"][currentTime.getMonth()]}
            </div>
            
            <AnalogClock date={currentTime} size={200} />
            
            <div className="text-[6rem] sm:text-[9rem] font-black tracking-tighter mt-10 leading-none text-white font-clock tabular-nums">
              {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}
            </div>
            <div className="text-xl font-black uppercase tracking-widest mt-4 text-blue-400 text-center px-4">
              {getSwedishTimeWords(currentTime)}
            </div>
            
            {nextActivity && (
              <div className="mt-16 bg-white/10 p-6 rounded-[2rem] border border-white/20 flex flex-col items-center max-w-[85%] text-center backdrop-blur-md">
                <span className="text-slate-300 uppercase font-bold text-[10px] tracking-widest mb-1">Nästa på schemat</span>
                <span className="text-xl font-black text-white uppercase tracking-wide">{nextActivity.title}</span>
                <span className="text-blue-300 font-bold text-sm mt-2 font-clock">
                  {new Date(nextActivity.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            )}
            
            <div className="absolute bottom-10 text-slate-500 uppercase font-bold tracking-widest animate-pulse text-[10px]">
              Tryck var som helst för att väcka
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOAST --- */}
      <AnimatePresence>
        {activeToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-6 left-0 right-0 z-[9997] flex justify-center px-4 pointer-events-none">
            <div className="bg-[#10b981] text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.3)] flex items-center gap-3 border border-emerald-400 pointer-events-auto">
              <span className="text-lg drop-shadow-sm">✅</span>
              <span className="font-black uppercase tracking-widest text-[10px]">{activeToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- HEADER (Exakt som din skärmdump) --- */}
      {/* --- HEADER (Exakt som din skärmdump) --- */}
      <header className="pt-12 pb-6 px-6 flex flex-col items-center">
        
        {view === 'admin' && isEditingName ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1 px-3 rounded-2xl shadow-sm border border-blue-200 mb-1 z-50">
            <input 
              type="text" 
              value={localChildName} 
              onChange={e => setLocalChildName(e.target.value)} 
              className="bg-transparent font-black text-4xl sm:text-5xl text-slate-800 outline-none text-center w-48 uppercase tracking-tight"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button onClick={handleSaveName} className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-sm active:scale-95 text-xl">
              ✅
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl sm:text-5xl font-black text-[#1E293B] uppercase tracking-tight leading-none">{childName}</h1>
            {view === 'admin' && (
              <button onClick={() => { setLocalChildName(childName); setIsEditingName(true); }} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-sm">
                ✏️
              </button>
            )}
          </div>
        )}

        <div className="text-xl sm:text-2xl font-black text-[#3b82f6] font-clock tabular-nums tracking-widest select-none">
          {currentTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* HÄR KÖRS DIN NYA NOTISFUNKTION NÄR MAN KLICKAR PÅ KNAPPEN */}
        {!notifsEnabled && (
          <button 
            onClick={async () => {
              setNotifsEnabled(true);
              audioRef.current?.play().catch(e => console.log(e));
              await requestNotificationPermission(); // <--- KÖR FUNKTIONEN HÄR!
            }}
            className="mt-6 bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-sm flex items-center gap-2 transition-transform active:scale-95"
          >
            <span className="text-sm">🔔</span> Slå på larm & ljud
          </button>
        )}
      </header>

      {/* --- HUVUDINNEHÅLL --- */}
      <main className="max-w-md mx-auto px-4">
        
        {/* HÄR ÄR TILLÄGGET: onExitComplete */}
        <AnimatePresence 
          mode="wait" 
          onExitComplete={() => {
            // Vi väntar 10 millisekunder så webbläsaren hinner andas
            setTimeout(() => {
              if (topRef.current) {
                topRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
              }
              window.scrollTo(0, 0); // Kör denna som backup!
            }, 10);
          }}
        >
        
          {view === 'schema' && (
            <motion.section key="schema" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <SchemaTab 
                activities={activities} 
                currentTime={currentTime} 
                dailyMessage={dailyMessage} 
                adminName={adminName}
                onNavigateToEarn={() => { setView('earn'); triggerVibrate(); }}
                onSecretClick={handleSecretUnlock} // <-- NYA RADEN!
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
              <AdminTab 
                activities={activities} 
                bankBalance={bankBalance} 
                bankStreak={bankStreak} 
                dailyMessage={dailyMessage} 
                adminName={adminName}
                childName={childName} // <--- NY RAD! Skickar in namnet till Admin-panelen!
                bedtime={bedtime}
                showToast={showToast}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* --- NAVBAR (Premium Style) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 pt-3 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-between px-2 pb-5 pt-1">
          {[
            { id: 'schema', label: 'Schema', icon: '🏠' },
            { id: 'learn', label: 'Lär mig', icon: '🧠' },
            { id: 'earn', label: 'Uppdrag', icon: '🎯' },
            { id: 'shop', label: 'Butik', icon: '🛒' }
          ].map((tab) => {
            const isActive = view === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => { setView(tab.id); triggerVibrate(); }} 
                className="relative flex-1 flex flex-col items-center justify-center transition-all z-10 py-2" 
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavPill" 
                    className="absolute inset-0 bg-[#eff6ff] border border-[#dbeafe] rounded-2xl -z-10 shadow-[inset_0_2px_4px_rgba(255,255,255,1)]" 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} 
                  />
                )}
                
                <span className={`text-[22px] transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm grayscale-0' : 'grayscale-[40%] opacity-70'}`}>
                  {tab.icon}
                </span>
                
                <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 transition-colors ${isActive ? 'text-[#2563eb]' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Safarea fix för iPhone */}
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 24px); }
      `}</style>
    </div>
  );
};

export default App;