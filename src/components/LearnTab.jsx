import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// --- PREMIUM 3D EMOJI KOMPONENT ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-md select-none pointer-events-none`} 
    draggable="false"
  />
);

// --- RÖST-MOTOR ---
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

// --- EXAKT SVENSK TID ---
const getSwedishAnalog = (date) => {
  const hNum = date.getHours();
  const m = date.getMinutes();
  const h = hNum % 12 || 12;
  const nextH = (hNum + 1) % 12 || 12;

  if (m === 0) return `${h}`;
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

// --- ENKEL KONFETTI (Framer Motion) ---
const ConfettiRain = () => {
  const pieces = Array.from({ length: 40 });
  const emojis = ['⭐', '🎉', '✨', '🏆', '🍕'];
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[2.5rem]">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -50, x: Math.random() * 300, opacity: 1, scale: Math.random() * 0.5 + 0.5 }}
          animate={{ y: 500, x: Math.random() * 300 + (Math.random() < 0.5 ? -50 : 50), rotate: 360 }}
          transition={{ duration: Math.random() * 2 + 1.5, ease: "easeIn" }}
          className="absolute text-3xl"
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
        </motion.div>
      ))}
    </div>
  );
};

// --- INTERAKTIV KLOCKA (Mindre modifierad för spelet) ---
const InteractiveClock = ({ simTimeMs, setSimTimeMs, isGameMode = false }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const prevAngleRef = useRef(null); 

  const getAngle = (clientX, clientY) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    prevAngleRef.current = getAngle(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const angle = getAngle(e.clientX, e.clientY);
    const currentMins = Math.round(angle / 6) % 60;
    
    let hourDelta = 0;
    if (prevAngleRef.current !== null) {
      const prev = prevAngleRef.current;
      if (prev > 300 && angle < 60) hourDelta = 1;
      else if (prev < 60 && angle > 300) hourDelta = -1;
    }
    prevAngleRef.current = angle; 

    const date = new Date(simTimeMs);
    if (hourDelta !== 0) date.setHours(date.getHours() + hourDelta);
    date.setMinutes(currentMins);
    setSimTimeMs(date.getTime());
  };

  const handleDoubleClick = () => {
    if(!isGameMode) setSimTimeMs(new Date().setSeconds(0));
  };

  const date = new Date(simTimeMs);
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  const mDeg = date.getMinutes() * 6;

  return (
    <div className="relative rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.2)] bg-white/10 p-2 backdrop-blur-md">
      <svg 
        ref={svgRef}
        viewBox="0 0 280 280"
        onPointerDown={handlePointerDown} 
        onPointerUp={() => setIsDragging(false)}
        onPointerMove={handlePointerMove}
        onDoubleClick={handleDoubleClick}
        className="w-64 h-64 sm:w-72 sm:h-72 touch-none cursor-grab active:cursor-grabbing bg-[#f8fafc] rounded-full border-4 border-slate-200 shadow-inner"
      >
        <circle cx="140" cy="140" r="135" fill="none" />
        
        {[...Array(60)].map((_, i) => (
          <circle 
            key={`min-${i}`} 
            cx={140 + 120 * Math.cos((i * 6 - 90) * Math.PI / 180)} 
            cy={140 + 120 * Math.sin((i * 6 - 90) * Math.PI / 180)} 
            r={i % 5 === 0 ? 0 : 1.5} 
            fill="#cbd5e1" 
          />
        ))}

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const angle = (num * 30 - 90) * (Math.PI / 180);
          const x = 140 + 98 * Math.cos(angle);
          const y = 140 + 98 * Math.sin(angle);
          return (
            <text key={num} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="text-[26px] font-black font-clock fill-slate-800 select-none pointer-events-none">
              {num}
            </text>
          );
        })}

        {/* Visare skuggor */}
        <g transform={`rotate(${hDeg} 140 140)`}><line x1="140" y1="140" x2="140" y2="85" stroke="rgba(0,0,0,0.1)" strokeWidth="8" strokeLinecap="round" transform="translate(3, 3)" /></g>
        <g transform={`rotate(${mDeg} 140 140)`}><line x1="140" y1="140" x2="140" y2="40" stroke="rgba(0,0,0,0.1)" strokeWidth="6" strokeLinecap="round" transform="translate(3, 3)" /></g>

        {/* Riktiga visare */}
        <g transform={`rotate(${hDeg} 140 140)`}><line x1="140" y1="140" x2="140" y2="85" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" /></g>
        <g transform={`rotate(${mDeg} 140 140)`}><line x1="140" y1="140" x2="140" y2="40" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" /></g>
        
        <circle cx="140" cy="140" r="10" fill="#1e293b" />
        <circle cx="140" cy="140" r="4" fill="#f8fafc" />
      </svg>
    </div>
  );
};

