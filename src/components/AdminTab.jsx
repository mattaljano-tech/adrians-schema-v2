import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminTab = ({ activities, bankBalance, dailyMessage, adminName }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  
  const SECRET_PASSWORD = "sevil";
  const appId = 'test-schema-v2';

  // Formulär-states för enstaka uppdrag
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('15:00');
  const [newDuration, setNewDuration] = useState('60');

  const [localMessage, setLocalMessage] = useState(dailyMessage || '');
  const [localName, setLocalName] = useState(adminName || 'Din kompis');

  // Snabbval för ENSTAKA uppdrag
  const quickTasks = [
    { title: 'Duscha', duration: '15', icon: '🚿', time: '19:00' },
    { title: 'Skärmtid', duration: '60', icon: '📱', time: '16:00' },
    { title: 'Speltid', duration: '60', icon: '🎮', time: '18:00' },
    { title: 'Göra läxor', duration: '30', icon: '📚', time: '15:30' },
    { title: 'Göra i ordning', duration: '30', icon: '🪥', time: '19:30' },
    { title: 'Läggdags', duration: '540', icon: '😴', time: '20:00' },
  ];

  if (!isUnlocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-20">
        <div className="bg-white p-8 rounded-3xl border-4 border-slate-200 shadow-sm text-center w-full max-w-xs">
          <span className="text-6xl mb-4 block">🔐</span>
          <h2 className="text-xl font-black uppercase text-slate-700 mb-4">Föräldraläge</h2>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord..."
            className="w-full bg-slate-100 p-4 rounded-xl text-center font-bold outline-none border-2 border-slate-200 focus:border-blue-500 mb-4"
          />
          <button 
            onClick={() => {
              if (password.toLowerCase() === SECRET_PASSWORD) {
                setIsUnlocked(true);
              } else {
                alert("Fel lösenord!");
                setPassword('');
              }
            }}
            className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-transform"
          >
            Lås upp
          </button>
        </div>
      </motion.div>
    );
  }

  // --- FUNKTION: LADDA HEL SKOLDAG (BULK) ---
  const handleLoadSchoolDay = async (isTomorrow) => {
    const dayStr = isTomorrow ? 'imorgon' : 'idag';
    if (!window.confirm(`Vill du ladda in en komplett skoldag för ${dayStr}?`)) return;

    const baseDate = new Date();
    if (isTomorrow) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();

    // Din exakta lista på händelser
    const dailyRoutine = [
      { title: 'Frukost', h: 7, min: 0, duration: 30 },
      { title: 'Skola', h: 8, min: 0, duration: 450 }, // 450 min = 7.5 h (slutar 15:30)
      { title: 'Middag', h: 18, min: 0, duration: 30 },
      { title: 'Lära sig klockan', h: 19, min: 0, duration: 15 },
      { title: 'Läsa', h: 19, min: 15, duration: 30 }
    ];

    try {
      const colPath = collection(db, 'artifacts', appId, 'public', 'data', 'schedule_items');
      
      // Skapa alla uppdrag samtidigt
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

  // --- ENSTAKA UPPDRAG ---
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      <div className="bg-slate-800 text-white p-6 rounded-3xl text-center shadow-lg">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Admin Panel</h2>
        <button onClick={() => setIsUnlocked(false)} className="text-xs bg-slate-700 px-4 py-2 rounded-full font-bold">Lås appen igen</button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-200 shadow-sm">
        <h3 className="font-black uppercase text-slate-700 mb-4">💳 Justera Saldo</h3>
        <div className="text-3xl font-black text-center mb-4">{bankBalance} kr</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleUpdateBank(-50)} className="bg-red-100 text-red-600 p-3 rounded-xl font-bold">- 50 kr</button>
          <button onClick={() => handleUpdateBank(50)} className="bg-emerald-100 text-emerald-600 p-3 rounded-xl font-bold">+ 50 kr</button>
          <button onClick={() => handleUpdateBank(-100)} className="bg-red-100 text-red-600 p-3 rounded-xl font-bold">- 100 kr</button>
          <button onClick={() => handleUpdateBank(100)} className="bg-emerald-100 text-emerald-600 p-3 rounded-xl font-bold">+ 100 kr</button>
        </div>
      </div>

      {/* NY BULK-LADDARE FÖR HELA DAGEN */}
      <div className="bg-blue-50 p-6 rounded-[2rem] border-4 border-blue-200 shadow-sm text-center">
        <h3 className="font-black uppercase text-blue-900 mb-2">🎒 Ladda Komplett Skoldag</h3>
        <p className="text-xs text-blue-700 font-bold mb-4">Lägger in Frukost, Skola, Middag, Klockan & Läsning på ett klick!</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleLoadSchoolDay(false)} className="bg-white border-2 border-blue-300 text-blue-700 font-black uppercase p-3 rounded-xl shadow-sm active:scale-95 transition-transform text-xs">
            1. För IDAG
          </button>
          <button onClick={() => handleLoadSchoolDay(true)} className="bg-blue-600 border-2 border-blue-800 text-white font-black uppercase p-3 rounded-xl shadow-sm active:scale-95 transition-transform text-xs">
            2. För IMORGON
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-200 shadow-sm">
        <h3 className="font-black uppercase text-slate-700 mb-2">📅 Lägg till enstaka uppdrag</h3>
        
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Snabbval</p>
        <div className="flex overflow-x-auto gap-2 pb-4 mb-2 -mx-2 px-2 snap-x">
          {quickTasks.map((task, i) => (
            <button 
              key={i} 
              onClick={() => handleQuickPick(task)}
              className="shrink-0 bg-slate-50 border-2 border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all snap-start text-slate-700"
            >
              <span className="text-xl">{task.icon}</span>
              <span className="font-bold text-sm whitespace-nowrap">{task.title}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleAddActivity} className="space-y-3">
          <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="T.ex. Duscha, Läxa..." className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-blue-500" required />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none" required />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none" required />
          </div>
          <select value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none">
            <option value="15">15 Minuter</option>
            <option value="30">30 Minuter</option>
            <option value="45">45 Minuter</option>
            <option value="60">1 Timme</option>
            <option value="120">2 Timmar</option>
            <option value="180">3 Timmar</option>
            <option value="450">7.5 Timmar (Skoldag)</option>
            <option value="540">9 Timmar (Sova)</option>
          </select>
          <button type="submit" className="w-full bg-slate-800 text-white font-black uppercase p-4 rounded-xl shadow-md active:scale-95 transition-transform">Spara i schemat</button>
        </form>

        <div className="mt-6 space-y-2 max-h-48 overflow-y-auto pr-2">
          {activities.length === 0 && <p className="text-xs font-bold text-slate-400 text-center">Schemat är tomt.</p>}
          {activities.map(a => (
            <div key={a.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <p className="font-black text-sm uppercase text-slate-700">{a.title}</p>
                <p className="text-[10px] font-bold text-slate-500">{new Date(a.startTime).toLocaleString('sv-SE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
              </div>
              <button onClick={() => handleDeleteActivity(a.id)} className="bg-red-100 text-red-600 p-2 rounded-lg text-xs font-bold hover:bg-red-200">Ta bort</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-200 shadow-sm">
        <h3 className="font-black uppercase text-slate-700 mb-4">💬 Dagens Meddelande</h3>
        <div className="space-y-3">
          <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Ditt namn..." className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-blue-500" />
          <textarea value={localMessage} onChange={e => setLocalMessage(e.target.value)} placeholder="Skriv något peppande..." className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-blue-500 min-h-[100px]" />
          <button onClick={handleSaveMessage} className="w-full bg-blue-600 text-white font-black uppercase p-4 rounded-xl shadow-md active:scale-95 transition-transform">Spara Meddelande</button>
        </div>
      </div>

    </motion.div>
  );
};

export default AdminTab;