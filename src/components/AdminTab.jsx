import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

const AdminTab = ({ activities, bankBalance, dailyMessage, adminName }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false); 
  
  const SECRET_PASSWORD = "sevil";
  const appId = 'test-schema-v2';

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('15:00');
  const [newDuration, setNewDuration] = useState('60');

  const [localMessage, setLocalMessage] = useState(dailyMessage || '');
  const [localName, setLocalName] = useState(adminName || 'Din kompis');

  const quickTasks = [
    { title: 'Duscha', duration: '15', icon: '🚿', time: '19:00', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    { title: 'Skärmtid', duration: '60', icon: '📱', time: '16:00', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    { title: 'Speltid', duration: '60', icon: '🎮', time: '18:00', bg: 'bg-purple-50', text: 'text-purple-700' },
    { title: 'Göra läxor', duration: '30', icon: '📚', time: '15:30', bg: 'bg-amber-50', text: 'text-amber-700' },
    { title: 'Göra i ordning', duration: '30', icon: '🪥', time: '19:30', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { title: 'Läggdags', duration: '540', icon: '😴', time: '20:00', bg: 'bg-slate-100', text: 'text-slate-700' },
  ];

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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUnlock}
            className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg transition-all border border-blue-500"
          >
            Lås upp
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- FUNKTIONER ---
  const handleLoadSchoolDay = async (isTomorrow) => {
    const dayStr = isTomorrow ? 'imorgon' : 'idag';
    if (!window.confirm(`Vill du ladda in en komplett skoldag för ${dayStr}?`)) return;

    const baseDate = new Date();
    if (isTomorrow) baseDate.setDate(baseDate.getDate() + 1);
    
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();

    const dailyRoutine = [
      { title: 'Frukost', h: 7, min: 0, duration: 30 },
      { title: 'Skola', h: 8, min: 0, duration: 450 },
      { title: 'Middag', h: 18, min: 0, duration: 30 },
      { title: 'Lära sig klockan', h: 19, min: 0, duration: 15 },
      { title: 'Läsa', h: 19, min: 15, duration: 30 }
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
    if (!newTitle || !newTime || !newDate) return;

    const [y, m, d] = newDate.split('-').map(Number);
    const [h, min] = newTime.split(':').map(Number);
    const startMs = new Date(y, m - 1, d, h, min).getTime();

    try {
      const colPath = collection(db, 'artifacts', appId, 'public', 'data', 'schedule_items');
      await addDoc(colPath, {
        title: newTitle,
        startTime: startMs,
        endTime: startMs + (Number(newDuration) * 60 * 1000),
        duration: Number(newDuration),
        createdAt: Date.now()
      });
      alert("Tillagd i schemat!");
      setNewTitle(''); 
    } catch (err) {
      console.error(err);
      alert("Något gick fel.");
    }
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm("Vill du ta bort denna?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedule_items', id));
    }
  };

  const handleUpdateBank = async (amount) => {
    const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
    await updateDoc(bankDoc, { balance: bankBalance + amount });
  };

  const handleSaveMessage = async () => {
    const bankDoc = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');
    await updateDoc(bankDoc, { adminName: localName, dailyMessage: localMessage });
    alert("Meddelande sparat!");
  };

  const handleQuickPick = (task) => {
    setNewTitle(task.title);
    setNewDuration(task.duration);
    setNewTime(task.time);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12 px-2 pt-4">
      
      {/* HEADER / LÅS APPEN */}
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0f172a] text-white p-6 rounded-3xl text-center shadow-lg border border-slate-700/50 flex flex-col items-center relative overflow-hidden">
        <div className="absolute -right-6 -top-10 opacity-10 pointer-events-none select-none blur-[1px] rotate-12">
            <PremiumEmoji emoji="💳" className="w-32 h-32" />
        </div>
        
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Admin Panel</h2>
        <button onClick={() => setIsUnlocked(false)} className="relative z-10 text-xs bg-slate-700/60 px-5 py-2 rounded-full font-black uppercase tracking-widest border border-slate-600 flex items-center gap-2"><span>🔒</span> Lås appen igen</button>
      </div>

      {/* --- BULK-LADDARE (SKOLDAG) --- */}
      <div className="relative bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/50"></div>
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <PremiumEmoji emoji="🎒" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Komplett Skoldag</h3>
          </div>
          <p className="text-[11px] text-slate-600 font-bold mb-6">Lägger in Frukost, Skola, Middag, Klockan & Läsning på ett klick.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleLoadSchoolDay(false)} className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 text-blue-700 font-black uppercase tracking-widest p-4 rounded-xl shadow-sm text-xs">
              Lägg in för IDAG
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleLoadSchoolDay(true)} className="w-full bg-blue-600 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-sm text-xs border border-blue-700">
              Lägg in för IMORGON
            </motion.button>
          </div>
        </div>
      </div>

      {/* --- BANK & SALDO --- */}
      <div className="relative bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/50"></div>
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="💳" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Justera Saldo</h3>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center mb-6 border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nuvarande</span>
            <div className="text-4xl font-black text-slate-800 font-clock">{bankBalance} kr</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-50)} className="bg-white/90 backdrop-blur-sm border border-red-100 text-red-600 py-3 rounded-xl font-black text-sm shadow-sm">- 50 kr</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(50)} className="bg-white/90 backdrop-blur-sm border border-emerald-100 text-emerald-600 py-3 rounded-xl font-black text-sm shadow-sm">+ 50 kr</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-100)} className="bg-white/90 backdrop-blur-sm border border-red-100 text-red-600 py-3 rounded-xl font-black text-sm shadow-sm">- 100 kr</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(100)} className="bg-white/90 backdrop-blur-sm border border-emerald-100 text-emerald-600 py-3 rounded-xl font-black text-sm shadow-sm">+ 100 kr</motion.button>
          </div>
        </div>
      </div>

      {/* --- LÄGG TILL ENSTAKA UPPDRAG --- */}
      <div className="relative bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40"></div>
        
        <div className="relative z-10 flex flex-col w-full">
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="📅" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Nytt Uppdrag</h3>
          </div>
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Snabbval</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {quickTasks.map((task, i) => (
              <button 
                key={i} 
                onClick={() => handleQuickPick(task)}
                className={`${task.bg} ${task.text} border border-white/50 px-4 py-2.5 rounded-full flex items-center gap-2 active:scale-95 transition-all shadow-sm`}
              >
                <span>{task.icon}</span>
                <span className="font-bold text-[11px] uppercase tracking-wider">{task.title}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Vad ska göras?</label>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="T.ex. Duscha..." className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors shadow-sm" required />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Datum</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors text-slate-700 shadow-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tid</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl font-black font-clock outline-none focus:border-blue-500 transition-colors text-slate-700 shadow-sm" required />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Längd (Hur länge?)</label>
              <select value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors text-slate-700 shadow-sm">
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
            
            <motion.button whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-slate-800 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-md mt-2 border border-slate-700">
              Spara i schemat
            </motion.button>
          </form>

          {/* --- AKTUELLT SCHEMA LISTA --- */}
          <div className="mt-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Inplanerat just nu</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 hide-scrollbar">
              {activities.length === 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-slate-100 shadow-sm">
                  <span className="text-2xl mb-2 block">✨</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schemat är tomt</p>
                </div>
              )}
              
              {activities.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-black text-sm text-slate-800">{a.title}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      {new Date(a.startTime).toLocaleString('sv-SE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteActivity(a.id)} 
                    className="bg-red-50 text-red-500 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                    title="Ta bort"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- DAGENS MEDDELANDE --- */}
      <div className="relative bg-white p-6 sm:p-8 rounded-[2rem] border border-rose-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590794071375-9e6b4d326442?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40"></div>
        
        <div className="relative z-10 flex flex-col w-full">
          <div className="flex items-center gap-3 mb-6">
            <PremiumEmoji emoji="💬" className="w-8 h-8" />
            <h3 className="font-black uppercase tracking-widest text-slate-800 text-sm drop-shadow-sm">Dagens Meddelande</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Avsändare</label>
              <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Ditt namn..." className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-rose-400 transition-colors text-slate-800 shadow-sm" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Meddelande</label>
              <textarea value={localMessage} onChange={e => setLocalMessage(e.target.value)} placeholder="Skriv något peppande..." className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-rose-400 transition-colors min-h-[120px] resize-none text-slate-800 leading-relaxed shadow-sm" />
            </div>
            
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveMessage} className="w-full bg-rose-500 text-white font-black uppercase tracking-widest p-4 rounded-xl shadow-md mt-2 border border-rose-600">
              Spara Meddelande
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Scroll-hide hack */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default AdminTab;