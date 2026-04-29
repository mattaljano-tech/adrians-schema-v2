import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM 3D EMOJI KOMPONENT ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-md select-none pointer-events-none`} 
    draggable="false"
  />
);

const ShopTab = ({ bankBalance, bankStreak, handleBuy }) => {
  // Adrians belöningar
  const bigGoal = { id: 's8', title: "Nytt PS5-spel", cost: 1500, icon: "📀" };
  
  const shopItems = [
    { id: 's1', title: "100 Robux", cost: 165, icon: "💎" },
    { id: 's2', title: "1 timme PS5", cost: 100, icon: "🎮" },
    { id: 's4', title: "Filmmys med snacks", cost: 150, icon: "🍿" },
    { id: 's7', title: "Välj helgsnacks/godis", cost: 120, icon: "🍪" },
    { id: 's5', title: "Välj Lyxmiddag", cost: 200, icon: "🌮" },
    { id: 's9', title: "Köp Teardown tid", cost: 100, icon: "🔨" }
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
      {/* --- VIRTUELL BANK (Exakt samma Fintech Style som i EarnTab) --- */}
      <div className="pt-4 px-2">
        <div id="adrians-bank-balance" className="bg-gradient-to-br from-[#1E293B] to-[#0f172a] rounded-[2rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.15)] relative overflow-hidden border border-slate-700/50">
          
          {/* Dekorativ bakgrundseffekt */}
          <div className="absolute -right-6 -top-10 opacity-10 pointer-events-none select-none blur-[1px] rotate-12">
            <PremiumEmoji emoji="💳" className="w-48 h-48" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex justify-between items-start mb-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs drop-shadow-sm">
                Adrians Bank
              </h2>
              {bankStreak > 0 && (
                <div className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-max shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                  <span className="text-sm">🔥</span> {bankStreak} Dagars Streak!
                </div>
              )}
            </div>
            
            <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md border border-yellow-200/50 shadow-inner flex flex-col justify-evenly p-1.5 opacity-90">
              <div className="w-full h-[1px] bg-yellow-700/40"></div>
              <div className="w-full h-[1px] bg-yellow-700/40"></div>
              <div className="w-full h-[1px] bg-yellow-700/40"></div>
            </div>
          </div>

          <div className="relative z-10 pt-2">
            <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[9px] sm:text-[10px] mb-1">
              Tillgängligt Saldo
            </p>
            <div className="text-5xl sm:text-6xl font-black text-white font-clock tabular-nums tracking-tight flex items-baseline gap-2 drop-shadow-md">
              {bankBalance} <span className="text-xl sm:text-2xl text-slate-400 font-sans tracking-wide">kr</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- DET STORA MÅLET (Hero Card) --- */}
      <div className="px-2 sm:px-4">
        <div className="flex items-center gap-2 mb-4">
          <PremiumEmoji emoji="🏆" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[11px] sm:text-xs">Stora sparmålet</h3>
        </div>
        
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-5 mb-8">
            <div className="w-20 h-20 bg-[#f8fafc] rounded-[1.5rem] flex items-center justify-center shadow-sm border border-slate-50 flex-shrink-0">
              <PremiumEmoji emoji={bigGoal.icon} className="w-12 h-12" />
            </div>
            <div>
              <h4 className="font-black text-[#1E293B] uppercase text-xl tracking-tight mb-1">
                {bigGoal.title}
              </h4>
              <div className="bg-blue-50 text-blue-600 font-black px-3 py-1 rounded-full text-xs w-max border border-blue-100">
                {bigGoal.cost} kr
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Din progress</span>
              <span className="font-black text-blue-600 text-lg font-clock">{goalProgress}%</span>
            </div>
            
            <div className="w-full h-5 bg-slate-100 rounded-full p-1 border border-slate-200 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full relative shadow-[0_2px_10px_rgba(59,130,246,0.3)]"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 rounded-t-full"></div>
              </motion.div>
            </div>
            
            <div className="pt-4">
              <motion.button 
                whileHover={bankBalance >= bigGoal.cost ? { scale: 1.02 } : {}} 
                whileTap={bankBalance >= bigGoal.cost ? { scale: 0.98 } : {}}
                onClick={() => handleBuy(bigGoal)}
                disabled={bankBalance < bigGoal.cost}
                className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-md flex justify-center items-center gap-2 ${
                  bankBalance >= bigGoal.cost 
                  ? 'bg-blue-600 text-white border-b-4 border-blue-800 hover:bg-blue-500' 
                  : 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed grayscale'
                }`}
              >
                {bankBalance >= bigGoal.cost ? '🎉 HÄMTA DIN BELÖNING!' : `Du behöver ${bigGoal.cost - bankBalance} kr till`}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* --- SNABBA BELÖNINGAR (Premium Lista) --- */}
      <div className="px-2 sm:px-4 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <PremiumEmoji emoji="🎁" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[11px] sm:text-xs">Snabba belöningar</h3>
        </div>

        <div className="flex flex-col gap-3">
          {shopItems.map(item => {
            const canAfford = bankBalance >= item.cost;
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-[1.5rem] p-3 sm:p-4 flex items-center justify-between border transition-all duration-200 ${
                  !canAfford ? 'opacity-60 border-slate-100 shadow-sm' : 'border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)]'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${!canAfford ? 'bg-slate-50 grayscale' : 'bg-[#f8fafc]'}`}>
                    <PremiumEmoji emoji={item.icon} className="w-10 h-10" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-black uppercase tracking-wide text-sm sm:text-base ${!canAfford ? 'text-slate-400' : 'text-[#1E293B]'}`}>
                      {item.title}
                    </span>
                    <span className={`font-bold text-[10px] uppercase tracking-widest mt-0.5 ${!canAfford ? 'text-slate-300' : 'text-slate-400'}`}>
                      Kostar {item.cost} kr
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 pl-2">
                  <motion.button 
                    whileHover={canAfford ? { scale: 1.05 } : {}} 
                    whileTap={canAfford ? { scale: 0.95 } : {}}
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`px-6 py-2.5 rounded-full font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all border ${
                      canAfford 
                      ? 'bg-[#10b981] text-white border-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'KÖP' : 'LÅST'}
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ShopTab;