import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// --- HELP FUNCTIONS FOR TIME AND TALK (Unchanged) ---
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

  const numWords = ["", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv", "tretton", "fjorton", "femton", "sexton", "sjutton", "arton", "nitton", "tjugo", "tjugoen", "tjugotvå", "tjugotre", "tjugofyra"];
  const getMinStr = (num) => `${numWords[num]} ${num === 1 ? "minut" : "minuter"}`;

  if (minutes > 0 && minutes < 25) {
    if (minutes > 20) return `${getMinStr(30 - minutes)} i halv ${hourNames[nextH]}`;
    return `${getMinStr(minutes)} över ${hourNames[h]}`;
  } else if (minutes > 25 && minutes < 30) {
    return `${getMinStr(30 - minutes)} i halv ${hourNames[nextH]}`;
  } else if (minutes > 30 && minutes < 35) {
    return `${getMinStr(minutes - 30)} över halv ${hourNames[nextH]}`;
  } else if (minutes > 35 && minutes < 45) {
    if (minutes < 40) return `${getMinStr(minutes - 30)} över halv ${hourNames[nextH]}`;
    return `${getMinStr(60 - minutes)} i ${hourNames[nextH]}`;
  } else if (minutes > 30 && minutes < 45) {
    return `${getMinStr(60 - minutes)} i ${hourNames[nextH]}`;
  }
};

const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sv-SE';
    utterance.rate = 0.75; 
    window.speechSynthesis.speak(utterance);
  }
};

// --- COMPONENT: PEDAGOGICAL PIE CLOCK (Updated Layout) ---
const ConceptClock = ({ title, desc, hourDeg, minDeg, path, colorTheme }) => {
  
  // Color Themes
  const themes = {
    green: { bg: 'bg-emerald-100', border: 'border-emerald-200', title: 'text-emerald-900', desc: 'text-emerald-800', fill: 'rgba(16, 185, 129, 0.25)' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-200', title: 'text-orange-900', desc: 'text-orange-900', fill: 'rgba(249, 115, 22, 0.2)' },
    indigo: { bg: 'bg-indigo-100', border: 'border-indigo-200', title: 'text-indigo-900', desc: 'text-indigo-800', fill: 'rgba(99, 102, 241, 0.2)' },
    yellow: { bg: 'bg-amber-100', border: 'border-amber-200', title: 'text-amber-900', desc: 'text-amber-800', fill: 'rgba(245, 158, 11, 0.3)' },
  };

  const t = themes[colorTheme] || themes.indigo;

  return (
    <div className={`${t.bg} p-4 rounded-3xl border-2 ${t.border} flex flex-col items-center text-center shadow-sm`}>
      
      {/* Title ABOVE */}
      <span className={`font-black ${t.title} uppercase text-xs sm:text-sm mb-3`}>{title}</span>
      
      <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white rounded-full border-[6px] border-slate-800 shadow-md mb-3">
        
        {/* The Pie Slice */}
        {path && <path d={path} fill={t.fill} />}
        {title === "Hel" && <circle cx="50" cy="50" r="45" fill={t.fill} />}
        
        {/* Small ticks for 12, 3, 6, 9 */}
        <line x1="50" y1="5" x2="50" y2="10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="95" y1="50" x2="90" y2="50" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="95" x2="50" y2="90" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="50" x2="10" y2="50" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        
        {/* Hour Hand (Red) */}
        <g transform={`rotate(${hourDeg} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="28" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        </g>
        
        {/* Minute Hand (Blue) */}
        <g transform={`rotate(${minDeg} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="12" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        </g>
        
        {/* The dot in the middle */}
        <circle cx="50" cy="50" r="3" fill="#1e293b" />
      </svg>
      
      {/* Description BELOW */}
      <span className={`text-[10px] sm:text-xs ${t.desc} font-bold leading-snug`}>{desc}</span>
    </div>
  );
};

// --- THE INTERACTIVE CLOCK (Unchanged) ---
const InteractiveClock = ({ time, setTime, onDoubleClick }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);

  const getAngle = (clientX, clientY) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    angle = angle + 90; 
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setLastAngle(getAngle(e.clientX, e.clientY));
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    let diff = currentAngle - lastAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    setTime(prev => prev + (diff / 6) * 60000);
    setLastAngle(currentAngle);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
    setTime(prev => Math.round(prev / 60000) * 60000);
  };

  const dDate = new Date(time);
  const hDeg = (dDate.getHours() % 12) * 30 + dDate.getMinutes() * 0.5;
  const mDeg = dDate.getMinutes() * 6 + dDate.getSeconds() * 0.1;

  return (
    <div className="relative flex flex-col items-center">
      <svg 
        ref={svgRef}
        width="100%" height="100%" viewBox="0 0 280 280"
        className="touch-none bg-slate-50 rounded-full border-[10px] border-slate-800 shadow-xl cursor-pointer w-64 h-64"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={onDoubleClick}
      >
        {Array.from({length: 60}).map((_, i) => {
          const angle = i * 6 - 90;
          const isHour = i % 5 === 0;
          const rad = angle * Math.PI / 180;
          return (
            <line key={i}
              x1={140 + (isHour ? 115 : 125) * Math.cos(rad)}
              y1={140 + (isHour ? 115 : 125) * Math.sin(rad)}
              x2={140 + 130 * Math.cos(rad)}
              y2={140 + 130 * Math.sin(rad)}
              stroke={isHour ? "#334155" : "#cbd5e1"}
              strokeWidth={isHour ? 4 : 2}
            />
          );
        })}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
          const rad = (num * 30 - 90) * Math.PI / 180;
          return (
            <text key={num} x={140 + 95 * Math.cos(rad)} y={140 + 95 * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" className="text-2xl font-black fill-slate-400 select-none">
              {num}
            </text>
          );
        })}
        <g transform={`rotate(${hDeg} 140 140)`} style={{filter: "drop-shadow(2px 4px 4px rgba(0,0,0,0.2))"}}>
          <line x1="140" y1="140" x2="140" y2="75" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
        </g>
        <g transform={`rotate(${mDeg} 140 140)`} style={{filter: "drop-shadow(2px 6px 6px rgba(0,0,0,0.3))"}}>
          <line x1="140" y1="140" x2="140" y2="35" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
        </g>
        <circle cx="140" cy="140" r="12" fill="#1e293b" />
        <circle cx="140" cy="140" r="5" fill="#ffffff" />
      </svg>
    </div>
  );
};

