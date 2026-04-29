import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM EMOJI ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-sm select-none pointer-events-none`} 
  />
);

// --- DELAD KOMPONENT: TIMER-RING (Samma som i Schema) ---
const TimerRing = ({ percentage, color = "#3b82f6" }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-linear"
      />
    </svg>
  );
};

// --- FLYING COIN ---
const FlyingCoin = ({ coin }) => {
  const [pos, setPos] = useState({ left: coin.startX, top: coin.startY, scale: 1, opacity: 1 });
  useEffect(() => {
    setTimeout(() => setPos({ left: coin.startX + coin.tx, top: coin.startY + coin.ty, scale: 0.2, opacity: 0 }), 50);
  }, [coin]);
  return (
    <div className="fixed z-[9999] pointer-events-none transition-all duration-[800ms] ease-in-out flex items-center justify-center font-black bg-yellow-400 text-yellow-900 border-2 border-yellow-500 rounded-full w-12 h-12 shadow-lg"
         style={{ left: pos.left - 24, top: pos.top - 24, transform: `scale(${pos.scale})`, opacity: pos.opacity }}>
      +{coin.amount}
    </div>
  );
};

const EarnTab = ({ bankBalance, bankStreak, handleClaim, claimedQuests }) => {
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [readTime, setReadTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [walkTime, setWalkTime] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [expandedQuest, setExpandedQuest] = useState(null);

  // --- UPPDRAGSDATA ---
  const quests = [
    { id: 'q1', title: "Hjälpa till med disken", reward: 15, icon: "🍽️", type: "simple" },
    { id: 'q4', title: "Duka bordet", reward: 10, icon: "🥣", type: "simple" },
    { id: 'q2', title: "Städa ditt rum", icon: "🧹", type: "checklist", tasks: [
      { id: 'c1', text: 'Plocka upp kläder', reward: 5 },
      { id: 'c2', text: 'Bädda sängen', reward: 5 }
    ]},
    { id: 'q10', title: "Hjärngympa & Lärande", icon: "🧠", type: "checklist", tasks: [
      { id: 'l1', text: 'Träna på klockan', reward: 5 },
      { id: 'l2', text: 'Träna på veckodagarna', reward: 5 }
    ]}
  ];

  // --- LOGIK ---
  useEffect(() => {
    let interval;
    if (isReading || isWalking) {
      interval = setInterval(() => {
        if (isReading) setReadTime(t => t + 1);
        if (isWalking) setWalkTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReading, isWalking]);

  const isDone = (id) => {
    if (!claimedQuests[id]) return false;
    return new Date(claimedQuests[id]).toDateString() === new Date().toDateString();
  };

  const triggerReward = (amount, e, id, title) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const bankRect = document.getElementById('bank-hero')?.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const tx = bankRect ? (bankRect.left + bankRect.width / 2) - startX : 0;
    const ty = bankRect ? (bankRect.top + bankRect.height / 2) - startY : -400;

    setFlyingCoins(prev => [...prev, { id: Math.random(), amount, startX, startY, tx, ty }]);
    handleClaim(amount, id, title);
    setTimeout(() => setFlyingCoins(prev => prev.slice(1)), 800);
  };

  const formatMinSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      {flyingCoins.map(c => <FlyingCoin key={c.id} coin={c} />)}

      {/* --- BANK HERO (Matchar SchemaTab) --- */}
      <div id="bank-hero" className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10 rotate-12 pointer-events-none">
          <PremiumEmoji emoji="💰" className="w-40 h-40" />
        </div>
        <div className="relative z-10">
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Ditt saldo</p>
          <div className="text-5xl font-black text-white font-clock flex items-baseline gap-2">
            {bankBalance} <span className="text-xl text-slate-500 font-sans tracking-normal">kronor</span>
          </div>
          {bankStreak > 0 && (
            <div className="mt-4 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-3 py-1 rounded-full w-max flex items-center gap-1.5 uppercase tracking-wider">
              <span>🔥</span> {bankStreak} dagars streak
            </div>
          )}
        </div>
      </div>

      {/* --- AKTIVA TIMERS (LÄSA / GÅ) --- */}
      <div className="grid grid-cols-1 gap-4">
        {/* Läs-kort */}
        <div className={`bg-white rounded-[2rem] p-5 border transition-all ${isReading ? 'border-orange-200 ring-4 ring-orange-50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 relative flex-shrink-0">
              <TimerRing percentage={(readTime % 600) / 6} color="#f97316" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PremiumEmoji emoji="📖" className="w-8 h-8" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-lg">Läs en bok</h3>
              <p className="text-slate-500 font-bold text-xs">10 kr per 10 minuter</p>
              <div className="mt-2 text-2xl font-black text-slate-700 font-clock">{formatMinSec(readTime)}</div>
            </div>
            <button 
              onClick={() => setIsReading(!isReading)}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isReading ? 'bg-orange-100 text-orange-600' : 'bg-blue-600 text-white shadow-md active:scale-95'}`}
            >
              {isReading ? 'Pausa' : 'Starta'}
            </button>
          </div>
        </div>

        {/* Gå-kort */}
        <div className={`bg-white rounded-[2rem] p-5 border transition-all ${isWalking ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 relative flex-shrink-0">
              <TimerRing percentage={(walkTime % 60) * 1.66} color="#10b981" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PremiumEmoji emoji="🏃‍♂️" className="w-8 h-8" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-lg">Gå ut och gå</h3>
              <p className="text-slate-500 font-bold text-xs">1 kr per minut</p>
              <div className="mt-2 text-2xl font-black text-slate-700 font-clock">{formatMinSec(walkTime)}</div>
            </div>
            <button 
              onClick={() => setIsWalking(!isWalking)}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isWalking ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-600 text-white shadow-md active:scale-95'}`}
            >
              {isWalking ? 'Stopp' : 'Starta'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 px-2 pt-4">
        <div className="h-[2px] w-6 bg-slate-200 rounded-full"></div>
        <h3 className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Dagens uppdrag</h3>
      </div>

      {/* --- UPPDRAGSLISTA --- */}
      <div className="space-y-3">
        {quests.map(q => {
          const done = q.type === 'simple' ? isDone(q.id) : q.tasks.every(t => isDone(t.id));
          
          return (
            <div key={q.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer ${done ? 'opacity-50 grayscale-[50%]' : ''}`}
                onClick={() => q.type === 'checklist' ? setExpandedQuest(expandedQuest === q.id ? null : q.id) : null}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                    <PremiumEmoji emoji={q.icon} className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[15px]">{q.title}</h4>
                    {q.type === 'checklist' && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{q.tasks.length} delar</p>}
                  </div>
                </div>
                
                {q.type === 'simple' ? (
                  <button 
                    disabled={done}
                    onClick={(e) => triggerReward(q.reward, e, q.id, q.title)}
                    className={`px-4 py-2 rounded-xl font-black text-xs ${done ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                  >
                    {done ? 'Klar' : `+${q.reward} kr`}
                  </button>
                ) : (
                  <div className="text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedQuest === q.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Checklist-detaljer */}
              <AnimatePresence>
                {q.type === 'checklist' && expandedQuest === q.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50 border-t border-slate-100">
                    <div className="p-3 space-y-2">
                      {q.tasks.map(t => {
                        const tDone = isDone(t.id);
                        return (
                          <div key={t.id} className="bg-white p-3 rounded-2xl flex items-center justify-between border border-slate-200/50">
                            <span className={`text-xs font-bold ${tDone ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{t.text}</span>
                            <button 
                              disabled={tDone}
                              onClick={(e) => triggerReward(t.reward, e, t.id, t.text)}
                              className={`px-3 py-1.5 rounded-lg font-black text-[10px] ${tDone ? 'bg-slate-100 text-slate-300' : 'bg-emerald-500 text-white shadow-sm'}`}
                            >
                              {tDone ? 'Klar' : `+${t.reward} kr`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EarnTab;