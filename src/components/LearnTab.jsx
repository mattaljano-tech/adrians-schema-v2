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

  const date = new Date(simTimeMs);
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  const mDeg = date.getMinutes() * 6;

  const mString = date.getMinutes() < 10 ? `noll ${date.getMinutes()}` : date.getMinutes();
  const spokenText = `Klockan är ${date.getHours()} och ${mString}. Det betyder: ${getSwedishAnalog(date).toLowerCase()}.`;

  return (
    <div className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center">
      <div className="bg-blue-50 text-blue-600 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 flex items-center gap-2">
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
        <circle cx="140" cy="140" r="135" fill="#1E293B" />
        <circle cx="140" cy="140" r="120" fill="white" opacity="0.05" />
        
        {[...Array(60)].map((_, i) => (
          <circle 
            key={`min-${i}`} 
            cx={140 + 115 * Math.cos((i * 6 - 90) * Math.PI / 180)} 
            cy={140 + 115 * Math.sin((i * 6 - 90) * Math.PI / 180)} 
            r={i % 5 === 0 ? 0 : 1.5} 
            fill="#64748b" 
          />
        ))}

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const angle = (num * 30 - 90) * (Math.PI / 180);
          const radius = 95; 
          const x = 140 + radius * Math.cos(angle);
          const y = 140 + radius * Math.sin(angle);
          return (
            <text 
              key={num} 
              x={x} 
              y={y} 
              textAnchor="middle" 
              dominantBaseline="central" 
              className="text-[26px] font-black font-clock fill-white select-none pointer-events-none"
            >
              {num}
            </text>
          );
        })}

        <g transform={`rotate(${hDeg} 140 140)`}>
          <line x1="140" y1="140" x2="140" y2="85" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
        </g>
        <g transform={`rotate(${mDeg} 140 140)`}>
          <line x1="140" y1="140" x2="140" y2="40" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
        </g>
        
        <circle cx="140" cy="140" r="8" fill="#f8fafc" />
        <circle cx="140" cy="140" r="3" fill="#1E293B" />
      </svg>

      <div className="mt-8 flex flex-col items-center w-full">
        <div className="text-[5rem] sm:text-[6rem] font-black text-[#1E293B] font-clock tracking-tighter mb-2 tabular-nums leading-none">
          {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        <div className="bg-[#f8fafc] px-6 sm:px-8 py-5 rounded-2xl border border-slate-200 text-center relative w-full sm:w-[90%] shadow-inner mt-4">
          <p className="text-blue-600 font-black uppercase text-xl sm:text-2xl tracking-tight leading-tight pr-6">
            {getSwedishAnalog(date)}
          </p>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => speakText(spokenText)}
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-4 rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.4)] border-4 border-white transition-colors"
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
    { id: "hel", title: "HEL", desc: "Detta är en hel timme (60 min).", subDesc: "Ett helt varv runt klockan.", bg: "bg-[#FFF8E7]", titleColor: "text-[#991B1B]", piePath: <circle cx="50" cy="50" r="40" fill="#FDE047" />, mDeg: 0, hDeg: 0 },
    { id: "kvart_over", title: "KVART ÖVER", desc: "Detta är en kvart (15 min).", subDesc: "Från hel till kvart över.", bg: "bg-[#EFF6FF]", titleColor: "text-[#1E40AF]", piePath: <path d="M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z" fill="#BFDBFE" />, mDeg: 90, hDeg: 7.5 },
    { id: "halv", title: "HALV", desc: "Detta är en halvtimme (30 min).", subDesc: "Från hel till halv.", bg: "bg-[#ECFDF5]", titleColor: "text-[#065F46]", piePath: <path d="M 50 50 L 50 10 A 40 40 0 0 1 50 90 Z" fill="#A7F3D0" />, mDeg: 180, hDeg: 15 },
    { id: "kvart_i", title: "KVART I", desc: "Detta är också en kvart (15 min).", subDesc: "Från kvart i fram till hel.", bg: "bg-[#FEF2F2]", titleColor: "text-[#BE123C]", piePath: <path d="M 50 50 L 10 50 A 40 40 0 0 1 50 10 Z" fill="#FECDD3" />, mDeg: 270, hDeg: 22.5 }
  ];

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 mb-4 px-2">
        <PremiumEmoji emoji="🍕" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Tårtbitarna (Bråkdelar)</h3>
      </div>
      
      <div className="flex flex-col gap-3 sm:gap-4 px-1">
        {fractions.map((f) => (
          <div key={f.id} className={`${f.bg} rounded-[2rem] p-4 sm:p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-5 sm:gap-6`}>
            <div className="w-24 h-24 sm:w-[110px] sm:h-[110px] flex-shrink-0 relative flex items-center justify-center bg-white rounded-full border-[5px] border-[#1E293B] shadow-sm">
              <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
                {f.piePath}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                  const angle = (num * 30 - 90) * (Math.PI / 180);
                  return (
                    <text key={num} x={50 + 32 * Math.cos(angle)} y={50 + 32 * Math.sin(angle)} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black font-clock fill-[#1E293B]">
                      {num}
                    </text>
                  );
                })}
                <g transform={`rotate(${f.hDeg} 50 50)`}><line x1="50" y1="50" x2="50" y2="28" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" /></g>
                <g transform={`rotate(${f.mDeg} 50 50)`}><line x1="50" y1="50" x2="50" y2="15" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" /></g>
                <circle cx="50" cy="50" r="3.5" fill="#1E293B" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className={`font-black uppercase tracking-tight text-[22px] sm:text-[26px] ${f.titleColor} mb-1 leading-none`}>{f.title}</span>
              <span className="text-[12px] sm:text-[14px] font-medium text-[#1E293B] mb-1.5 leading-snug">{f.desc}</span>
              <span className="text-[11px] sm:text-[12px] font-black text-slate-400 uppercase tracking-wide">{f.subDesc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- KALENDER EXAKT ENLIGT BILD ---
const CalendarCard = () => {
  const realToday = new Date();
  const [viewDate, setViewDate] = useState(new Date(realToday.getFullYear(), realToday.getMonth(), 1));

  // Pedagogiska färger exakt enligt bilden
  const weekColors = [
    { name: "MÅN", bg: "bg-[#4CAF50]", text: "text-white" },
    { name: "TIS", bg: "bg-[#2196F3]", text: "text-white" },
    { name: "ONS", bg: "bg-[#94A3B8]", text: "text-white" },
    { name: "TOR", bg: "bg-[#8D6E63]", text: "text-white" },
    { name: "FRE", bg: "bg-[#FDE047]", text: "text-[#1E293B]" }, // Gul ruta = mörk text
    { name: "LÖR", bg: "bg-[#E91E63]", text: "text-white" },
    { name: "SÖN", bg: "bg-[#EF4444]", text: "text-white" }
  ];

  const monthNames = ["JANUARI", "FEBRUARI", "MARS", "APRIL", "MAJ", "JUNI", "JULI", "AUGUSTI", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DECEMBER"];
  const currentMonthName = monthNames[viewDate.getMonth()];
  const currentYear = viewDate.getFullYear();

  // Datum-matematik
  const daysInMonth = new Date(currentYear, viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // 0 = Måndag

  const prevMonth = () => setViewDate(new Date(currentYear, viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, viewDate.getMonth() + 1, 1));

  // Vilken veckodag är det IDAG? (Används för att färga texten/border i botten)
  const realTodayDayOfWeek = realToday.getDay() === 0 ? 6 : realToday.getDay() - 1;
  const todayColorHex = weekColors[realTodayDayOfWeek].bg.replace('bg-[', '').replace(']', '');

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden max-w-[450px] mx-auto border-[6px] border-white">
      
      {/* HEADER BILD (Grön med kyckling) */}
      <div className="bg-gradient-to-b from-[#5DD74D] to-[#8BE638] h-[140px] relative flex justify-center pt-6">
        {/* Svaga tulpaner i bakgrunden */}
        <PremiumEmoji emoji="🌷" className="absolute left-4 bottom-8 w-16 h-16 opacity-20" />
        <PremiumEmoji emoji="🌷" className="absolute right-4 bottom-8 w-16 h-16 opacity-20" />
        
        {/* Mitten-kycklingen */}
        <PremiumEmoji emoji="🐣" className="w-16 h-16 relative z-10" />

        {/* Piller-navigering (överlappar kanten) */}
        <div className="absolute -bottom-5 z-20 flex items-center justify-between bg-[#65C547] text-white px-2 py-1.5 rounded-full shadow-md w-[220px] border-[3px] border-white">
          <motion.button whileTap={{ scale: 0.8 }} onClick={prevMonth} className="px-3 py-1 font-black text-lg">
            &lt;
          </motion.button>
          <span className="font-black uppercase tracking-wider text-sm">
            {currentMonthName} {currentYear}
          </span>
          <motion.button whileTap={{ scale: 0.8 }} onClick={nextMonth} className="px-3 py-1 font-black text-lg">
            &gt;
          </motion.button>
        </div>
      </div>

      {/* KALENDER KROPP */}
      <div className="pt-10 pb-8 px-5 bg-white">
        
        {/* Veckodagar */}
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {weekColors.map((day, i) => (
            <div key={i} className={`${day.bg} ${day.text} text-[9px] sm:text-[10px] font-black text-center py-1.5 rounded-md uppercase tracking-wider shadow-sm`}>
              {day.name}
            </div>
          ))}
        </div>

        {/* Dagar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Tomma rutor */}
          {[...Array(startOffset)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Siffrorna */}
          {[...Array(daysInMonth)].map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeek = (startOffset + i) % 7;
            const isToday = dayNum === realToday.getDate() && viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear();
            const isPast = dayNum < realToday.getDate() && viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear() || viewDate < new Date(realToday.getFullYear(), realToday.getMonth(), 1);

            if (isToday) {
              // DAGENS DATUM
              return (
                <div key={dayNum} className="relative z-10">
                  <div className={`${weekColors[dayOfWeek].bg} text-white aspect-square rounded-xl flex items-center justify-center font-black text-xl border-[3px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] scale-110`}>
                    {dayNum}
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                </div>
              );
            }

            if (isPast) {
              // PASSERADE DAGAR (Svaga)
              return (
                <div key={dayNum} className="aspect-square rounded-xl flex items-center justify-center font-black text-lg sm:text-xl border-2 border-[#F8FAFC] text-[#CBD5E1] bg-white">
                  {dayNum}
                </div>
              );
            }

            // FRAMTIDA DAGAR (Tydliga men inte markerade)
            return (
              <div key={dayNum} className="aspect-square rounded-xl flex items-center justify-center font-black text-lg sm:text-xl border-2 border-[#F1F5F9] text-[#94A3B8] bg-[#FAF8F5]/30">
                {dayNum}
              </div>
            );
          })}
        </div>

        {/* BOTTEN: IDAG ÄR DET... */}
        {viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear() && (
          <div className="mt-8 flex flex-col items-center justify-center relative">
            {/* Elegant pil som pekar uppåt */}
            <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="-mb-1 text-[#94A3B8]">
              <path d="M20 2 L10 18 L30 18 Z" fill="currentColor" opacity="0.2"/>
              <path d="M20 2 C 25 10, 35 15, 35 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
            </svg>
            
            <div 
              className="border-[3px] rounded-full px-6 py-2.5 shadow-sm bg-white"
              style={{ borderColor: todayColorHex }}
            >
              <span className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mr-2">Idag är det:</span>
              <span className="text-sm font-black uppercase" style={{ color: todayColorHex }}>
                {weekColors[realTodayDayOfWeek].name}DAG
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