// --- LEARNTAB (With Updated 2x2 Grid) ---
const LearnTab = () => {
  const [simTimeMs, setSimTimeMs] = useState(() => {
    const d = new Date();
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d.getTime();
  });

  const handleResetToNow = () => {
    const d = new Date();
    d.setSeconds(0);
    d.setMilliseconds(0);
    setSimTimeMs(d.getTime());
  };

  const currentSimDate = new Date(simTimeMs);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-8 pb-12"
    >
      {/* INTERACTIVE CLOCK (Unchanged) */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-blue-200 shadow-sm flex flex-col items-center text-center">
        <div className="bg-blue-50 text-blue-800 px-6 py-2 rounded-full font-black uppercase text-xs border-2 border-blue-200 mb-6 flex items-center gap-2">
          👆 Snurra visarna
        </div>
        
        <InteractiveClock time={simTimeMs} setTime={setSimTimeMs} onDoubleClick={handleResetToNow} />
        
        <div className="text-6xl font-black text-slate-800 mt-8 mb-4 tracking-tighter">
          {String(currentSimDate.getHours()).padStart(2, '0')}:{String(currentSimDate.getMinutes()).padStart(2, '0')}
        </div>
        
        <div className="bg-blue-50 text-blue-700 px-6 py-4 rounded-3xl font-black uppercase text-lg border-2 border-blue-100 w-full shadow-inner flex items-center justify-between">
          <span className="flex-1 text-center">{getSwedishTimeWords(currentSimDate)}</span>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => speakText(getSwedishTimeWords(currentSimDate))} 
            className="bg-blue-200 p-3 rounded-full text-xl shadow-sm"
          >
            🔊
          </motion.button>
        </div>
      </div>

      {/* THE PIE SLICES (With Updated 2x2 Grid) */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-200 shadow-sm relative">
        <h4 className="text-xl font-black text-slate-800 uppercase mb-2 flex items-center gap-3">
          <span className="text-3xl">⏱️</span> Tårtbitarna
        </h4>
        <p className="text-slate-500 font-bold text-xs mb-6">
          Den <span className="text-blue-500 font-black">långa blåa</span> minutvisaren fyller klockan som tårtbitar!
        </p>

        {/* --- CHANGE HERE: Forced 2 columns (2x2 grid) --- */}
        <div className="grid grid-cols-2 gap-4">
          <ConceptClock 
            title="Hel" 
            desc="Ingen tårtbit. Visaren pekar rakt UPP." 
            hourDeg={0} 
            minDeg={0} 
            path="" 
            colorTheme="green"
          />
          <ConceptClock 
            title="Kvart över" 
            desc="En tårtbit (15 min) har ätits upp." 
            hourDeg={7.5} 
            minDeg={90} 
            path="M50,50 L50,5 A45,45 0 0,1 95,50 Z" 
            colorTheme="orange"
          />
          <ConceptClock 
            title="Halv" 
            desc="Halva tårtan (30 min) är borta." 
            hourDeg={15} 
            minDeg={180} 
            path="M50,50 L50,5 A45,45 0 0,1 50,95 Z" 
            colorTheme="indigo"
          />
          <ConceptClock 
            title="Kvart i" 
            desc="Bara en tårtbit (15 min) KVAR till toppen." 
            hourDeg={22.5} 
            minDeg={270} 
            path="M50,50 L5,50 A45,45 0 0,1 50,5 Z" 
            colorTheme="yellow"
          />
        </div>
      </div>

      {/* THE WEEK'S COLORS (Unchanged) */}
      <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-200 shadow-sm relative">
        <h4 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-3">
          <span className="text-3xl">📅</span> Veckans Färger
        </h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-[#4CAF50] text-white p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-white/20 p-2 rounded-xl">🌱</span>
            <div><strong className="block text-sm uppercase">Måndag (Grön)</strong><span className="text-xs font-bold opacity-90">Ny vecka, grön som gräset!</span></div>
          </div>
          <div className="bg-[#2196F3] text-white p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-white/20 p-2 rounded-xl">💧</span>
            <div><strong className="block text-sm uppercase">Tisdag (Blå)</strong><span className="text-xs font-bold opacity-90">Flyter på som vatten.</span></div>
          </div>
          <div className="bg-slate-400 text-white p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-white/20 p-2 rounded-xl">☁️</span>
            <div><strong className="block text-sm uppercase">Onsdag (Vit/Grå)</strong><span className="text-xs font-bold opacity-90">Mitt i veckan. Halvvägs!</span></div>
          </div>
          <div className="bg-[#8D6E63] text-white p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-white/20 p-2 rounded-xl">🪵</span>
            <div><strong className="block text-sm uppercase">Torsdag (Brun)</strong><span className="text-xs font-bold opacity-90">Stark som ett träd.</span></div>
          </div>
          <div className="bg-[#FFEB3B] text-yellow-900 p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-yellow-900/10 p-2 rounded-xl">☀️</span>
            <div><strong className="block text-sm uppercase">Fredag (Gul)</strong><span className="text-xs font-bold opacity-90">Gul som solen. Fredagsmys!</span></div>
          </div>
          <div className="bg-[#E91E63] text-white p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-white/20 p-2 rounded-xl">🍬</span>
            <div><strong className="block text-sm uppercase">Lördag (Rosa)</strong><span className="text-xs font-bold opacity-90">Lördagsgodis. Ledigt!</span></div>
          </div>
          <div className="bg-[#F44336] text-white p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl bg-white/20 p-2 rounded-xl">🛑</span>
            <div><strong className="block text-sm uppercase">Söndag (Röd)</strong><span className="text-xs font-bold opacity-90">Stanna upp och vila.</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LearnTab;