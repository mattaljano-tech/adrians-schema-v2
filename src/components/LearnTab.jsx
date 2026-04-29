import React, { useState } from 'react';
import { motion } from 'framer-motion';

// --- HJÄLPRESA: PEDAGOGISKA FÄRGER ---
const getDayColor = (dayOfWeek) => {
  // dayOfWeek: 0 = Måndag, 1 = Tisdag ... 6 = Söndag
  const colors = [
    '#4CAF50', // Måndag: Grön
    '#2196F3', // Tisdag: Blå
    '#FFFFFF', // Onsdag: Vit
    '#8D6E63', // Torsdag: Brun
    '#FFEB3B', // Fredag: Gul
    '#E91E63', // Lördag: Rosa
    '#F44336'  // Söndag: Röd
  ];
  return colors[dayOfWeek];
};

const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-md select-none pointer-events-none`} 
    draggable="false"
  />
);

const CalendarCard = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const realToday = new Date();

  const monthThemes = [
    { name: "Januari", emoji: "❄️", gradient: "from-blue-400 to-indigo-500" },
    { name: "Februari", emoji: "⛄", gradient: "from-cyan-400 to-blue-500" },
    { name: "Mars", emoji: "🌱", gradient: "from-emerald-400 to-green-500" },
    { name: "April", emoji: "🐣", gradient: "from-green-400 to-lime-500" },
    { name: "Maj", emoji: "🌸", gradient: "from-pink-400 to-rose-500" },
    { name: "Juni", emoji: "🍓", gradient: "from-yellow-400 to-orange-400" },
    { name: "Juli", emoji: "🏖️", gradient: "from-orange-400 to-red-400" },
    { name: "Augusti", emoji: "🍉", gradient: "from-red-400 to-rose-600" },
    { name: "September", emoji: "🍂", gradient: "from-amber-500 to-orange-600" },
    { name: "Oktober", emoji: "🎃", gradient: "from-orange-600 to-red-700" },
    { name: "November", emoji: "🌧️", gradient: "from-slate-400 to-slate-600" },
    { name: "December", emoji: "🎄", gradient: "from-red-500 to-green-600" }
  ];

  const currentMonth = monthThemes[viewDate.getMonth()];
  
  // Beräkna dagar
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Söndag
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Justera så måndag är först (JS: 0=Sön, 1=Mån... -> Vi vill: 0=Mån, 6=Sön)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="bg-[#F8FAFC] rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white overflow-hidden max-w-md mx-auto">
      {/* HEADER */}
      <div className={`bg-gradient-to-br ${currentMonth.gradient} p-8 relative`}>
        <div className="absolute right-2 bottom-2 opacity-30">
          <PremiumEmoji emoji={currentMonth.emoji} className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth} 
            className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/30 shadow-lg text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </motion.button>

          <div className="text-center">
            <p className="text-white/80 font-black uppercase tracking-[0.2em] text-xs mb-1">Månad</p>
            <h2 className="text-white font-black text-4xl tracking-tight leading-none uppercase">
              {currentMonth.name}
            </h2>
            <p className="text-white/60 font-bold text-lg">{year}</p>
          </div>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth} 
            className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/30 shadow-lg text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* KALENDER-GRID */}
      <div className="p-6 bg-white">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((d, i) => (
            <div key={i} className="text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Tomma rutor innan den 1:a i månaden */}
          {[...Array(startOffset)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Dagarna */}
          {[...Array(daysInMonth)].map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeek = (i + startOffset) % 7; // Vilken veckodag (0-6)
            const color = getDayColor(dayOfWeek);
            
            const isToday = 
              dayNum === realToday.getDate() && 
              month === realToday.getMonth() && 
              year === realToday.getFullYear();

            return (
              <motion.div 
                key={dayNum}
                initial={isToday ? { scale: 1 } : false}
                animate={isToday ? { scale: [1, 1.05, 1] } : false}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ backgroundColor: color }}
                className={`
                  aspect-square rounded-2xl flex items-center justify-center relative
                  border-2 border-slate-100 shadow-sm
                  ${isToday ? 'border-[5px] border-black z-20 shadow-2xl scale-110' : ''}
                `}
              >
                <span className={`
                  font-black text-lg
                  ${dayOfWeek === 2 || dayOfWeek === 4 ? 'text-slate-800' : 'text-slate-900'} 
                  ${isToday ? 'text-2xl' : ''}
                `}>
                  {dayNum}
                </span>
                
                {/* Liten prick för att göra onsdag (vit) tydligare */}
                {dayOfWeek === 2 && !isToday && (
                  <div className="absolute bottom-1 w-1 h-1 bg-slate-200 rounded-full" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* FÖRKLARING (Valfri, kan tas bort om det blir för mycket) */}
      <div className="px-8 pb-8 bg-white flex justify-between items-center opacity-60">
        <div className="flex gap-1">
          {[0,1,2,3,4,5,6].map(d => (
            <div key={d} className="w-3 h-3 rounded-full" style={{backgroundColor: getDayColor(d)}} />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase text-slate-400">Veckans färger</span>
      </div>
    </div>
  );
};

export default CalendarCard;