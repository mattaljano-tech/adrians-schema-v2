import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Unlock, Plus, Trash2, CreditCard, MessageSquare, Save, CalendarPlus } from 'lucide-react';

const AdminTab = ({ activities, bankBalance, dailyMessage, adminName }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  
  const SECRET_PASSWORD = "sevil";
  const appId = 'gaming-schema-app-light';

  // Formulär states
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('15:00');
  const [newDuration, setNewDuration] = useState('60');
  const [localMessage, setLocalMessage] = useState(dailyMessage || '');
  const [localName, setLocalName] = useState(adminName || '');

  // --- LÅSSKÄRMEN (Med mjuk styling) ---
  if (!isUnlocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-xl text-center w-full max-w-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-200 shadow-inner">
            <Lock size={40} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-black uppercase text-slate-800 mb-2">Föräldraläge</h2>
          <p className="text-sm font-bold text-slate-500 mb-6">Lås upp för att ändra schemat</p>
          
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (password.toLowerCase() === SECRET_PASSWORD) setIsUnlocked(true);
                else { alert("Fel lösenord!"); setPassword(''); }
              }
            }}
            placeholder="Lösenord..."
            className="w-full bg-slate-50 p-4 rounded-2xl text-center text-xl font-bold outline-none border-2 border-slate-200 focus:border-blue-400 transition-colors mb-4"
          />
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (password.toLowerCase() === SECRET_PASSWORD) setIsUnlocked(true);
              else { alert("Fel lösenord!"); setPassword(''); }
            }}
            className="w-full bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_6px_0_rgb(29,78,216)] hover:bg-blue-400 active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
          >
            <Unlock size={20} /> Lås upp
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // --- FUNKTIONER ---
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
    } catch (err) { console.error(err); alert("Något gick fel."); }
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

  // --- ADMIN-PANELEN ---
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 pt-4">
      
      {/* 1. DAGENS MEDDELANDE */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-blue-100 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-md"><MessageSquare size={24} /></div>
          <h3 className="text-xl font-black text-slate-800 uppercase leading-none">Dagens Pepp</h3>
        </div>
        <div className="space-y-3 relative z-10">
          <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Ditt namn..." className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none focus:border-blue-400 border-2 border-slate-200 transition-colors" />
          <textarea value={localMessage} onChange={e => setLocalMessage(e.target.value)} placeholder="Skriv något snällt..." className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none focus:border-blue-400 border-2 border-slate-200 transition-colors min-h-[100px] resize-none" />
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveMessage} className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black uppercase text-xs tracking-widest shadow-[0_6px_0_rgb(29,78,216)] hover:bg-blue-400 active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2">
            <Save size={16} /> Spara Meddelande
          </motion.button>
        </div>
      </div>

      {/* 2. BANKEN */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-emerald-100 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-md"><CreditCard size={24} /></div>
          <h3 className="text-xl font-black text-slate-800 uppercase leading-none">Justera Saldo</h3>
        </div>
        <div className="text-4xl font-black text-center text-slate-700 mb-4">{bankBalance} kr</div>
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(-50)} className="bg-red-100 text-red-600 border-2 border-red-200 py-3 rounded-2xl font-black text-lg">- 50</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateBank(50)} className="bg-emerald-100 text-emerald-600 border-2 border-emerald-200 py-3 rounded-2xl font-black text-lg">+ 50</motion.button>
        </div>
      </div>

      {/* 3. LÄGG TILL I SCHEMA */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-amber-100 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-amber-400 text-amber-900 p-3 rounded-2xl shadow-md"><CalendarPlus size={24} /></div>
          <h3 className="text-xl font-black text-slate-800 uppercase leading-none">Nytt i schemat</h3>
        </div>
        <form onSubmit={handleAddActivity} className="space-y-3">
          <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="T.ex. Duscha, Läxa..." className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-amber-400" required />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-amber-400" required />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-amber-400" required />
          </div>
          <select value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-amber-400">
            <option value="15">15 Minuter</option>
            <option value="30">30 Minuter</option>
            <option value="45">45 Minuter</option>
            <option value="60">1 Timme</option>
            <option value="120">2 Timmar</option>
          </select>
          <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full bg-amber-400 text-amber-900 font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_6px_0_rgb(217,119,6)] hover:bg-amber-300 active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2">
            <Plus size={20} /> Spara i schemat
          </motion.button>
        </form>

        <div className="mt-8 space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b-2 border-slate-100 pb-2">Planerade aktiviteter</h4>
          {activities.length === 0 && <p className="text-xs font-bold text-slate-400 text-center py-4">Schemat är tomt.</p>}
          {activities.map(a => (
            <div key={a.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
              <div>
                <p className="font-black text-sm uppercase text-slate-700">{a.title}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">{new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'})}</p>
              </div>
              <button onClick={() => handleDeleteActivity(a.id)} className="bg-red-100 text-red-500 p-3 rounded-xl hover:bg-red-200 transition-colors shadow-sm">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
};

export default AdminTab;