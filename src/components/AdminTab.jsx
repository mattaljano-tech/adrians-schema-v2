import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, User, CalendarPlus, ShieldCheck } from 'lucide-react'; 

const AdminTab = ({ dailyMessage, adminName }) => {
  const [localName, setLocalName] = useState(adminName || '');
  const [localMessage, setLocalMessage] = useState(dailyMessage || '');

  const handleSaveMessage = () => {
    // Din logik för att spara här...
    console.log("Sparat!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="space-y-6 pb-20"
    >
      {/* --- TYDLIG RUBRIK --- */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2">
        <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-3 shadow-sm">
          <ShieldCheck size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
          Föräldraläge
        </h2>
        <p className="text-sm font-bold text-slate-500 mt-1">
          Här ställer du in Adrians dag
        </p>
      </div>

      {/* --- KORT 1: DAGENS MEDDELANDE --- */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-blue-100 shadow-xl relative overflow-hidden">
        
        {/* Dekorativ bakgrundscirkel för att göra det lite lekfullt men lugnt */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-md">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase leading-none">
                Pepp & Meddelande
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {/* Input för Namn */}
            <div className="relative">
              <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={localName} 
                onChange={e => setLocalName(e.target.value)} 
                placeholder="Vem skickar (t.ex. Pappa)?" 
                className="w-full bg-slate-50 p-4 pl-12 rounded-2xl text-base font-bold text-slate-700 outline-none focus:border-blue-400 border-2 border-slate-200 transition-colors" 
              />
            </div>

            {/* Input för Meddelande */}
            <textarea 
              value={localMessage} 
              onChange={e => setLocalMessage(e.target.value)} 
              placeholder="Skriv något snällt till Adrian idag..." 
              className="w-full bg-slate-50 p-4 rounded-2xl text-base font-bold text-slate-700 outline-none focus:border-blue-400 border-2 border-slate-200 transition-colors min-h-[120px] resize-none" 
            />

            {/* Lugn, taktil knapp */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveMessage} 
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black uppercase text-sm tracking-widest shadow-[0_8px_0_rgb(29,78,216)] hover:bg-blue-400 active:shadow-[0_0px_0_rgb(29,78,216)] active:translate-y-2 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> Spara Meddelande
            </motion.button>
          </div>
        </div>
      </div>

      {/* --- KORT 2: LÄGG TILL I SCHEMA (Exempel) --- */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-emerald-100 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-md">
              <CalendarPlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase leading-none">
                Ny Aktivitet
              </h3>
            </div>
          </div>
          
          <button className="w-full py-6 rounded-2xl border-4 border-dashed border-slate-200 text-slate-400 font-black uppercase text-sm hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
            <CalendarPlus size={20} /> Klicka för att lägga till
          </button>
        </div>
      </div>

    </motion.div>
  );
};

export default AdminTab;