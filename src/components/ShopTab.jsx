import React from 'react';
import { motion } from 'framer-motion';

const shopItems = [
  { id: 's9', title: "Köp Teardown tid", cost: 100, icon: "🔨" },
  { id: 's2', title: "1 timme PS5", cost: 100, icon: "🎮" },
  { id: 's4', title: "Filmmys med snacks", cost: 150, icon: "🍿" },
  { id: 's7', title: "Välj helgsnacks", cost: 120, icon: "🍪" },
  { id: 's5', title: "Välj Lyxmiddag", cost: 200, icon: "🌮" },
  { id: 's1', title: "100 Robux", cost: 165, icon: "💎" },
  { id: 's8', title: "Nytt PS5-spel", cost: 1500, icon: "📀" }
];

const ShopTab = ({ bankBalance, handleBuy }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-6"
    >
      {/* Saldo-ruta högst upp (Samma trygga design) */}
      <div className="bg-slate-800 rounded-[2.5rem] p-8 border-4 border-slate-700 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-8xl -mt-4 -mr-4 pointer-events-none">💳</div>
        <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1 relative z-10">Ditt Saldo</p>
        <div className="text-6xl font-black text-white flex items-baseline justify-center gap-2 relative z-10">
          {bankBalance} <span className="text-2xl text-slate-400 font-bold">kr</span>
        </div>
      </div>

      <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-sm text-center">
        🛒 Belöningsbutik
      </h3>

      {/* Butiks-listan */}
      <div className="grid grid-cols-2 gap-4 pb-8">
        {shopItems.map(item => {
          const canAfford = bankBalance >= item.cost;

          return (
            <div 
              key={item.id} 
              className="bg-white p-5 rounded-3xl border-4 border-slate-200 shadow-sm flex flex-col items-center text-center"
            >
              <span className="text-5xl mb-3 drop-shadow-sm">{item.icon}</span>
              <h4 className="font-black text-slate-700 uppercase tracking-tight mb-2 leading-tight text-sm">
                {item.title}
              </h4>
              <div className="bg-slate-100 text-slate-500 font-black px-3 py-1 rounded-full border-2 border-slate-200 mb-4 text-xs">
                {item.cost} kr
              </div>
              
              <button 
                onClick={() => canAfford && handleBuy(item)}
                className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs border-b-4 transition-all ${
                  canAfford 
                  ? 'bg-blue-600 text-white border-blue-800 active:border-b-0 active:translate-y-1' 
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Köp' : 'Spara mer'}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ShopTab;