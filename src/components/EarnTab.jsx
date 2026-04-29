import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM EMOJI ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-sm select-none pointer-events-none`} 
    draggable="false"
  />
);

// --- TIMER-RING ---
const TimerRing = ({ percentage, color = "#3b82f6" }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
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
  const [showReadPrompt, setShowReadPrompt] = useState(false);

  // --- UPPDRAGSDATA (ALLA UPPDRAG ÅTERSTÄLLDA!) ---
  const cleanTasks = [
    { id: 'c1', text: 'Plocka upp kläder', reward: 5 },
    { id: 'c2', text: 'Bädda sängen', reward: 5 }
  ];
  const schoolTasks = [
    { id: 'h1', text: 'Gör läxa / Träna hjärnan 15 min', reward: 10 },
    { id: 'h2', text: 'Packa skolväskan', reward: 5 }
  ];
  const learnTasks = [
    { id: 'l1', text: 'Träna på klockan', reward: 5 },
    { id: 'l2', text: 'Träna på veckodagarna', reward: 5 },
    { id: 'l3', text: 'Träna på månaderna', reward: 5 },
    { id: 'l4', text: 'Lärande dokumentär (10 min)', reward: 15 }
  ];
  const physicalTasks = [
    { id: 'p1', text: 'Armhävningar (3x5)', reward: 10 },
    { id: 'p2', text: 'Squats / Benböj (20 st)', reward: 10 },
    { id: 'p3', text: 'Plankan (30 sekunder)', reward: 10 }
  ];

  const quests = [
    { id: 'q1', title: "Hjälpa till med disken", reward: 15, icon: "🍽️", type: "simple" },
    { id: 'q4', title: "Duka bordet", reward: 10, icon: "🥣", type: "simple" },
    { id: 'q2', title: "Städa ditt rum", icon: "🧹", type: "checklist", tasks: cleanTasks },
    { id: 'q5', title: "Skol-Fix", icon: "🎒", type: "checklist", tasks: schoolTasks },
    { id: 'q3', title: "Ta ut sopor & Återvinning", reward: 10, icon: "🗑️", type: "simple" },
    { id: 'q10', title: "Hjärngympa & Lärande", icon: "🧠", type: "checklist", tasks: learnTasks },
    { id: 'q9', title: "Egen Fysisk Utmaning", icon: "🏃‍♂️", type: "checklist", tasks: physicalTasks },
    { id: 'q7', title: "Gymmet med Mamma", reward: 30, icon: "🏋️‍♀️", type: "simple" },
    { id: 'q8', title: "Spela fotboll med Mathias", reward: 30, icon: "⚽", type: "simple" },
    { id: 'q12', title: "Lyssna på musik (10 min)", reward: 10, icon: "🎧", type: "simple" }
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

  // Läspåminnelse (15 min)
  useEffect(() => {
    if (readTime === 900) setShowReadPrompt(true); 
    if (readTime === 1020 && showReadPrompt) { 
      setIsReading(false);
      setShowReadPrompt(false);
    }
  }, [readTime, showReadPrompt]);

  const isDone = (id) => {
    if (!claimedQuests || !claimedQuests[id]) return false;
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
  
  // Beräkningar
  const readableTens = Math.floor(readTime / 600);
  const readReward = readableTens * 10;
  const walkEarned = Math.floor(walkTime / 60);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 pb-12">
      {flyingCoins.map(c => <FlyingCoin key={c.id} coin={c} />)}

      {/* --- BANK HERO --- */}
      <div className="px-2 sm:px-4 pt-4">
        <div id="bank-hero" className="bg-gradient-to-br from-[#1E293B] to-[#0f172a] rounded-[2rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.15)] relative overflow-hidden border border-slate-700/50">
          <div className="absolute -right-6 -top-10 opacity-10 pointer-events-none select-none blur-[1px] rotate-12">
            <PremiumEmoji emoji="💳" className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col">
            <h2 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs drop-shadow-sm mb-2">
              Ditt saldo
            </h2>
            <div className="text-5xl sm:text-6xl font-black text-white font-clock tabular-nums tracking-tight flex items-baseline gap-2 drop-shadow-md">
              {bankBalance} <span className="text-xl sm:text-2xl text-slate-400 font-sans tracking-wide">kr</span>
            </div>
            {bankStreak > 0 && (
              <div className="mt-4 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-max shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                <span className="text-sm">🔥</span> {bankStreak} Dagars Streak
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 px-4 mb-2">
        <PremiumEmoji emoji="⏳" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Aktiva Uppdrag</h3>
      </div>

      {/* --- AKTIVA TIMERS (LÄSA / GÅ) --- */}
      <div className="grid grid-cols-1 gap-4 px-2 sm:px-4">
        
        {/* --- LÄS-KORT (BOK-BAKGRUND) --- */}
        <div className={`relative bg-white rounded-[2rem] border transition-all overflow-hidden ${isReading ? 'border-orange-300 ring-4 ring-orange-50 shadow-md' : 'border-slate-200 shadow-sm'}`}>
          {/* Bakgrundsbild: Estetisk bok */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800')" }}
          ></div>
          {/* Gradient-overlay för att texten ska synas perfekt */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/60"></div>

          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative flex-shrink-0">
                <TimerRing percentage={(readTime % 600) / 6} color="#f97316" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PremiumEmoji emoji="📖" className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-wide">Läs en bok</h3>
                <p className="text-slate-600 font-bold text-xs mt-0.5">10 kr per 10 minuter</p>
                <div className="mt-1 text-2xl font-black text-slate-800 font-clock">{formatMinSec(readTime)}</div>
              </div>
              <button 
                onClick={() => setIsReading(!isReading)}
                className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isReading ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-600 text-white active:scale-95'}`}
              >
                {isReading ? 'Pausa' : 'Starta'}
              </button>
            </div>

            {/* Belöningsinfo för Läsning */}
            {readTime > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Intjänat:</span>
                  <span className={`font-black text-sm ${readReward > 0 ? 'text-green-600' : 'text-slate-400'}`}>+{readReward} kr</span>
                </div>
                {!isReading && (
                  <button onClick={(e) => { triggerReward(readReward, e, 'read', 'Läsning'); setReadTime(0); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform">
                    Avsluta & Hämta
                  </button>
                )}
              </div>
            )}
            
            {/* Påminnelse */}
            {showReadPrompt && (
              <div className="mt-4 bg-yellow-100 p-4 rounded-xl border border-yellow-200 text-center animate-pulse">
                <p className="font-black text-yellow-800 text-xs uppercase mb-2">Läser du fortfarande?</p>
                <button onClick={() => setShowReadPrompt(false)} className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-black text-xs uppercase shadow-sm">Ja, jag läser!</button>
              </div>
            )}
          </div>
        </div>

        {/* --- GÅ-KORT (MIDSOMMARKRANSEN / PARK-BAKGRUND) --- */}
        <div className={`relative bg-white rounded-[2rem] border transition-all overflow-hidden ${isWalking ? 'border-emerald-300 ring-4 ring-emerald-50 shadow-md' : 'border-slate-200 shadow-sm'}`}>
          {/* Bakgrundsbild: Midsommarkransen / Lummig grön park */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470071531523-2046890dd8fd?auto=format&fit=crop&q=80&w=800')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/60"></div>

          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative flex-shrink-0">
                <TimerRing percentage={(walkTime % 60) * 1.66} color="#10b981" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PremiumEmoji emoji="🏃‍♂️" className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-wide">Ta en promenad</h3>
                <p className="text-slate-600 font-bold text-xs mt-0.5">1 kr per minut</p>
                <div className="mt-1 text-2xl font-black text-slate-800 font-clock">{formatMinSec(walkTime)}</div>
              </div>
              <button 
                onClick={() => setIsWalking(!isWalking)}
                className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isWalking ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-600 text-white active:scale-95'}`}
              >
                {isWalking ? 'Pausa' : 'Starta'}
              </button>
            </div>

            {/* Belöningsinfo för Promenad */}
            {walkTime > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Intjänat:</span>
                  <span className={`font-black text-sm ${walkEarned > 0 ? 'text-green-600' : 'text-slate-400'}`}>+{walkEarned} kr</span>
                </div>
                {!isWalking && (
                  <button onClick={(e) => { triggerReward(walkEarned, e, 'walk', 'Promenad'); setWalkTime(0); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform">
                    Avsluta & Hämta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-6 px-4 mb-2">
        <PremiumEmoji emoji="🎯" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Dagens Uppdrag</h3>
      </div>

      {/* --- UPPDRAGSLISTA --- */}
      <div className="space-y-3 px-2 sm:px-4">
        {quests.map(q => {
          const done = q.type === 'simple' ? isDone(q.id) : q.tasks.every(t => isDone(t.id));
          
          return (
            <div key={q.id} className={`bg-white rounded-[1.5rem] border transition-all duration-200 ${done ? 'opacity-60 grayscale-[30%] border-slate-100' : 'border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md'}`}>
              <div 
                className="p-3 sm:p-4 flex items-center justify-between cursor-pointer"
                onClick={() => q.type === 'checklist' ? setExpandedQuest(expandedQuest === q.id ? null : q.id) : null}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-slate-50' : 'bg-[#f8fafc]'}`}>
                    <PremiumEmoji emoji={q.icon} className="w-10 h-10" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className={`font-black uppercase tracking-wide text-sm sm:text-base ${done ? 'text-slate-400 line-through' : 'text-[#1E293B]'}`}>
                      {q.title}
                    </h4>
                    {q.type === 'checklist' && !done && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{q.tasks.length} delmoment</p>
                    )}
                    {done && (
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">✅ Klar för idag</p>
                    )}
                  </div>
                </div>
                
                {q.type === 'simple' ? (
                  <button 
                    disabled={done}
                    onClick={(e) => {
                      if(q.id === 'q12') window.open('https://spotify.com', '_blank');
                      triggerReward(q.reward, e, q.id, q.title);
                    }}
                    className={`px-4 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest flex-shrink-0 ${done ? 'bg-slate-100 text-slate-400' : 'bg-[#dcfce7] text-[#059669] shadow-sm active:scale-95 transition-transform'}`}
                  >
                    {done ? 'Hämtad' : `+${q.reward} kr`}
                  </button>
                ) : (
                  <div className="text-slate-400 pr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${expandedQuest === q.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Checklist-detaljer (Utökad) */}
              <AnimatePresence>
                {q.type === 'checklist' && expandedQuest === q.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 space-y-2 rounded-b-[1.5rem]">
                      {q.tasks.map(t => {
                        const tDone = isDone(t.id);
                        return (
                          <div key={t.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${tDone ? 'bg-transparent border-transparent opacity-60' : 'bg-white border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'}`}>
                            <span className={`text-xs font-bold uppercase pl-1 ${tDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.text}</span>
                            <button 
                              disabled={tDone}
                              onClick={(e) => triggerReward(t.reward, e, t.id, t.text)}
                              className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm flex-shrink-0 ${tDone ? 'bg-slate-200 text-slate-400' : 'bg-[#10b981] text-white active:scale-95 transition-transform'}`}
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