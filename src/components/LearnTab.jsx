import React, { useState, useEffect, useRef } from 'react';
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

// --- INTERAKTIV KLOCKA (Premium Draggable) ---
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
        <PremiumEmoji emoji="👆" className="w-4 h-4" /> Snurra visarna för att lära dig
      </div>

      <svg 
        ref={svgRef}
        viewBox="0 0 280 280"
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onPointerMove={handlePointerMove}
        className="w-64 h-64 sm:w-80 sm:h-80 touch-none cursor-grab active:cursor-grabbing drop-shadow-2xl"
      >
        <circle cx="140" cy="140" r="135" fill="#1E293B" />
        <circle cx="140" cy="140" r="120" fill="white" opacity="0.05" />
        
        {/* Tim-markeringar */}
        {[...Array(12)].map((_, i) => (
          <line 
            key={i} 
            x1="140" y1="20" x2="140" y2="35" 
            transform={`rotate(${i * 30} 140 140)`} 
            stroke="#64748b" strokeWidth="4" strokeLinecap="round" 
          />
        ))}

        {/* Visare */}
        <g transform={`rotate(${hDeg} 140 140)`}>
          <line x1="140" y1="140" x2="140" y2="80" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
        </g>
        <g transform={`rotate(${mDeg} 140 140)`}>
          <line x1="140" y1="140" x2="140" y2="45" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
        </g>
        
        <circle cx="140" cy="140" r="8" fill="#f8fafc" />
      </svg>

      <div className="mt-10 flex flex-col items-center">
        <div className="text-6xl font-black text-[#1E293B] font-clock tracking-tighter mb-4 tabular-nums">
          {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="bg-[#f8fafc] px-8 py-4 rounded-2xl border border-slate-200 text-center relative min-w-[280px]">
          <p className="text-blue-600 font-black uppercase text-xl tracking-tight leading-tight">
            {getSwedishTimeWords(date)}
          </p>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => speakText(getSwedishTimeWords(date))}
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg border-2 border-white"
          >
            <span className="text-xl">🔊</span>
          </motion.button>
        </div>
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
      <div className={`bg-gradient-to-br ${currentMonth.gradient} p-8 flex items-center justify-between`}>
        <div>
          <h2 className="text-white font-black uppercase tracking-[0.2em] text-sm opacity-80 mb-1">Dagens datum</h2>
          <p className="text-white font-black text-4xl tracking-tight">
            {today} {currentMonth.name}
          </p>
        </div>
        <PremiumEmoji emoji={currentMonth.emoji} className="w-20 h-20" />
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["M", "T", "O", "T", "F", "L", "S"].map(d => (
            <div key={d} className="text-center text-slate-400 font-black text-[10px]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const isToday = day === today;
            return (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-black transition-all ${
                  isToday 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
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
    <div className="space-y-8">
      {/* Veckans färger */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <PremiumEmoji emoji="📅" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Veckans färger</h3>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 snap-x -mx-4 px-4 scrollbar-hide">
          {dayColors.map(day => (
            <div key={day.name} className="flex-shrink-0 w-32 snap-center bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className={`${day.color} w-12 h-12 rounded-full mb-3 shadow-inner flex items-center justify-center border-2 border-white`}>
                <span className="text-xl">{day.icon}</span>
              </div>
              <span className="font-black text-[#1E293B] text-xs uppercase mb-1">{day.full}</span>
              <span className="text-[10px] font-bold text-slate-400 leading-tight">{day.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Knogtricket */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <PremiumEmoji emoji="👊" className="w-10 h-10" />
          <h3 className="font-black text-[#1E293B] uppercase tracking-tight text-xl">Knog-tricket</h3>
        </div>
        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-6">
          Gör händer till knytnävar. Knogar = 31 dagar. Dalar = 30 dagar!
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">⛰️</span>
            <span className="font-black text-blue-700 text-xs uppercase">Knoge</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">31 Dagar</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">🕳️</span>
            <span className="font-black text-slate-700 text-xs uppercase">Dal</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">30 Dagar</span>
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
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-12"
    >
      <CalendarCard date={new Date()} />
      <InteractiveClock simTimeMs={simTimeMs} setSimTimeMs={setSimTimeMs} />
      <LearnRhymes />
    </motion.div>
  );
};

export default LearnTab;