// --- MINI-SPELET: KLOCK-MÄSTAREN ---
const ClockGame = () => {
  const [gameState, setGameState] = useState('start'); // start, playing, levelup
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetTime, setTargetTime] = useState({ h: 12, m: 0 });
  const [simTimeMs, setSimTimeMs] = useState(new Date().setHours(12, 0, 0, 0));
  const [shake, setShake] = useState(false);

  const appId = 'test-schema-v2';
  const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');

  // Hämta sparad data
  useEffect(() => {
    const unsub = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUnlockedLevel(data.unlockedLevel || 1);
        setTotalSeconds(data.totalPlayTime || 0);
      }
    });
    return () => unsub();
  }, []);

  // Timer-effekt
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const saveProgress = async (newLevel) => {
    try {
      await updateDoc(statsRef, {
        unlockedLevel: Math.max(unlockedLevel, newLevel),
        totalPlayTime: totalSeconds + sessionSeconds
      });
      setTotalSeconds(prev => prev + sessionSeconds);
      setSessionSeconds(0);
    } catch (err) { console.error("Kunde inte spara:", err); }
  };

  // Ljud-referenser
  const introAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3') : null);
  const successAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3') : null);
  const failAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3') : null);
  const levelUpAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3') : null);

  const levelNames = ["Kvarts-Bossen", "Fem-stegs-Ninjan", "Tids-Geniet"];

  const generateNewTarget = (currentLevel) => {
    let mOptions = [];
    if (currentLevel === 1) mOptions = [0, 15, 30, 45];
    else if (currentLevel === 2) mOptions = Array.from({length: 12}, (_, i) => i * 5); // 0,5,10...
    else mOptions = Array.from({length: 60}, (_, i) => i); // 0-59

    const newH = Math.floor(Math.random() * 12) + 1;
    const newM = mOptions[Math.floor(Math.random() * mOptions.length)];
    
    setTargetTime({ h: newH, m: newM });
    
    // Nollställ spel-klockan till 12:00 inför nästa runda så man får snurra själv
    setSimTimeMs(new Date().setHours(12, 0, 0, 0));

    // Läs upp uppdraget!
    const tempDate = new Date();
    tempDate.setHours(newH, newM);
    speakText(`Sätt klockan till ${getSwedishAnalog(tempDate)}`);
  };

  const startGame = (selectedLevel) => {
    if (introAudio.current) introAudio.current.play().catch(()=>{});
    setLevel(selectedLevel);
    setGameState('playing');
    setStreak(0);
    setSessionSeconds(0);
    generateNewTarget(selectedLevel);
  };

  const checkAnswer = () => {
    const userDate = new Date(simTimeMs);
    const userH = userDate.getHours() % 12 || 12;
    const userM = userDate.getMinutes();

    if (userH === targetTime.h && userM === targetTime.m) {
      // RÄTT SVAR!
      if (successAudio.current) successAudio.current.play().catch(()=>{});
      
      const newStreak = streak + 1;
      setStreak(newStreak);

      if (newStreak >= 10) {
        // LEVEL UP!
        if (levelUpAudio.current) levelUpAudio.current.play().catch(()=>{});
        setGameState('levelup');
      } else {
        // Nästa fråga
        generateNewTarget(level);
      }
    } else {
      // FEL SVAR
      if (failAudio.current) failAudio.current.play().catch(()=>{});
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setStreak(0); // Ajaj, nollställs!
      speakText("Hoppsan, försök igen!");
    }
  };

  const nextLevel = () => {
    const nextLvl = level < 3 ? level + 1 : 3;
    saveProgress(nextLvl);
    setLevel(nextLvl);
    setGameState('playing');
    setStreak(0);
    setSessionSeconds(0);
    generateNewTarget(nextLvl);
  };

  const tempTargetDate = new Date();
  tempTargetDate.setHours(targetTime.h, targetTime.m);
  const targetText = getSwedishAnalog(tempTargetDate);

  return (
    <div className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_15px_50px_rgba(49,46,129,0.4)] border border-indigo-500/30 overflow-hidden text-center mb-8">
      
      {/* --- START SKÄRM --- */}
      {gameState === 'start' && (
        <div className="py-8">
          <PremiumEmoji emoji="🎮" className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 text-shadow-sm">Klock-Mästaren</h2>
          <p className="text-indigo-200 font-bold text-sm mb-8">Välj nivå för att börja träna!</p>
          
          <div className="flex flex-col gap-3 max-w-xs mx-auto mb-6">
            {[1, 2, 3].map((lvl) => {
              const isLocked = lvl > unlockedLevel;
              return (
                <motion.button
                  key={lvl}
                  whileHover={!isLocked ? { scale: 1.02 } : {}}
                  whileTap={!isLocked ? { scale: 0.98 } : {}}
                  disabled={isLocked}
                  onClick={() => startGame(lvl)}
                  className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest border transition-all ${
                    isLocked 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed opacity-70' 
                    : 'bg-gradient-to-r from-indigo-500 to-blue-600 border-indigo-400 text-white shadow-lg'
                  }`}
                >
                  <span>Level {lvl}</span>
                  {isLocked ? <span>🔒</span> : <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md">{levelNames[lvl-1]}</span>}
                </motion.button>
              );
            })}
          </div>
          <div className="text-indigo-300 text-[10px] font-black uppercase tracking-tighter">
            Total träningstid: {Math.floor(totalSeconds / 60)} minuter
          </div>
        </div>
      )}

      {/* --- SPEL SKÄRM --- */}
      {gameState === 'playing' && (
        <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
          
          {/* XP & Level Header */}
          <div className="flex items-center justify-between bg-black/20 rounded-2xl p-3 mb-6 border border-white/10">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Level {level}</span>
              <span className="text-sm font-black text-white">{levelNames[level-1]}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div className="flex gap-1">
                {/* XP Mätare (10 pluttar) */}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`w-3 h-4 rounded-sm ${i < streak ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-white/10'}`}></div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => speakText(`Sätt klockan till ${targetText}`)} className="mb-6 flex flex-col items-center justify-center w-full active:scale-95 transition-transform">
             <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Uppdrag: Sätt klockan till</span>
             <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
               <span className="text-2xl font-black text-white uppercase tracking-wide drop-shadow-md">{targetText}</span>
               <span className="text-2xl">🔊</span>
             </div>
          </button>

          <div className="flex justify-center mb-8">
            <InteractiveClock simTimeMs={simTimeMs} setSimTimeMs={setSimTimeMs} isGameMode={true} />
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={checkAnswer}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-5 rounded-[1.5rem] font-black text-xl uppercase tracking-widest shadow-[0_8px_30px_rgba(59,130,246,0.5)] border border-blue-400"
          >
            Svara!
          </motion.button>
        </motion.div>
      )}

      {/* --- LEVEL UP SKÄRM --- */}
      {gameState === 'levelup' && (
        <div className="py-8 relative z-10">
          <ConfettiRain />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
            <PremiumEmoji emoji="🌟" className="w-28 h-28 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
          </motion.div>
          <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2 text-shadow-md animate-pulse">Level Up!</h2>
          <p className="text-indigo-200 font-bold mb-10 text-lg">Grymt jobbat! Du klarade Level {level}.</p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={nextLevel}
            className="bg-white text-indigo-900 px-10 py-4 rounded-full font-black text-lg uppercase tracking-widest shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            {level < 3 ? 'Nästa Nivå ➡️' : 'Spela igen! 🔄'}
          </motion.button>
        </div>
      )}
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
      <div className="bg-gradient-to-b from-[#86EFAC] to-[#A7F3D0] h-[150px] rounded-t-[2.5rem] relative flex justify-center pt-8 border-b border-[#6ee7b7] overflow-hidden">
        <PremiumEmoji emoji="🌷" className="absolute left-4 bottom-6 w-16 h-16 opacity-40 blur-[1px]" />
        <PremiumEmoji emoji="🌷" className="absolute right-4 bottom-6 w-16 h-16 opacity-40 blur-[1px]" />
        <PremiumEmoji emoji="🐣" className="w-20 h-20 relative z-10 drop-shadow-xl" />
      </div>

      <div className="absolute top-[126px] left-1/2 -translate-x-1/2 z-20 flex items-center justify-between bg-white text-slate-800 p-1.5 rounded-[1.25rem] shadow-[0_8px_25px_rgba(0,0,0,0.08)] w-[260px] border border-slate-100">
        <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </motion.button>
        <span className="font-black uppercase tracking-widest text-[12px] pt-0.5">{currentMonthName} {currentYear}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </motion.button>
      </div>

      <div className="pt-16 pb-8 px-6 bg-[#FAFAF9] rounded-b-[2.5rem]">
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {weekColors.map((day, i) => (
            <div key={i} className={`${day.bg} ${day.text} text-[9px] sm:text-[10px] font-black text-center py-2 rounded-lg uppercase tracking-wider shadow-sm border border-white`}>{day.name}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeek = (startOffset + i) % 7;
            const dayColor = weekColors[dayOfWeek]; 
            const isToday = dayNum === realToday.getDate() && viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear();
            const isPast = (dayNum < realToday.getDate() && viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear()) || viewDate < new Date(realToday.getFullYear(), realToday.getMonth(), 1);

            if (isToday) {
              return (
                <div key={dayNum} className="relative z-10 flex flex-col items-center justify-center">
                  <div className={`bg-white ${dayColor.text} ${dayColor.border} aspect-square w-full rounded-2xl flex items-center justify-center font-black text-2xl border-[3px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] scale-110`}>{dayNum}</div>
                  <div className={`absolute -bottom-2.5 w-1.5 h-1.5 rounded-full ${dayColor.bg} border border-${dayColor.border.split('-')[1]}`}></div>
                </div>
              );
            }
            if (isPast) return <div key={dayNum} className={`${dayColor.bg} ${dayColor.text} opacity-40 aspect-square rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl border border-transparent`}>{dayNum}</div>;
            return <div key={dayNum} className={`${dayColor.bg} ${dayColor.text} aspect-square rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-sm border border-white hover:brightness-95 transition-all`}>{dayNum}</div>;
          })}
        </div>
        {viewDate.getMonth() === realToday.getMonth() && viewDate.getFullYear() === realToday.getFullYear() && (
          <div className="mt-8 flex flex-col items-center justify-center relative">
            <div className={`bg-white border-2 ${todayColor.border} rounded-full px-6 py-3 shadow-sm flex items-center gap-3`}>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Idag är det</span>
              <span className={`text-sm font-black uppercase tracking-widest ${todayColor.text}`}>{todayColor.name}DAG</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HUVUDKOMPONENT ---
const LearnTab = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8 pb-12 pt-2">
      
      {/* VÅRT NYA SPEL LÄNGST UPP! */}
      <ClockGame />
      
      {/* KALENDERN LIGGER KVAR SNYGGT DÄR UNDER */}
      <CalendarCard />
      
    </motion.div>
  );
};

export default LearnTab;