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

  // --- HÄMTA FAVORITER FRÅN FIREBASE ---
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

  // --- LÅSSKÄRMEN ---
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1, x: shake ? [-10, 10, -10, 10, 0] : 0 }} 
          transition={{ duration: shake ? 0.4 : 0.3 }}
          className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-700/50 w-full max-w-sm flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-6 relative flex justify-center items-center">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30"></div>
            <PremiumEmoji emoji="🔒" className="w-20 h-20 relative z-10" />
          </div>
          <h2 className="text-xl font-black uppercase text-white mb-8 tracking-widest">Föräldraläge</h2>
          <div className="w-full relative mb-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="••••••"
              className="w-full bg-white/10 p-4 rounded-2xl text-center text-2xl tracking-[0.5em] font-black text-white outline-none border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/10 transition-all placeholder:text-slate-600"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUnlock}
            className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg transition-all border border-blue-500"
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

  // --- BANK & INSTÄLLNINGAR FUNKTIONER ---
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

  // --- GEMENSAMMA STILAR ---
  const inputClass = "w-full bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all shadow-sm text-slate-800";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 px-3 pt-6 max-w-lg mx-auto">
      
      {/* Skymmer rullisten (Scroll-hide hack) */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- 1. DAGENS MEDDELANDE (💬) --- */}
      <div className="relative bg-white/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden border border-white/60">
        <div className="relative z-10 flex flex-col w-full">
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="💬" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Dagens Meddelande</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Avsändare</label>
              <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Ditt namn..." className={inputClass} />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Meddelande</label>
              <textarea value={localMessage} onChange={e => setLocalMessage(e.target.value)} placeholder="Skriv något peppande..." className={`${inputClass} min-h-[120px] resize-none leading-relaxed`} />
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Standard Läggdags</label>
              <input type="time" value={localBedtime} onChange={e => setLocalBedtime(e.target.value)} className={`${inputClass} font-clock`} />
            </div>
            
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveMessageAndSettings} className="w-full bg-blue-600 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-lg mt-2 border border-blue-700">
              Spara Uppgifter
            </motion.button>
          </div>
        </div>
      </div>

      {/* --- 2. BULK-LADDARE (SKOLDAG MED BAKGRUND) --- */}
      <div className="relative bg-white/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Frostad bakgrundsbild (Skrivbord) */}
        <div className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-30 mix-blend-multiply" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595113300742-0570b5550f24?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/40 backdrop-blur-sm"></div>
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <PremiumEmoji emoji="🎒" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Komplett Skoldag</h3>
          </div>
          <p className="text-[11px] text-slate-600 font-bold mb-6">Lägger in Frukost, Skola, Middag, Klockan & Läsning.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleLoadSchoolDay(false)} className="w-full bg-white/90 backdrop-blur-md border border-slate-200 text-blue-700 font-black uppercase tracking-widest p-4 rounded-xl shadow-sm text-xs hover:bg-white transition-colors">
              Lägg in för IDAG
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleLoadSchoolDay(true)} className="w-full bg-blue-600 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-md text-xs border border-blue-700">
              Lägg in för IMORGON
            </motion.button>
          </div>
        </div>
      </div>

      {/* --- 3. BANK & SALDO (MED BAKGRUND) --- */}
      <div className="relative bg-white/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Frostad bakgrundsbild (Guldmynt) */}
        <div className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-30 mix-blend-multiply" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1610375228956-c65171d9a9f2?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/40 backdrop-blur-sm"></div>
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="💳" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Hantera Banken</h3>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center mb-6 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nuvarande Saldo</span>
            <div className="text-4xl font-black text-slate-800 font-clock">{bankBalance || 0} kr</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-50)} className="bg-white/90 backdrop-blur-sm border border-red-200 text-red-600 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white transition-colors">- 50 kr</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(50)} className="bg-white/90 backdrop-blur-sm border border-emerald-200 text-emerald-600 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white transition-colors">+ 50 kr</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-100)} className="bg-white/90 backdrop-blur-sm border border-red-200 text-red-600 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white transition-colors">- 100 kr</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(100)} className="bg-white/90 backdrop-blur-sm border border-emerald-200 text-emerald-600 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-white transition-colors">+ 100 kr</motion.button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-300/50">
             <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => {
                    if(confirmReset) { setBankZero(); setConfirmReset(false); } 
                    else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); }
                }} 
                className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-colors border ${confirmReset ? 'bg-red-600 text-white border-red-700' : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-white'}`}
             >
                {confirmReset ? "Tryck igen för bekräfta" : "Nolla Saldot"}
             </motion.button>
             <motion.button whileTap={{ scale: 0.95 }} onClick={setStreakZero} className="flex-1 py-3.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-orange-100 transition-colors">
                Nolla Streak
             </motion.button>
             <motion.button whileTap={{ scale: 0.95 }} onClick={resetDailyQuests} className="flex-1 py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-100 transition-colors">
                Lås upp uppdrag
             </motion.button>
          </div>
        </div>
      </div>

      {/* --- 4. LÄGG TILL / ÄNDRA UPPDRAG (✨) --- */}
      <div className="relative bg-white/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="relative z-10 flex flex-col w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <PremiumEmoji emoji="✨" className="w-8 h-8" />
                <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">
                    {editingId ? 'Ändra Uppdrag' : 'Nytt Uppdrag'}
                </h3>
            </div>
            {editingId && (
                <button onClick={() => { setEditingId(null); setNewTitle(''); }} className="text-[10px] font-black text-slate-500 bg-white/90 border border-slate-200 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm hover:bg-white">Avbryt ändring</button>
            )}
          </div>
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Dina sparade favoriter</p>
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 hide-scrollbar snap-x">
            {favorites.map((task, i) => (
              <button 
                key={i} 
                onClick={() => handleQuickPick(task)}
                className="flex-shrink-0 snap-start bg-white/90 backdrop-blur-md text-indigo-700 border border-indigo-100 px-4 py-2.5 rounded-full flex items-center gap-2 active:scale-95 transition-all shadow-sm hover:bg-white"
              >
                <span className="drop-shadow-sm">{task.icon || "⭐"}</span>
                <span className="font-bold text-[11px] uppercase tracking-wider">{task.title}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Vad ska göras?</label>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="T.ex. Duscha..." className={inputClass} required={!isLiveEvent} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Datum</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tid</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className={`${inputClass} font-clock`} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Hur länge?</label>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Förberedelsetid</label>
                <select value={newPrepTime} onChange={e => setNewPrepTime(e.target.value)} className={inputClass}>
                  <option value="0">Inget larm innan</option>
                  <option value="5">Larma 5 min innan</option>
                  <option value="10">Larma 10 min innan</option>
                  <option value="15">Larma 15 min innan</option>
                </select>
              </div>
            </div>

            {/* --- PREMIUM PILL TOGGLES --- */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div onClick={() => setSaveAsFavorite(!saveAsFavorite)} className={`flex-1 flex items-center justify-between p-4 rounded-xl cursor-pointer shadow-sm transition-colors border ${saveAsFavorite ? 'bg-indigo-50 border-indigo-200' : 'bg-white/90 border-slate-200 hover:bg-white'}`}>
                    <span className={`font-black uppercase text-[10px] tracking-widest ${saveAsFavorite ? 'text-indigo-700' : 'text-slate-500'}`}>⭐ Spara som favorit</span>
                    {/* Själva knappen (Pill) */}
                    <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${saveAsFavorite ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${saveAsFavorite ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>

                <div onClick={() => setIsLiveEvent(!isLiveEvent)} className={`flex-1 flex items-center justify-between p-4 rounded-xl cursor-pointer shadow-sm transition-colors border ${isLiveEvent ? 'bg-blue-50 border-blue-200' : 'bg-white/90 border-slate-200 hover:bg-white'}`}>
                    <span className={`font-black uppercase text-[10px] tracking-widest ${isLiveEvent ? 'text-blue-700' : 'text-slate-500'}`}>🚨 Steal a Brainroth</span>
                    {/* Själva knappen (Pill) */}
                    <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${isLiveEvent ? 'bg-blue-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isLiveEvent ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>
            </div>
            
            <motion.button whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-slate-800 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-lg mt-4 border border-slate-700 hover:bg-slate-700 transition-colors">
              {editingId ? 'Spara Ändringar' : 'Lägg till i schemat'}
            </motion.button>
          </form>

          {/* --- AKTUELLT SCHEMA LISTA --- */}
          <div className="mt-12 pt-6 border-t border-slate-300/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Inplanerat framöver</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
              {activities.length === 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                  <span className="text-3xl mb-3 block opacity-80">✨</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schemat är tomt</p>
                </div>
              )}
              
              {activities.filter(a => a.endTime > Date.now()).map(a => (
                <div key={a.id} className="flex flex-col bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow gap-3">
                  <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-[15px] text-slate-800">{a.isLiveEvent ? '🚨 LIVE EVENT' : a.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            {new Date(a.startTime).toLocaleString('sv-SE', {weekday:'short', hour:'2-digit', minute:'2-digit'})} • {a.duration} min
                        </p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => handleEdit(a)} className="bg-slate-50 border border-slate-200 text-slate-500 w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm" title="Ändra">
                              ✏️
                          </button>
                          <button onClick={() => handleDeleteActivity(a.id)} className="bg-red-50 border border-red-200 text-red-500 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm" title="Ta bort">
                              🗑️
                          </button>
                      </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => handleShift(a, -15)} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase py-2.5 rounded-xl border border-slate-200 shadow-sm transition-colors">-15 min</button>
                      <button onClick={() => handleShift(a, 15)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black uppercase py-2.5 rounded-xl border border-blue-200 shadow-sm transition-colors">+15 min</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- 5. LÅS APPEN IGEN (LÄNGST NER) --- */}
      <div className="pt-8 pb-4">
        <motion.button 
          whileTap={{ scale: 0.98 }} 
          onClick={() => setIsUnlocked(false)} 
          className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-slate-700 flex items-center justify-center gap-3 transition-colors hover:bg-slate-800"
        >
          <span className="text-xl">🔒</span> Lås appen igen
        </motion.button>
      </div>

    </motion.div>
  );
};

export default AdminTab;