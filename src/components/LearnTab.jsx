import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// --- PREMIUM 3D EMOJI KOMPONENT ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-md select-none pointer-events-none`} 
    draggable="false"
  />
);

// --- RÖST-MOTOR (speakText) ---
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sv-SE';
    utterance.rate = 0.8;
    const voices = window.speechSynthesis.getVoices();
    const swedishVoice = voices.find(v => v.name.includes('Klara') || v.name.includes('Premium') || v.lang === 'sv-SE');
    if (swedishVoice) utterance.voice = swedishVoice;
    window.speechSynthesis.speak(utterance);
  }
};

// --- HJÄLPFUNKTION FÖR SVENSKA TID-ORD ---
const getSwedishTimeWords = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hourNames = ["tolv", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv"];
  let h = hours % 12;
  let nextH = (h + 1) % 12;
  if (h === 0) h = 12;
  if (nextH === 0) nextH = 12;

  if (minutes === 0) return hourNames[h];
  if (minutes === 5) return `fem över ${hourNames[h]}`;
  if (minutes === 10) return `tio över ${hourNames[h]}`;
  if (minutes === 15) return `kvart över ${hourNames[h]}`;
  if (minutes === 20) return `tjugo över ${hourNames[h]}`;
  if (minutes === 25) return `fem i halv ${hourNames[nextH]}`;
  if (minutes === 30) return `halv ${hourNames[nextH]}`;
  if (minutes === 35) return `fem över halv ${hourNames[nextH]}`;
  if (minutes === 40) return `tjugo i ${hourNames[nextH]}`;
  if (minutes === 45) return `kvart i ${hourNames[nextH]}`;
  if (minutes === 50) return `tio i ${hourNames[nextH]}`;
  if (minutes === 55) return `fem i ${hourNames[nextH]}`;

  return "ungefär " + hourNames[h];
};

// --- INTERAKTIV KLOCKA (MED TYDLIGA SIFFROR) ---
const InteractiveClock = ({ simTimeMs, setSimTimeMs }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const getAngle = (clientX, clientY) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const angle = getAngle(e.clientX, e.clientY);
    const totalMinutes = Math.round(angle / 6) % 60;
    const date = new Date(simTimeMs);
    date.setMinutes(totalMinutes);
    setSimTimeMs(date.getTime());
  };

  const date = new Date(simTimeMs);
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  const mDeg = date.getMinutes() * 6;

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center">
      <div className="bg-blue-50 text-blue-600 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-blue-100 flex items-center gap-2">
        <PremiumEmoji emoji="👆" className="w-4 h-4" /> Snurra på minutvisaren
      </div>

      <svg 
        ref={svgRef}
        viewBox="0 0 280 280"
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onPointerMove={handlePointerMove}
        className="w-64 h-64 sm:w-80 sm:h-80 touch-none cursor-grab active:cursor-grabbing drop-shadow-2xl"
      >
        {/* Klockans bakgrund */}
        <circle cx="140" cy="140" r="135" fill="#1E293B" />
        <circle cx="140" cy="140" r="120" fill="white" opacity="0.05" />
        
        {/* Minut-prickar */}
        {[...Array(60)].map((_, i) => (
          <circle 
            key={`min-${i}`} 
            cx={140 + 115 * Math.cos((i * 6 - 90) * Math.PI / 180)} 
            cy={140 + 115 * Math.sin((i * 6 - 90) * Math.PI / 180)} 
            r={i % 5 === 0 ? 0 : 1.5} 
            fill="#64748b" 
          />
        ))}

        {/* TYDLIGA SIFFROR (1-12) */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const angle = (num * 30 - 90) * (Math.PI / 180);
          const radius = 95; // Avstånd från mitten
          const x = 140 + radius * Math.cos(angle);
          const y = 140 + radius * Math.sin(angle);
          return (
            <text 
              key={num} 
              x={x} 
              y={y} 
              textAnchor="middle" 
              dominantBaseline="central" 
              className="text-2xl font-black font-clock fill-white select-none pointer-events-none"
            >
              {num}
            </text>
          );
        })}

        {/* Timvisare (Kort och röd) */}
        <g transform={`rotate(${hDeg} 140 140)`}>
          <line x1="140" y1="140" x2="140" y2="85" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
        </g>
        
        {/* Minutvisare (Lång och blå) */}
        <g transform={`rotate(${mDeg} 140 140)`}>
          <line x1="140" y1="140" x2="140" y2="40" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
        </g>
        
        {/* Mittenplupp */}
        <circle cx="140" cy="140" r="8" fill="#f8fafc" />
        <circle cx="140" cy="140" r="3" fill="#1E293B" />
      </svg>

      <div className="mt-10 flex flex-col items-center w-full">
        <div className="text-6xl sm:text-7xl font-black text-[#1E293B] font-clock tracking-tighter mb-4 tabular-nums">
          {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="bg-[#f8fafc] px-6 sm:px-8 py-4 rounded-2xl border border-slate-200 text-center relative w-full sm:w-[80%] shadow-inner">
          <p className="text-blue-600 font-black uppercase text-lg sm:text-xl tracking-tight leading-tight pr-6">
            {getSwedishTimeWords(date)}
          </p>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => speakText(getSwedishTimeWords(date))}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg border-2 border-white hover:bg-blue-500 transition-colors"
          >
            <span className="text-lg">🔊</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// --- TÅRTBITARNA (Kvart, Halv osv) ---
