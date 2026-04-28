import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FlyingCoin = ({ coin }) => {
  const [pos, setPos] = useState({ left: coin.startX, top: coin.startY, scale: 1, opacity: 1 });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPos({ left: coin.startX + coin.tx, top: coin.startY + coin.ty, scale: 0.2, opacity: 0 });
    }, 50);
    return () => clearTimeout(timer);
  }, [coin]);

  return (
    <div className="fixed z-[9999] pointer-events-none transition-all duration-[800ms] ease-in-out flex flex-col items-center justify-center font-black text-xl bg-yellow-400 text-yellow-900 border-2 border-yellow-500 rounded-full w-12 h-12 shadow-[0_0_15px_rgba(250,204,21,0.6)]"
         style={{ left: pos.left - 24, top: pos.top - 24, transform: `scale(${pos.scale})`, opacity: pos.opacity }}>
      {coin.amount < 0 ? coin.amount : `+${coin.amount}`}
    </div>
  );
};

const EarnTab = ({ bankBalance, bankStreak, handleClaim, claimedQuests }) => {
  const [expandedChore, setExpandedChore] = useState(null);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const levelUpAudioRef = useRef(null);

  // --- UPPDRAG & CHECKLISTOR ---
  const cleanTasks = [
    { id: 'c1', text: 'Plocka upp kläder', reward: 5 },
    { id: 'c2', text: 'Bädda sängen', reward: 5 }
  ];
  const schoolTasks = [
    { id: 'h1', text: 'Gör läxa / Träna hjärnan i 15 min', reward: 10 },
    { id: 'h2', text: 'Packa skolväskan', reward: 5 }
  ];
  const learnTasks = [
    { id: 'l1', text: 'Träna på klockan', reward: 5 },
    { id: 'l2', text: 'Träna på veckodagarna', reward: 5 },
    { id: 'l3', text: 'Träna på månaderna', reward: 5 },
    { id: 'l4', text: 'Kolla på en lärande dokumentär', reward: 15 }
  ];
  const physicalTasks = [
    { id: 'p1', text: 'Armhävningar (3x5)', reward: 10 },
    { id: 'p2', text: 'Squats / Benböj (20 st)', reward: 10 },
    { id: 'p3', text: 'Plankan (30 sekunder)', reward: 10 }
  ];

  const fastQuests = [
    { id: 'q1', title: "Hjälpa till med disken", reward: 15, icon: "🍽️", type: "simple" },
    { id: 'q4', title: "Duka bordet", reward: 10, icon: "🥣", type: "simple" },
    { id: 'q2', title: "Städa ditt rum", icon: "🧹", type: "checklist", list: 'clean' },
    { id: 'q5', title: "Skol-Fix", icon: "🎒", type: "checklist", list: 'school' },
    { id: 'q3', title: "Ta ut sopor & Återvinning", reward: 10, icon: "🗑️", type: "simple" },
    { id: 'q10', title: "Hjärngympa & Lärande", icon: "🧠", type: "checklist", list: 'learn' },
    { id: 'q9', title: "Egen Fysisk Utmaning", icon: "🏃‍♂️", type: "checklist", list: 'physical' },
    { id: 'q7', title: "Gymmet med Mamma", reward: 30, icon: "🏋️‍♀️", type: "simple" },
    { id: 'q8', title: "Spela fotboll med Mathias", reward: 30, icon: "⚽", type: "simple" },
    { id: 'q12', title: "Lyssna på musik (10 min)", reward: 10, icon: "🎧", type: "simple" }
  ];

  const getTasks = (listType) => {
    if (listType === 'clean') return cleanTasks;
    if (listType === 'school') return schoolTasks;
    if (listType === 'learn') return learnTasks;
    if (listType === 'physical') return physicalTasks;
    return [];
  };

  const isClaimedToday = (id) => {
    if (!claimedQuests || !claimedQuests[id]) return false;
    const claimDateStr = new Date(claimedQuests[id]).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return claimDateStr === todayStr;
  };

  const triggerReward = (amount, e, questId = null, title = "Uppdrag") => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0) {
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    const id = Date.now() + Math.random();
    const bankEl = document.getElementById('adrians-bank-balance');
    let tx = 0;
    let ty = -500;
    if (bankEl) {
      const bankRect = bankEl.getBoundingClientRect();
      tx = (bankRect.left + bankRect.width / 2) - startX;
      ty = (bankRect.top + bankRect.height / 2) - startY;
    }

    setFlyingCoins(prev => [...prev, { id, amount, startX, startY, tx, ty }]);
    handleClaim(amount, questId, title); 
    
    if (amount >= 10) { 
      if(window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#fbbf24', '#3b82f6'] });
      levelUpAudioRef.current?.play().catch(err => console.log(err));
    }

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(c => c.id !== id));
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6 pb-12">
      <audio ref={levelUpAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3" preload="auto" />
      {flyingCoins.map(c => <FlyingCoin key={c.id} coin={c} />)}

      {/* --- RUBRIK --- */}
      <div className="flex items-center justify-center gap-3 pt-4 mb-2">
        <span className="text-xl">🎯</span>
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-xs">Fasta Uppdrag</h3>
      </div>
      
      {/* --- UPPDRAGS-GRID (Exakt enligt din skärmdump) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {fastQuests.map(q => {
          const tasks = getTasks(q.list);
          const totalReward = q.type === 'checklist' ? tasks.reduce((sum, t) => sum + t.reward, 0) : q.reward;
          const isSimpleDone = q.type === 'simple' && isClaimedToday(q.id);
          const isChecklistDone = q.type === 'checklist' && tasks.length > 0 && tasks.every(t => isClaimedToday(t.id));
          const completelyDone = isSimpleDone || isChecklistDone;

          return (
            <div key={q.id} className="flex flex-col">
              <div 
                className={`bg-white rounded-3xl p-4 flex items-center justify-between border transition-all duration-200 ${completelyDone ? 'border-slate-100 opacity-50' : 'border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] active:scale-[0.98]'}`}
                onClick={(e) => {
                  if (completelyDone) return;
                  if (q.type === 'simple') {
                    if (q.id === 'q12') window.open('https://spotify.com', '_blank');
                    triggerReward(q.reward, e, q.id, q.title);
                  }
                  else setExpandedChore(expandedChore === q.id ? null : q.id);
                }}
              >
                {/* Vänster: Ikon och Text */}
                <div className="flex items-center gap-4">
                  <span className={`text-4xl sm:text-5xl drop-shadow-sm ${completelyDone ? 'grayscale' : ''}`}>{q.icon}</span>
                  <span className={`font-black uppercase leading-[1.1] text-xs sm:text-sm max-w-[110px] ${completelyDone ? 'text-slate-400 line-through' : 'text-[#1E293B]'}`}>
                    {q.title}
                  </span>
                </div>
                
                {/* Höger: Pris och "Visa"-knapp */}
                <div className="flex flex-col items-end gap-1.5 min-w-[70px]">
                  <div className={`${completelyDone ? 'bg-slate-100 text-slate-400' : 'bg-[#dcfce7] text-[#059669] shadow-sm'} font-black px-3 py-1.5 rounded-full text-[10px] sm:text-xs tracking-wide whitespace-nowrap`}>
                    {q.type === 'checklist' ? `Max +${totalReward} kr` : `+${q.reward} kr`}
                  </div>
                  
                  {q.type === 'checklist' && !completelyDone && (
                    <div className="bg-[#f1f5f9] text-[#64748b] font-black px-3 py-1 rounded-full border border-[#e2e8f0] text-[8px] sm:text-[9px] uppercase tracking-widest mt-1">
                      {expandedChore === q.id ? 'Dölj' : 'Visa'}
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKLISTAN (När man fäller ut) */}
              <AnimatePresence>
                {q.type === 'checklist' && expandedChore === q.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }} 
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/60 border border-slate-100 rounded-[1.5rem] p-2 space-y-1">
                      {tasks.map(task => {
                        const taskDone = isClaimedToday(task.id);
                        return (
                          <div key={task.id} className={`flex justify-between items-center p-3 rounded-2xl transition-colors ${taskDone ? 'bg-slate-50 opacity-60' : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]'}`}>
                            <span className={`font-bold uppercase text-[10px] sm:text-xs pr-2 ${taskDone ? 'text-slate-400 line-through' : 'text-[#1E293B]'}`}>{task.text}</span>
                            <motion.button 
                              whileHover={!taskDone ? { scale: 1.05 } : {}}
                              whileTap={!taskDone ? { scale: 0.95 } : {}}
                              disabled={taskDone}
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerReward(task.reward, e, task.id, task.text);
                              }}
                              className={`px-3 py-1.5 rounded-full font-black text-[9px] sm:text-[10px] uppercase whitespace-nowrap flex-shrink-0 ${taskDone ? 'bg-slate-200 text-slate-500' : 'bg-[#10b981] text-white shadow-sm'}`}
                            >
                              {taskDone ? 'Klar' : `+${task.reward} kr`}
                            </motion.button>
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