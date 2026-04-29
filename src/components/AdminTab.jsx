import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// --- PREMIUM 3D EMOJI KOMPONENT ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-md select-none pointer-events-none`} 
    draggable="false"
  />
);

const AdminTab = ({ activities, bankBalance, bankStreak, dailyMessage, adminName, bedtime }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false); 
  
  const SECRET_PASSWORD = "sevil";
  const appId = 'test-schema-v2';

  // --- FORMULÄR-STATES ---
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('15:00');
  const [newDuration, setNewDuration] = useState('60');
  const [newPrepTime, setNewPrepTime] = useState('0');
  const [isLiveEvent, setIsLiveEvent] = useState(false);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [localMessage, setLocalMessage] = useState(dailyMessage || '');
  const [localName, setLocalName] = useState(adminName || 'Din kompis');
  const [localBedtime, setLocalBedtime] = useState(bedtime || '22:00');
  const [confirmReset, setConfirmReset] = useState(false);

  // --- HÄMTA FAVORITER ---
  useEffect(() => {
    if (!isUnlocked) return;
    const favDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'favorites');
    const unsubFav = onSnapshot(favDoc, (d) => {
        if (d.exists()) {
            setFavorites(d.data().list || []);
        } else {
            const defaultFavs = [
                { title: "Duscha", duration: 15, prepTime: 0, icon: "🚿" },
                { title: "Skola", duration: 360, prepTime: 15, icon: "🎒" },
                { title: "Middag", duration: 45, prepTime: 5, icon: "🍝" }
            ];
            setDoc(favDoc, { list: defaultFavs }).catch(console.error);
        }
    });
    return () => unsubFav();
  }, [isUnlocked]);

  const handleUnlock = () => {
    if (password.toLowerCase() === SECRET_PASSWORD) {
      setIsUnlocked(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword('');
    }
  };

  // --- LÅSSKÄRMEN (Premium Glass) ---
  if (!isUnlocked) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200')" }}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1, x: shake ? [-10, 10, -10, 10, 0] : 0 }} 
          transition={{ duration: shake ? 0.4 : 0.3 }}
          className="bg-white/20 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/30 w-full max-w-sm flex flex-col items-center relative z-10"
        >
          <div className="w-24 h-24 mb-6 relative flex justify-center items-center">
            <PremiumEmoji emoji="🔒" className="w-20 h-20 relative z-10 drop-shadow-xl" />
          </div>
          <h2 className="text-xl font-black uppercase text-white mb-8 tracking-widest drop-shadow-md">Föräldraläge</h2>
          <div className="w-full relative mb-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="••••••"
              className="w-full bg-white/40 p-4 rounded-2xl text-center text-2xl tracking-[0.5em] font-black text-slate-900 outline-none border border-white/50 shadow-inner focus:border-white focus:bg-white/60 transition-all placeholder:text-slate-600/50"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUnlock}
            className="w-full bg-blue-600/90 backdrop-blur-md text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg transition-all border border-blue-400"
          >
            Lås upp
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- FIREBASE FUNKTIONER ---
  const handleLoadSchoolDay = async (isTomorrow) => {
    const dayStr = isTomorrow ? 'imorgon' : 'idag';
    if (!window.confirm(`Vill du ladda in en komplett skoldag för ${dayStr}?`)) return;

    const baseDate = new Date();
    if (isTomorrow) baseDate.setDate(baseDate.getDate() + 1);
    
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();

    const dailyRoutine = [
      { title: 'Frukost', h: 7, min: 0, duration: 30, prepTime: 0 },
      { title: 'Skola', h: 8, min: 0, duration: 450, prepTime: 15 },
      { title: 'Middag', h: 18, min: 0, duration: 30, prepTime: 5 },
      { title: 'Lära sig klockan', h: 19, min: 0, duration: 15, prepTime: 0 },
      { title: 'Läsa', h: 19, min: 15, duration: 30, prepTime: 0 }
    ];

    try {
      const colPath = collection(db, 'artifacts', appId, 'public', 'data', 'schedule_items');
      const promises = dailyRoutine.map(item => {
        const startMs = new Date(y, m, d, item.h, item.min).getTime();
        return addDoc(colPath, {
          title: item.title,
          startTime: startMs,
          endTime: startMs + (item.duration * 60 * 1000),
          duration: item.duration,
          prepTime: item.prepTime,
          isLiveEvent: false,
          createdAt: Date.now()
        });
      });

      await Promise.all(promises);
      alert(`Skoldagen för ${dayStr} är inlagd!`);
    } catch (err) {
      console.error(err);
      alert("Kunde inte ladda skoldagen.");
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    const finalTitle = isLiveEvent && !newTitle ? "Steal a brainroth" : newTitle;
    if (!finalTitle || !newTime || !newDate) return;

    const [y, m, d] = newDate.split('-').map(Number);
    const [h, min] = newTime.split(':').map(Number);
    const startMs = new Date(y, m - 1, d, h, min).getTime();

    const activityData = {
      title: finalTitle,
      startTime: startMs,
      endTime: startMs + (Number(newDuration) * 60 * 1000),
      duration: Number(newDuration),
      prepTime: Number(newPrepTime),
      isLiveEvent: isLiveEvent
    };

    try {
      if (editingId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedule_items', editingId);
        await updateDoc(docRef, activityData);
      } else {
        activityData.createdAt = Date.now();
        const colPath = collection(db, 'artifacts', appId, 'public', 'data', 'schedule_items');
        await addDoc(colPath, activityData);
      }

      if (saveAsFavorite && finalTitle) {
          if (!favorites.some(f => f.title.toLowerCase() === finalTitle.toLowerCase())) {
              const newFav = { title: finalTitle, duration: Number(newDuration), prepTime: Number(newPrepTime), icon: "⭐" };
              const updatedFavs = [...favorites, newFav];
              const favDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'favorites');
              updateDoc(favDoc, { list: updatedFavs }).catch(console.error);
          }
      }

      setEditingId(null);
      setNewTitle(''); 
      setNewDuration('60');
      setIsLiveEvent(false);
      setSaveAsFavorite(false);
      alert(editingId ? "Uppdraget har ändrats!" : "Tillagd i schemat!");
    } catch (err) {
      console.error(err);
      alert("Något gick fel vid sparning.");
    }
  };

  const handleEdit = (activity) => {
      setEditingId(activity.id);
      setNewTitle(activity.title);
      
      const d = new Date(activity.startTime);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setNewDate(`${year}-${month}-${day}`);
      setNewTime(d.toLocaleTimeString('sv-SE', {hour: '2-digit', minute:'2-digit'}));
      
      setNewDuration(activity.duration.toString());
      setNewPrepTime((activity.prepTime || 0).toString());
      setIsLiveEvent(activity.isLiveEvent || false);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShift = async (activity, mins) => {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedule_items', activity.id);
      const shiftMs = mins * 60 * 1000;
      await updateDoc(docRef, { 
          startTime: activity.startTime + shiftMs, 
          endTime: activity.endTime + shiftMs 
      });
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm("Vill du ta bort denna aktivitet?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedule_items', id));
    }
  };

  const handleQuickPick = (task) => {
    setNewTitle(task.title);
    setNewDuration(task.duration.toString());
    setNewPrepTime((task.prepTime || 0).toString());
  };

  const handleUpdateBank = async (amount) => {
    const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
    await updateDoc(bankDoc, { balance: (bankBalance || 0) + amount });
  };

  const setBankZero = async () => {
      const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
      await updateDoc(bankDoc, { balance: 0 });
  };

  const setStreakZero = async () => {
      const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
      await updateDoc(bankDoc, { streak: 0 });
      alert("Streaken är nu nollställd!");
  };

  const resetDailyQuests = async () => {
      const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
      await updateDoc(bankDoc, { claimedQuests: {} });
      alert("Dagens uppdrag är nu upplåsta igen!");
  };

  const handleSaveMessageAndSettings = async () => {
    const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
    await updateDoc(bankDoc, { 
        adminName: localName, 
        dailyMessage: localMessage,
        bedtime: localBedtime
    });
    alert("Meddelande och inställningar sparade!");
  };

  // --- GEMENSAM KORT-STIL FÖR GLASSMORPHISM ---
  const glassCardClass = "bg-white/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/60 relative overflow-hidden";
  const inputClass = "w-full bg-white/60 backdrop-blur-md border border-white/80 p-4 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-800 shadow-inner";

  return (
    // Yttre container med mjuk, ljus gradient/bild som lyser igenom glassmorphism-korten
    <div 
      className="min-h-screen bg-cover bg-fixed bg-center relative pb-24"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509803874385-db7c23652552?auto=format&fit=crop&q=80&w=1200')" }}
    >
      <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[10px] pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-6 px-3 pt-6 max-w-lg mx-auto">
        
        {/* --- PREMIUM TOGGLE STIL --- */}
        <style>{`
          .premium-toggle-input { display: none; }
          .premium-toggle {
            position: relative; width: 44px; height: 24px;
            background-color: rgba(255,255,255,0.6);
            border: 1px solid rgba(255,255,255,0.8);
            border-radius: 99px; cursor: pointer; transition: all 0.3s;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
          }
          .premium-toggle-thumb {
            position: absolute; top: 1px; left: 1px;
            width: 20px; height: 20px;
            background-color: white; border-radius: 99px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          }
          .premium-toggle-input:checked + .premium-toggle { background-color: #3b82f6; border-color: #2563eb; }
          .premium-toggle-input:checked + .premium-toggle .premium-toggle-thumb { transform: translateX(20px); }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* --- 1. DAGENS MEDDELANDE & INSTÄLLNINGAR --- */}
        <div className={glassCardClass}>
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="💬" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm">Meddelande & Tid</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Avsändare</label>
              <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="T.ex. Mamma" className={inputClass} />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Meddelande</label>
              <textarea value={localMessage} onChange={e => setLocalMessage(e.target.value)} placeholder="Skriv något peppande..." className={`${inputClass} min-h-[100px] resize-none leading-relaxed`} />
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Standard Läggdags</label>
              <input type="time" value={localBedtime} onChange={e => setLocalBedtime(e.target.value)} className={`${inputClass} font-clock`} />
            </div>
            
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveMessageAndSettings} className="w-full bg-blue-600/90 backdrop-blur-sm text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.4)] mt-2 border border-blue-400">
              Spara Uppgifter
            </motion.button>
          </div>
        </div>

        {/* --- 2. BULK-LADDARE (SKOLDAG) --- */}
        <div className={glassCardClass}>
          <div className="flex items-center gap-3 mb-2">
            <PremiumEmoji emoji="🎒" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm">Komplett Skoldag</h3>
          </div>
          <p className="text-xs text-slate-600 font-bold mb-6">Lägger in Frukost, Skola, Middag, Klockan & Läsning på ett klick.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleLoadSchoolDay(false)} className="w-full bg-white/70 backdrop-blur-md border border-white text-slate-700 font-black uppercase tracking-widest p-4 rounded-xl shadow-sm text-xs hover:bg-white transition-colors">
              Lägg in för IDAG
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleLoadSchoolDay(true)} className="w-full bg-blue-600/90 backdrop-blur-sm text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-md text-xs border border-blue-400">
              Lägg in för IMORGON
            </motion.button>
          </div>
        </div>

        {/* --- 3. BANK & SALDO --- */}
        <div className={glassCardClass}>
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="💳" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm">Hantera Banken</h3>
          </div>
          
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center mb-6 border border-white/60 shadow-inner">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nuvarande Saldo</span>
            <div className="text-5xl font-black text-slate-800 font-clock">{bankBalance || 0} <span className="text-xl text-slate-500 font-sans tracking-widest">kr</span></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-50)} className="bg-white/70 border border-white text-slate-700 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white">- 50</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(50)} className="bg-white/70 border border-white text-slate-700 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white">+ 50</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-100)} className="bg-white/70 border border-white text-slate-700 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white">- 100</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(100)} className="bg-white/70 border border-white text-slate-700 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white">+ 100</motion.button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
             <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => {
                    if(confirmReset) { setBankZero(); setConfirmReset(false); } 
                    else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); }
                }} 
                className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-colors border ${confirmReset ? 'bg-red-500 text-white border-red-600' : 'bg-white/60 text-slate-600 border-white hover:bg-white'}`}
             >
                {confirmReset ? "Tryck igen för att bekräfta" : "Nolla Saldot"}
             </motion.button>
             <motion.button whileTap={{ scale: 0.95 }} onClick={setStreakZero} className="flex-1 py-3.5 bg-white/60 text-slate-600 border border-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-white transition-colors">
                Nolla Streak
             </motion.button>
             <motion.button whileTap={{ scale: 0.95 }} onClick={resetDailyQuests} className="flex-1 py-3.5 bg-white/60 text-slate-600 border border-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-white transition-colors">
                Lås upp uppdrag
             </motion.button>
          </div>
        </div>

        {/* --- 4. LÄGG TILL / ÄNDRA UPPDRAG --- */}
        <div className={glassCardClass}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <PremiumEmoji emoji="✨" className="w-8 h-8" />
                <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm">
                    {editingId ? 'Ändra Uppdrag' : 'Nytt Uppdrag'}
                </h3>
            </div>
            {editingId && (
                <button onClick={() => { setEditingId(null); setNewTitle(''); }} className="text-[10px] font-black text-slate-500 bg-white/60 border border-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Avbryt ändring</button>
            )}
          </div>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Dina sparade favoriter</p>
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 hide-scrollbar snap-x">
            {favorites.map((task, i) => (
              <button 
                key={i} 
                onClick={() => handleQuickPick(task)}
                className="flex-shrink-0 snap-start bg-white/70 backdrop-blur-md text-slate-700 border border-white px-4 py-2.5 rounded-full flex items-center gap-2 active:scale-95 transition-all shadow-sm hover:bg-white"
              >
                <span className="drop-shadow-sm">{task.icon || "⭐"}</span>
                <span className="font-bold text-[11px] uppercase tracking-wider">{task.title}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Vad ska göras?</label>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="T.ex. Duscha..." className={inputClass} required={!isLiveEvent} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Datum</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Tid</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className={`${inputClass} font-clock`} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Längd (Hur länge?)</label>
                <select value={newDuration} onChange={e => setNewDuration(e.target.value)} className={inputClass}>
                  <option value="15">15 Minuter</option>
                  <option value="30">30 Minuter</option>
                  <option value="45">45 Minuter</option>
                  <option value="60">1 Timme</option>
                  <option value="120">2 Timmar</option>
                  <option value="180">3 Timmar</option>
                  <option value="450">7.5 Timmar (Skoldag)</option>
                  <option value="540">9 Timmar (Sova)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Förberedelsetid</label>
                <select value={newPrepTime} onChange={e => setNewPrepTime(e.target.value)} className={inputClass}>
                  <option value="0">Inget larm innan</option>
                  <option value="5">Larma 5 min innan</option>
                  <option value="10">Larma 10 min innan</option>
                  <option value="15">Larma 15 min innan</option>
                </select>
              </div>
            </div>

            {/* iOS Style Glass Toggles */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <label className="flex-1 flex items-center justify-between p-4 rounded-xl cursor-pointer bg-white/50 border border-white/80 shadow-sm hover:bg-white/70 transition-colors">
                    <span className="font-black uppercase text-[10px] tracking-widest text-slate-600 flex items-center gap-2">⭐ Spara som favorit</span>
                    <input type="checkbox" checked={saveAsFavorite} onChange={e => setSaveAsFavorite(e.target.checked)} className="premium-toggle-input" />
                    <div className="premium-toggle"><div className="premium-toggle-thumb"></div></div>
                </label>

                <label className="flex-1 flex items-center justify-between p-4 rounded-xl cursor-pointer bg-white/50 border border-white/80 shadow-sm hover:bg-white/70 transition-colors">
                    <span className="font-black uppercase text-[10px] tracking-widest text-slate-600 flex items-center gap-2">🚨 Steal a Brainroth</span>
                    <input type="checkbox" checked={isLiveEvent} onChange={e => setIsLiveEvent(e.target.checked)} className="premium-toggle-input" />
                    <div className="premium-toggle"><div className="premium-toggle-thumb"></div></div>
                </label>
            </div>
            
            <motion.button whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-slate-800/90 backdrop-blur-sm text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-lg mt-4 border border-slate-700">
              {editingId ? 'Spara Ändringar' : 'Lägg till i schemat'}
            </motion.button>
          </form>

          {/* --- AKTUELLT SCHEMA LISTA --- */}
          <div className="mt-12 pt-6 border-t border-slate-300/30">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Inplanerat framöver</p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
              {activities.length === 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/60 shadow-sm">
                  <span className="text-3xl mb-3 block opacity-80">✨</span>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Schemat är tomt</p>
                </div>
              )}
              
              {activities.filter(a => a.endTime > Date.now()).map(a => (
                <div key={a.id} className="flex flex-col bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow gap-3">
                  <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-[15px] text-slate-800">{a.isLiveEvent ? '🚨 LIVE EVENT' : a.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 font-clock">
                            {new Date(a.startTime).toLocaleString('sv-SE', {weekday:'short', hour:'2-digit', minute:'2-digit'})} • {a.duration} min
                        </p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => handleEdit(a)} className="bg-white/80 text-slate-600 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-white transition-colors" title="Ändra">
                              ✏️
                          </button>
                          <button onClick={() => handleDeleteActivity(a.id)} className="bg-white/80 text-red-500 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-white transition-colors" title="Ta bort">
                              🗑️
                          </button>
                      </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                      <button onClick={() => handleShift(a, -15)} className="flex-1 bg-white/50 hover:bg-white text-slate-600 text-[10px] font-black uppercase py-2.5 rounded-xl border border-white shadow-sm transition-colors">-15 min</button>
                      <button onClick={() => handleShift(a, 15)} className="flex-1 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-[10px] font-black uppercase py-2.5 rounded-xl border border-blue-100 shadow-sm transition-colors">+15 min</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- 5. LÅS APPEN IGEN (LÄNGST NER - GLASSMORPHISM) --- */}
      <div className="pt-4 pb-8 max-w-lg mx-auto px-3">
        <motion.button 
          whileTap={{ scale: 0.98 }} 
          onClick={() => setIsUnlocked(false)} 
          className="w-full bg-slate-900/80 backdrop-blur-xl text-white font-black uppercase tracking-widest py-5 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-slate-700/50 flex items-center justify-center gap-3 relative z-10"
        >
          <PremiumEmoji emoji="🔒" className="w-6 h-6" /> Lås appen igen
        </motion.button>
      </div>
      
    </div>
  );
};

export default AdminTab;