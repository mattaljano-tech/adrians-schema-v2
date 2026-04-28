import React, { useState } from 'react';
import { motion } from 'framer-motion';

const fastQuests = [
  { id: 'q1', title: "Hjälpa till med disken", reward: 15, icon: "🍽️" },
  { id: 'q4', title: "Duka bordet", reward: 10, icon: "🥣" },
  { id: 'q2', title: "Städa ditt rum", reward: 20, icon: "🧹" },
  { id: 'q3', title: "Ta ut sopor & Återvinning", reward: 10, icon: "🗑️" },
  { id: 'q7', title: "Gymmet med Mamma", reward: 30, icon: "🏋️‍♀️" },
  { id: 'q8', title: "Spela fotboll med Mathias", reward: 30, icon: "⚽" },
];

const EarnTab = ({ bankBalance, handleClaim, claimedQuests }) => {
  
  // Funktion för att kolla om uppdraget redan är gjort idag
  const isClaimedToday = (id) => {
    if (!claimedQuests || !claimedQuests[id]) return false;
    const claimDateStr = new Date(claimedQuests[id]).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return claimDateStr === todayStr;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-6"
    >
      {/* Saldo-ruta (Lugn och tydlig) */}
      <div className="bg-white rounded-[2.5rem] p-8 border-4 border-slate-200 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 text-8xl -mt-4 -mr-4 pointer-events-none">💰</div>
        <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1 relative z-10">Ditt Saldo</p>
        <div className="text-6xl font-black text-slate-800 flex items-baseline justify-center gap-2 relative z-10">
          {bankBalance} <span className="text-2xl text-slate-400 font-bold">kr</span>
        </div>
      </div>

      <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-sm text-center">
        🎯 Dagens Uppdrag
      </h3>

      {/* Uppdrags-listan */}
      <div className="space-y-4 pb-8">
        {fastQuests.map(q => {
          const isDone = isClaimedToday(q.id);

          return (
            <motion.div 
              key={q.id}
              whileTap={!isDone ? { scale: 0.98 } : {}}
              className={`p-5 rounded-[2rem] border-4 transition-all flex items-center justify-between ${
                isDone 
                ? 'bg-slate-100 border-slate-200 opacity-60' 
                : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{q.icon}</span>
                <div className="flex flex-col text-left">
                  <span className={`text-sm sm:text-base font-black uppercase tracking-tight leading-tight ${isDone ? 'text-slate-400' : 'text-slate-700'}`}>
                    {q.title}
                  </span>
                  {isDone && <span className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Klar för idag! ✅</span>}
                </div>
              </div>

              <button
                onClick={() => !isDone && handleClaim(q.reward, q.id, q.title)}
                className={`shrink-0 px-4 py-3 rounded-xl font-black text-xs sm:text-sm uppercase transition-all ${
                  isDone 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-500 text-white shadow-md active:bg-emerald-600'
                }`}
              >
                {isDone ? 'Klar' : `+${q.reward} kr`}
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EarnTab;