const ClockFractions = () => {
  const fractions = [
    { 
      title: "Hel Timme", 
      desc: "Långa visaren rakt UPP", 
      color: "blue",
      svg: <path d="M 50 50 L 50 15" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
    },
    { 
      title: "Kvart Över", 
      desc: "Långa visaren rakt HÖGER", 
      color: "emerald",
      svg: <path d="M 50 50 L 50 15 A 35 35 0 0 1 85 50 Z" fill="#a7f3d0" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
    },
    { 
      title: "Halv", 
      desc: "Långa visaren rakt NER", 
      color: "amber",
      svg: <path d="M 50 50 L 50 15 A 35 35 0 0 1 50 85 Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
    },
    { 
      title: "Kvart I", 
      desc: "Långa visaren rakt VÄNSTER", 
      color: "rose",
      svg: <path d="M 50 50 L 15 50 A 35 35 0 0 1 50 15 Z" fill="#fecdd3" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round" />
    }
  ];

  const getColorClasses = (color) => {
    const classes = {
      blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
      emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
      amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" }
    };
    return classes[color];
  };

  return (
    <div className="pt-6">
      <div className="flex items-center gap-2 mb-4 px-2">
        <PremiumEmoji emoji="⏱️" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Förstå Klockan</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {fractions.map((f, i) => {
          const colors = getColorClasses(f.color);
          return (
            <div key={i} className={`rounded-[1.5rem] p-4 border flex flex-col items-center text-center shadow-sm ${colors.bg} ${colors.border}`}>
              
              {/* Den lilla SVG-klockan som ritar upp tårtbiten */}
              <div className="w-16 h-16 mb-3 relative bg-white rounded-full border-2 border-slate-200 shadow-inner flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="48" fill="none" />
                  {f.svg}
                  <circle cx="50" cy="50" r="4" fill="#1E293B" />
                </svg>
                {/* Pilar för att förtydliga riktningen utöver tårtbiten */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40 text-lg">
                  {i === 0 && <span className="-mt-8">⬆️</span>}
                  {i === 1 && <span className="ml-8">➡️</span>}
                  {i === 2 && <span className="mt-8">⬇️</span>}
                  {i === 3 && <span className="-ml-8">⬅️</span>}
                </div>
              </div>

              <span className={`font-black uppercase tracking-wide text-xs sm:text-sm ${colors.text} mb-1`}>
                {f.title}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                {f.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- KALENDER (Premium Monthly Style) ---
const CalendarCard = ({ date }) => {
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

  const currentMonth = monthThemes[date.getMonth()];
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const today = date.getDate();

  return (
    <div className="bg-white rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
      <div className={`bg-gradient-to-br ${currentMonth.gradient} p-8 flex items-center justify-between relative overflow-hidden`}>
        {/* Dekorativ stor emoji i bakgrunden */}
        <div className="absolute -right-4 -bottom-8 opacity-20 transform scale-150 pointer-events-none">
          <PremiumEmoji emoji={currentMonth.emoji} className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-white/80 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-1">Dagens datum</h2>
          <p className="text-white font-black text-4xl sm:text-5xl tracking-tight">
            {today} <span className="font-bold opacity-90">{currentMonth.name}</span>
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["M", "T", "O", "T", "F", "L", "S"].map((d, i) => (
            <div key={i} className="text-center text-slate-400 font-black text-[10px]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const isToday = day === today;
            return (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all ${
                  isToday 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50 scale-110' 
                  : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- MINNESREGLER (Premium Flashcards) ---
const LearnRhymes = () => {
  const dayColors = [
    { name: "Mån", full: "Måndag", color: "bg-[#4CAF50]", text: "Grön som gräset", icon: "🌱" },
    { name: "Tis", full: "Tisdag", color: "bg-[#2196F3]", text: "Blå som havet", icon: "💧" },
    { name: "Ons", full: "Onsdag", color: "bg-[#94a3b8]", text: "Lill-lördag (Vit)", icon: "☁️" },
    { name: "Tor", full: "Torsdag", color: "bg-[#8D6E63]", text: "Brun som ett träd", icon: "🪵" },
    { name: "Fre", full: "Fredag", color: "bg-[#FFEB3B]", text: "Gul som solen", icon: "☀️" },
    { name: "Lör", full: "Lördag", color: "bg-[#E91E63]", text: "Rosa som godis", icon: "🍬" },
    { name: "Sön", full: "Söndag", color: "bg-[#F44336]", text: "Röd för vila", icon: "🛑" }
  ];

  return (
    <div className="space-y-8 pt-4">
      {/* Veckans färger */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <PremiumEmoji emoji="📅" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Veckans färger</h3>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 snap-x -mx-4 px-4 scrollbar-hide">
          {dayColors.map(day => (
            <div key={day.name} className="flex-shrink-0 w-32 snap-center bg-white rounded-[2rem] p-4 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col items-center text-center">
              <div className={`${day.color} w-14 h-14 rounded-2xl mb-3 shadow-inner flex items-center justify-center border-[3px] border-white`}>
                <span className="text-2xl drop-shadow-sm">{day.icon}</span>
              </div>
              <span className="font-black text-[#1E293B] text-xs uppercase mb-1 tracking-wide">{day.full}</span>
              <span className="text-[9px] font-bold text-slate-400 leading-tight tracking-widest uppercase">{day.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Knogtricket */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-4">
          <PremiumEmoji emoji="👊" className="w-8 h-8" />
          <h3 className="font-black text-[#1E293B] uppercase tracking-tight text-lg">Knog-tricket</h3>
        </div>
        <p className="text-slate-500 font-bold text-xs leading-relaxed mb-6">
          Gör händer till knytnävar. Knogar = 31 dagar. Dalar = 30 dagar!
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-blue-50/50 p-4 rounded-[1.5rem] border border-blue-100 flex flex-col items-center text-center">
            <span className="text-3xl mb-2 drop-shadow-sm">⛰️</span>
            <span className="font-black text-blue-800 text-xs uppercase tracking-wide">Knoge</span>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">31 Dagar</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col items-center text-center">
            <span className="text-3xl mb-2 drop-shadow-sm">🕳️</span>
            <span className="font-black text-slate-700 text-xs uppercase tracking-wide">Dal</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">30 Dagar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LearnTab = () => {
  const [simTimeMs, setSimTimeMs] = useState(new Date().setSeconds(0));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      <CalendarCard date={new Date()} />
      
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4 px-2">
          <PremiumEmoji emoji="🕰️" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Träna på klockan</h3>
        </div>
        <InteractiveClock simTimeMs={simTimeMs} setSimTimeMs={setSimTimeMs} />
      </div>

      <ClockFractions />
      
      <LearnRhymes />
    </motion.div>
  );
};

export default LearnTab;