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
    utterance.rate = 0.85; 
    const voices = window.speechSynthesis.getVoices();
    const swedishVoice = voices.find(v => v.name.includes('Klara') || v.name.includes('Premium') || v.lang === 'sv-SE');
    if (swedishVoice) utterance.voice = swedishVoice;
    window.speechSynthesis.speak(utterance);
  }
};

// --- EXAKT SVENSK TID (ANALOG) ---
const getSwedishAnalog = (date) => {
  const hNum = date.getHours();
  const m = date.getMinutes();
  const h = hNum % 12 || 12;
  const nextH = (hNum + 1) % 12 || 12;

  if (m === 0) return `Klockan är ${h}`;
  if (m === 15) return `Kvart över ${h}`;
  if (m === 30) return `Halv ${nextH}`;
  if (m === 45) return `Kvart i ${nextH}`;

  if (m === 5) return `Fem över ${h}`;
  if (m === 10) return `Tio över ${h}`;
  if (m === 20) return `Tjugo över ${h}`;
  if (m === 25) return `Fem i halv ${nextH}`;
  if (m === 35) return `Fem över halv ${nextH}`;
  if (m === 40) return `Tjugo i ${nextH}`;
  if (m === 50) return `Tio i ${nextH}`;
  if (m === 55) return `Fem i ${nextH}`;

  if (m < 30) return `${m} över ${h}`;
  return `${60 - m} i ${nextH}`;
};

// --- INTERAKTIV KLOCKA ---
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

  const handleDoubleClick = () => {
    setSimTimeMs(new Date().setSeconds(0));
  };

  const date = new Date(simTimeMs);
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  const mDeg = date.getMinutes() * 6;

  const mString = date.getMinutes() < 10 ? `noll ${date.getMinutes()}` : date.getMinutes();
  const spokenText = `Klockan är ${date.getHours()} och ${mString}. Det betyder: ${getSwedishAnalog(date).toLowerCase()}.`;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center overflow-hidden">
      <div className="bg-blue-50 text-blue-600 px-5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-8 border border-blue-100 flex items-center gap-2 text-center shadow-sm">
        <PremiumEmoji emoji="👆" className="w-4 h-4" /> Snurra / Dubbelklicka för "Nu"
      </div>

      <div className="relative rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-white p-1">
        <svg 
          ref={svgRef}
          viewBox="0 0 280 280"
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onPointerMove={handlePointerMove}
          onDoubleClick={handleDoubleClick}
          className="w-64 h-64 sm:w-72 sm:h-72 touch-none cursor-grab active:cursor-grabbing bg-slate-50 rounded-full border border-slate-200 shadow-inner"
        >
          <circle cx="140" cy="140" r="135" fill="none" />
          
          {[...Array(60)].map((_, i) => (
            <circle 
              key={`min-${i}`} 
              cx={140 + 120 * Math.cos((i * 6 - 90) * Math.PI / 180)} 
              cy={140 + 120 * Math.sin((i * 6 - 90) * Math.PI / 180)} 
              r={i % 5 === 0 ? 0 : 1.5} 
              fill="#94a3b8" 
            />
          ))}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
            const angle = (num * 30 - 90) * (Math.PI / 180);
            const radius = 98; 
            const x = 140 + radius * Math.cos(angle);
            const y = 140 + radius * Math.sin(angle);
            return (
              <text 
                key={num} x={x} y={y} 
                textAnchor="middle" dominantBaseline="central" 
                className="text-[26px] font-black font-clock fill-slate-800 select-none pointer-events-none"
              >
                {num}
              </text>
            );
          })}

          <g transform={`rotate(${hDeg} 140 140)`}>
            <line x1="140" y1="140" x2="140" y2="85" stroke="rgba(0,0,0,0.15)" strokeWidth="8" strokeLinecap="round" transform="translate(2, 2)" />
          </g>
          <g transform={`rotate(${mDeg} 140 140)`}>
            <line x1="140" y1="140" x2="140" y2="40" stroke="rgba(0,0,0,0.15)" strokeWidth="6" strokeLinecap="round" transform="translate(2, 2)" />
          </g>

          <g transform={`rotate(${hDeg} 140 140)`}>
            <line x1="140" y1="140" x2="140" y2="85" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
          </g>
          
          <g transform={`rotate(${mDeg} 140 140)`}>
            <line x1="140" y1="140" x2="140" y2="40" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
          </g>
          
          <circle cx="140" cy="140" r="10" fill="#1e293b" />
          <circle cx="140" cy="140" r="4" fill="#f8fafc" />
        </svg>
      </div>

      <div className="mt-10 flex flex-col items-center w-full">
        <div className="text-[5rem] sm:text-[6rem] font-black text-slate-800 font-clock tracking-tighter mb-4 tabular-nums leading-none">
          {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        <div className="bg-slate-50 px-6 sm:px-8 py-5 rounded-[1.5rem] border border-slate-100 text-center relative w-full sm:w-[90%] shadow-inner flex items-center">
          <p className="text-blue-600 font-black text-xl sm:text-2xl tracking-tight leading-tight pr-6 flex-1">
            {getSwedishAnalog(date)}
          </p>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => speakText(spokenText)}
            className="flex-shrink-0 bg-blue-600 text-white w-14 h-14 flex items-center justify-center rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-colors ml-2"
          >
            <span className="text-2xl">🔊</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// --- TÅRTBITARNA ---
