import React from 'react';
import { motion } from 'framer-motion';

// --- PREMIUM 3D EMOJI KOMPONENT ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-lg select-none pointer-events-none`} 
    draggable="false"
  />
);

const ShopTab = ({ bankBalance, bankStreak, handleBuy }) => {
  // Adrians belöningar
  const bigGoal = { id: 's8', title: "Nytt PS5-spel", cost: 1500, icon: "📀" };
  
  const shopItems = [
    { id: 's1', title: "100 Robux", cost: 165, icon: "💎", color: "from-cyan-400 to-blue-500", shadow: "shadow-cyan-500/30" },
    { id: 's2', title: "1 timme PS5", cost: 100, icon: "🎮", color: "from-indigo-400 to-purple-600", shadow: "shadow-indigo-500/30" },
    { id: 's4', title: "Filmmys", cost: 150, icon: "🍿", color: "from-rose-400 to-red-500", shadow: "shadow-rose-500/30" },
    { id: 's7', title: "Välj Helgsnacks", cost: 120, icon: "🍪", color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/30" },
    { id: 's5', title: "Lyxmiddag", cost: 200, icon: "🌮", color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/30" },
    { id: 's9', title: "Teardown tid", cost: 100, icon: "🔨", color: "from-slate-400 to-slate-600", shadow: "shadow-slate-500/30" }
  ];

  const goalProgress = Math.min(Math.round((bankBalance / bigGoal.cost) * 100), 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-8 pb-12"
    >
      {/* --- VIRTUELL BANK (Fintech Style) --- */}
      <div className="pt-4 px-2">
        <div id="adrians-bank-balance" className="bg-gradient-to-br from-[#1E293B] to-[#0f172a] rounded-[2rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.15)] relative overflow-hidden border border-slate-700/50">
          <div className="absolute -right-6 -top-10 opacity-10 pointer-events-none select-none blur-[1px] rotate-12">
            <PremiumEmoji emoji="💳" className="w-48 h-48" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>

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

      {/* --- DET STORA MÅLET (MAGISK HERO CARD) --- */}
      <div className="px-2 sm:px-4">
        <div className="flex items-center gap-2 mb-4">
          <PremiumEmoji emoji="🏆" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[11px] sm:text-xs">Stora sparmålet</h3>
        </div>
        
        <div className="bg-gradient-to-b from-blue-900 to-indigo-900 rounded-[2.5rem] p-1 shadow-[0_12px_40px_rgba(30,58,138,0.3)] relative overflow-hidden">
          {/* Glänsande kant-effekt */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/20 rounded-[2.5rem] pointer-events-none"></div>
          
          <div className="bg-gradient-to-b from-[#1e1b4b] to-[#312e81] rounded-[2.4rem] p-6 sm:p-8 relative overflow-hidden border border-indigo-500/30">
            {/* Strålande ljus bakom disken */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mb-4 relative">
                {/* Snurrande strålar bakom ikonen */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                  className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMEw1NSAzNUw5MCAxMEw2MCA0NUwxMDAgNTBMNjAgNTVMOTAgOTBMNTUgNjVMNTAgMTAwTDQ1 NjVMMTAgOTBMNDAgNTVMMCA1MEw0MCA0NUwxMCAxMEw0NSAzNVoiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjwvc3ZnPg==')] bg-center bg-contain opacity-50"
                ></motion.div>
                <PremiumEmoji emoji={bigGoal.icon} className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] relative z-10" />
              </div>
              
              <h4 className="font-black text-white uppercase text-2xl sm:text-3xl tracking-tight mb-2 drop-shadow-md">
                {bigGoal.title}
              </h4>
              <div className="bg-yellow-400/20 text-yellow-300 font-black px-4 py-1.5 rounded-full text-sm sm:text-base border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)] flex items-center gap-1">
                <span>✨</span> {bigGoal.cost} kr <span>✨</span>
              </div>
            </div>

            <div className="relative z-10 space-y-3 bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-end">
                <span className="text-indigo-200 font-black uppercase tracking-widest text-[10px]">Din progress</span>
                <span className="font-black text-white text-xl font-clock drop-shadow-md">{goalProgress}%</span>
              </div>
              
              {/* MAGISK PROGRESS BAR */}
              <div className="w-full h-6 bg-slate-900/50 rounded-full p-1 border border-indigo-900/50 shadow-inner overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full relative shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                >
                  {/* Ljus-reflektion överst på baren */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/30 rounded-t-full"></div>
                  {/* Pulserande effekt LÄNGST FRAM PÅ BAREN */}
                  {goalProgress > 0 && goalProgress < 100 && (
                    <motion.div 
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white to-transparent rounded-r-full"
                    ></motion.div>
                  )}
                </motion.div>
              </div>
              
              <div className="pt-3">
                <motion.button 
                  whileHover={bankBalance >= bigGoal.cost ? { scale: 1.02 } : {}} 
                  whileTap={bankBalance >= bigGoal.cost ? { scale: 0.98 } : {}}
                  onClick={() => handleBuy(bigGoal)}
                  disabled={bankBalance < bigGoal.cost}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest transition-all shadow-lg flex justify-center items-center gap-2 ${
                    bankBalance >= bigGoal.cost 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-950 border-b-4 border-orange-600 hover:brightness-110' 
                    : 'bg-white/10 text-indigo-300 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {bankBalance >= bigGoal.cost ? '🎉 HÄMTA DIN BELÖNING!' : `Du behöver ${bigGoal.cost - bankBalance} kr till`}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SNABBA BELÖNINGAR (Premium Cards) --- */}
      <div className="px-2 sm:px-4 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <PremiumEmoji emoji="🎁" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[11px] sm:text-xs">Mindre belöningar</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {shopItems.map(item => {
            const canAfford = bankBalance >= item.cost;
            
            return (
              <motion.div 
                key={item.id} 
                whileHover={canAfford ? { y: -2 } : {}}
                className={`bg-white rounded-[2rem] p-4 flex flex-col items-center text-center border transition-all duration-300 relative overflow-hidden ${
                  !canAfford ? 'opacity-70 border-slate-100 bg-slate-50/50' : `border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:${item.shadow}`
                }`}
              >
                {/* Färgad glöd bakom ikonen om han har råd */}
                {canAfford && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b ${item.color} opacity-10 rounded-full blur-xl`}></div>
                )}

                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center mb-3 relative z-10 ${!canAfford ? 'grayscale opacity-70' : ''}`}>
                  <PremiumEmoji emoji={item.icon} className="w-12 h-12 sm:w-14 sm:h-14" />
                </div>
                
                <h4 className={`font-black uppercase tracking-tight text-sm mb-1 leading-tight relative z-10 h-10 flex items-center ${!canAfford ? 'text-slate-400' : 'text-[#1E293B]'}`}>
                  {item.title}
                </h4>
                
                <div className={`font-black text-[10px] uppercase tracking-widest mb-4 relative z-10 px-3 py-1 rounded-full ${!canAfford ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  {item.cost} kr
                </div>
                
                <motion.button 
                  whileHover={canAfford ? { scale: 1.05 } : {}} 
                  whileTap={canAfford ? { scale: 0.95 } : {}}
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  className={`w-full py-3 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all relative z-10 ${
                    canAfford 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-md hover:brightness-110` 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'KÖP' : 'LÅST'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ShopTab;