const ClockFractions = () => {
  const fractions = [
    { id: "hel", title: "Hel timme", desc: "Ett helt varv", mins: "60 min", color: "text-[#eab308]", shadow: "shadow-yellow-500/20", piePath: <circle cx="50" cy="50" r="40" fill="#fde047" />, mDeg: 0, hDeg: 0 },
    { id: "kvart_over", title: "Kvart över", desc: "En kvart framåt", mins: "15 min", color: "text-[#3b82f6]", shadow: "shadow-blue-500/20", piePath: <path d="M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z" fill="#bfdbfe" />, mDeg: 90, hDeg: 7.5 },
    { id: "halv", title: "Halv", desc: "En halvtimme", mins: "30 min", color: "text-[#10b981]", shadow: "shadow-emerald-500/20", piePath: <path d="M 50 50 L 50 10 A 40 40 0 0 1 50 90 Z" fill="#a7f3d0" />, mDeg: 180, hDeg: 15 },
    { id: "kvart_i", title: "Kvart i", desc: "En kvart kvar", mins: "15 min", color: "text-[#ef4444]", shadow: "shadow-red-500/20", piePath: <path d="M 50 50 L 10 50 A 40 40 0 0 1 50 10 Z" fill="#fecaca" />, mDeg: 270, hDeg: 22.5 }
  ];

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 mb-4 px-2">
        <PremiumEmoji emoji="🍕" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Bråkdelar</h3>
      </div>
      
      <div className="flex flex-col gap-3 sm:gap-4 px-1">
        {fractions.map((f) => (
          <div key={f.id} className="bg-white rounded-[2rem] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-5 sm:gap-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow">
            
            <div className={`w-20 h-20 sm:w-[90px] sm:h-[90px] flex-shrink-0 relative flex items-center justify-center bg-slate-50 rounded-full shadow-lg ${f.shadow}`}>
              <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
                {f.piePath}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                  const angle = (num * 30 - 90) * (Math.PI / 180);
                  return (
                    <text key={num} x={50 + 32 * Math.cos(angle)} y={50 + 32 * Math.sin(angle)} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black font-clock fill-slate-800">
                      {num}
                    </text>
                  );
                })}
                <g transform={`rotate(${f.hDeg} 50 50)`}><line x1="50" y1="50" x2="50" y2="28" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" /></g>
                <g transform={`rotate(${f.mDeg} 50 50)`}><line x1="50" y1="50" x2="50" y2="15" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" /></g>
                <circle cx="50" cy="50" r="3.5" fill="#1E293B" />
              </svg>
            </div>
            
            <div className="flex flex-col justify-center flex-1">
              <span className={`font-black tracking-tight text-xl sm:text-2xl ${f.color} mb-0.5 leading-none`}>{f.title}</span>
              <span className="text-[12px] sm:text-[14px] font-bold text-slate-600 mb-1 leading-snug">{f.desc}</span>
            </div>

            <div className="bg-slate-50 text-slate-400 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest border border-slate-100 flex-shrink-0">
              {f.mins}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

// --- KALENDER ---
const CalendarCard = () => {
  const realToday = new Date();
  const [viewDate, setViewDate] = useState(new Date(realToday.getFullYear(), realToday.getMonth(), 1));

  const weekColors = [
    { name: "MÅN", bg: "bg-[#D1FAE5]", text: "text-[#065F46]", border: "border-[#A7F3D0]" },
    { name: "TIS", bg: "bg-[#E0F2FE]", text: "text-[#075985]", border: "border-[#BAE6FD]" },
    { name: "ONS", bg: "bg-[#F1F5F9]", text: "text-[#475569]", border: "border-[#E2E8F0]" },
    { name: "TOR", bg: "bg-[#F5F5F4]", text: "text-[#57534E]", border: "border-[#E7E5E4]" },
    { name: "FRE", bg: "bg-[#FEF9C3]", text: "text-[#854D0E]", border: "border-[#FEF08A]" },
    { name: "LÖR", bg: "bg-[#FCE7F3]", text: "text-[#9D174D]", border: "border-[#FBCFE8]" },
    { name: "SÖN", bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#FECACA]" } 
  ];

  const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
  const currentMonthName = monthNames[viewDate.getMonth()];
  const currentYear = viewDate.getFullYear();

  const daysInMonth = new Date(currentYear, viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const prevMonth = () => setViewDate(new Date(currentYear, viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, viewDate.getMonth() + 1, 1));

  const realTodayDayOfWeek = realToday.getDay() === 0 ? 6 : realToday.getDay() - 1;
  const todayColor = weekColors[realTodayDayOfWeek];

  return (
    <div className="relative bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] max-w-[450px] mx-auto border border-slate-50 mt-4">
      
      {/* HEADER BILD (OBS: Har tagit bort overflow-hidden härifrån!) */}
      <div className="bg-gradient-to-b from-[#86EFAC] to-[#A7F3D0] h-[150px] rounded-t-[2.5rem] relative flex justify-center pt-8 border-b border-[#6ee7b7] overflow-hidden">
        <PremiumEmoji emoji="🌷" className="absolute left-4 bottom-6 w-16 h-16 opacity-40 blur-[1px]" />
        <PremiumEmoji emoji="🌷" className="absolute right-4 bottom-6 w-16 h-16 opacity-40 blur-[1px]" />
        
        <PremiumEmoji emoji="🐣" className="w-20 h-20 relative z-10 drop-shadow-xl" />
      </div>

      {/* --- MÅNADS-NAVIGERING (Flyter NU fritt ovanpå kanten) --- */}
      <div className="absolute top-[126px] left-1/2 -translate-x-1/2 z-20 flex items-center justify-between bg-white text-slate-800 p-1.5 rounded-[1.25rem] shadow-[0_8px_25px_rgba(0,0,0,0.08)] w-[260px] border border-slate-100">
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={prevMonth} 
          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
        >
          {/* Snygg Vänsterpil i SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </motion.button>

        <span className="font-black uppercase tracking-widest text-[12px] pt-0.5">
          {currentMonthName} {currentYear}
        </span>

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={nextMonth} 
          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
        >
          {/* Snygg Högerpil i SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </motion.button>
      </div>

      {/* KALENDER KROPP */}
      <div className="pt-16 pb-8 px-6 bg-[#FAFAF9] rounded-b-[2.5rem]">
        
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {weekColors.map((day, i) => (
            <div key={i} className={`${day.bg} ${day.text} text-[9px] sm:text-[10px] font-black text-center py-2 rounded-lg uppercase tracking-wider shadow-sm border border-white`}>
              {day.name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {[...Array(startOffset)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {[...Array(daysInMonth)].map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeek = (startOffset + i) % 7;
            const dayColor = weekColors[dayOfWeek]; 
            
            const isToday = dayNum === realToday.getDate() && viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear();
            const isPast = (dayNum < realToday.getDate() && viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear()) || viewDate < new Date(realToday.getFullYear(), realToday.getMonth(), 1);

            if (isToday) {
              return (
                <div key={dayNum} className="relative z-10 flex flex-col items-center justify-center">
                  <div className={`bg-white ${dayColor.text} ${dayColor.border} aspect-square w-full rounded-2xl flex items-center justify-center font-black text-2xl border-[3px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] scale-110`}>
                    {dayNum}
                  </div>
                  <div className={`absolute -bottom-2.5 w-1.5 h-1.5 rounded-full ${dayColor.bg} border border-${dayColor.border.split('-')[1]}`}></div>
                </div>
              );
            }

            if (isPast) {
              return (
                <div key={dayNum} className={`${dayColor.bg} ${dayColor.text} opacity-40 aspect-square rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl border border-transparent`}>
                  {dayNum}
                </div>
              );
            }

            return (
              <div key={dayNum} className={`${dayColor.bg} ${dayColor.text} aspect-square rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-sm border border-white hover:brightness-95 transition-all`}>
                {dayNum}
              </div>
            );
          })}
        </div>

        {viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear() && (
          <div className="mt-8 flex flex-col items-center justify-center relative">
            <div className={`bg-white border-2 ${todayColor.border} rounded-full px-6 py-3 shadow-sm flex items-center gap-3`}>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Idag är det</span>
              <span className={`text-sm font-black uppercase tracking-widest ${todayColor.text}`}>
                {todayColor.name}DAG
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HUVUDKOMPONENT ---
const LearnTab = () => {
  const [simTimeMs, setSimTimeMs] = useState(new Date().setSeconds(0));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      <CalendarCard />
      
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4 px-2">
          <PremiumEmoji emoji="🕰️" className="w-6 h-6" />
          <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Träna på klockan</h3>
        </div>
        <InteractiveClock simTimeMs={simTimeMs} setSimTimeMs={setSimTimeMs} />
      </div>

      <ClockFractions />
      
    </motion.div>
  );
};

export default LearnTab;