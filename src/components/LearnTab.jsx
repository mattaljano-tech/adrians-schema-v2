import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
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
      const today = new Date().setHours(0,0,0,0);
      const docSnap = await getDoc(statsRef);
      let newStreak = 1;
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.lastTrainingDate === today) newStreak = d.trainingStreak || 1;
        else if (d.lastTrainingDate === today - 86400000) newStreak = (d.trainingStreak || 0) + 1;
      }

      await updateDoc(statsRef, {
        unlockedLevel: Math.max(unlockedLevel, newLevel),
        totalPlayTime: totalSeconds + sessionSeconds,
        trainingStreak: newStreak,
        lastTrainingDate: today
      });
      setTotalSeconds(prev => prev + sessionSeconds);
      setSessionSeconds(0);
    } catch (err) { console.error(err); }
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
          <p className="text-indigo-200 font-bold text-sm mb-8">
            {unlockedLevel < 3 ? "Du måste träna på detta mer! Kör en stund varje dag." : "Snyggt jobbat! Men du måste spela för att hålla kunskapen vid liv."}
          </p>
          
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
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div className="flex gap-1 hidden sm:flex">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`w-2 h-4 rounded-sm ${i < streak ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-white/10'}`}></div>
                  ))}
                </div>
                <span className="text-amber-400 font-black sm:hidden">{streak}/10</span>
              </div>
              <button onClick={() => setGameState('start')} className="bg-red-500/20 text-red-300 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/40 border border-red-500/30 transition-all">
                Avbryt ✖
              </button>
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

// --- MINI-SPELET: MÅNADS-MÄSTAREN ---
const MonthGame = () => {
  const [gameState, setGameState] = useState('start'); // start, playing, levelup
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState({ text: '', answerIndex: 0, spoken: '' });
  const [shakeMap, setShakeMap] = useState({}); // Håller koll på vilka knappar som skakar

  const months = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
  const levelNames = ["Månads-Jägaren", "Tidsresenären", "Årstids-Bossen"];

  const appId = 'test-schema-v2';
  const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');

  const successAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3') : null);
  const failAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3') : null);
  const levelUpAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3') : null);

  useEffect(() => {
    const unsub = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUnlockedLevel(data.unlockedMonthLevel || 1);
        setTotalSeconds(data.totalMonthPlayTime || 0);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'playing') interval = setInterval(() => setSessionSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const saveProgress = async (newLevel) => {
    try {
      const today = new Date().setHours(0,0,0,0);
      const docSnap = await getDoc(statsRef);
      let newStreak = 1;
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.lastTrainingDate === today) newStreak = d.trainingStreak || 1;
        else if (d.lastTrainingDate === today - 86400000) newStreak = (d.trainingStreak || 0) + 1;
      }

      await updateDoc(statsRef, {
        unlockedMonthLevel: Math.max(unlockedLevel, newLevel),
        totalMonthPlayTime: totalSeconds + sessionSeconds,
        trainingStreak: newStreak,
        lastTrainingDate: today
      });
      setTotalSeconds(prev => prev + sessionSeconds);
      setSessionSeconds(0);
    } catch (err) { console.error(err); }
  };

  const generateQuestion = (currentLevel) => {
    let qText = "";
    let qSpoken = "";
    let ansIdx = 0;
    const targetIdx = Math.floor(Math.random() * 12);

    if (currentLevel === 1) {
      if (Math.random() > 0.5) {
        qText = `Hitta ${months[targetIdx]}`;
        qSpoken = `Var är ${months[targetIdx]}?`;
        ansIdx = targetIdx;
      } else {
        qText = `Vilken är månad nummer ${targetIdx + 1}?`;
        qSpoken = qText;
        ansIdx = targetIdx;
      }
    } else if (currentLevel === 2) {
      const isAfter = Math.random() > 0.5;
      const refIdx = Math.floor(Math.random() * 12);
      if (isAfter) {
        ansIdx = (refIdx + 1) % 12;
        qText = `Vilken månad kommer efter ${months[refIdx]}?`;
      } else {
        ansIdx = (refIdx - 1 + 12) % 12;
        qText = `Vilken månad kommer före ${months[refIdx]}?`;
      }
      qSpoken = qText;
    } else {
      // Level 3 Boss frågor - MASSIV UPPDATERING!
      // Index är månadens nummer minus 1 (Jan = 0, Dec = 11)
      const trivia = [
        // Årets struktur
        { q: "Vilken är årets första månad?", a: 0 }, 
        { q: "Vilken är årets sista månad?", a: 11 },
        { q: "Vilken månad är årets kortaste?", a: 1 }, 
        { q: "Vilken är årets sjätte månad?", a: 5 },
        { q: "Vilken månad kommer precis före halva året har gått?", a: 5 },
        
        // Vinter
        { q: "I vilken månad firar vi oftast Lucia?", a: 11 },
        { q: "I vilken månad är det Julafton?", a: 11 },
        { q: "I vilken månad firar vi Nyårsafton (sista dagen på året)?", a: 11 },
        { q: "Vilken månad brukar anses vara den kallaste och mörkaste mitt i vintern?", a: 0 },
        { q: "I vilken månad är det Alla Hjärtans Dag?", a: 1 },
        { q: "När har vi oftast Sportlov?", a: 1 },

        // Vår
        { q: "I vilken vårmånad firar vi ofta Våffeldagen?", a: 2 },
        { q: "Vilken är den första riktiga vårmånaden?", a: 2 },
        { q: "I vilken månad lurar vi varandra med 'April, april'?", a: 3 },
        { q: "I slutet av vilken månad tänder vi Majbrasor (Valborg)?", a: 3 },
        { q: "Vilken månad kallas ibland för 'Sköna...'?", a: 4 },
        
        // Sommar
        { q: "I vilken månad slutar skolan och sommarlovet börjar?", a: 5 },
        { q: "I vilken månad är det Sveriges Nationaldag?", a: 5 },
        { q: "I vilken månad firar vi Midsommar och dansar runt stången?", a: 5 },
        { q: "Vilken brukar vara den varmaste semestermånaden?", a: 6 },
        { q: "I vilken sommar-månad börjar skolan ofta igen?", a: 7 },
        { q: "Vilken är sommarens sista månad?", a: 7 },

        // Höst
        { q: "Vilken är höstens första månad?", a: 8 },
        { q: "I vilken höstmånad börjar löven oftast bli gula och röda?", a: 8 },
        { q: "I vilken månad brukar vi fira Kanelbullens dag?", a: 9 },
        { q: "I slutet av vilken månad firar många Halloween?", a: 9 },
        { q: "Vilken är den mörka höstmånaden precis före julmånaden?", a: 10 },
        { q: "När har vi oftast Läslov (Höstlov)?", a: 10 },

        // Bokstäver
        { q: "Vilken är den enda månaden som börjar på bokstaven 'F'?", a: 1 },
        { q: "Vilken är den enda månaden som börjar på bokstaven 'O'?", a: 9 }
      ];
      const t = trivia[Math.floor(Math.random() * trivia.length)];
      qText = t.q; qSpoken = t.q; ansIdx = t.a;
    }

    setQuestion({ text: qText, answerIndex: ansIdx, spoken: qSpoken });
    speakText(qSpoken);
  };

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setGameState('playing');
    setStreak(0);
    setSessionSeconds(0);
    generateQuestion(selectedLevel);
  };

  const nextLevel = () => {
    const nextLvl = level < 3 ? level + 1 : 3;
    saveProgress(nextLvl);
    setLevel(nextLvl);
    setGameState('playing');
    setStreak(0);
    setSessionSeconds(0);
    generateQuestion(nextLvl);
  };

  const handleAnswer = (idx) => {
    if (idx === question.answerIndex) {
      if (successAudio.current) successAudio.current.play().catch(()=>{});
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 10) {
        if (levelUpAudio.current) levelUpAudio.current.play().catch(()=>{});
        setGameState('levelup');
      } else {
        generateQuestion(level);
      }
    } else {
      if (failAudio.current) failAudio.current.play().catch(()=>{});
      setShakeMap({ ...shakeMap, [idx]: true });
      setTimeout(() => setShakeMap(prev => ({ ...prev, [idx]: false })), 500);
      setStreak(0);
      speakText("Hoppsan, försök igen!");
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_15px_50px_rgba(4,120,87,0.4)] border border-emerald-400/30 overflow-hidden text-center mb-8">
      
      {gameState === 'start' && (
        <div className="py-8 relative z-10">
          <PremiumEmoji emoji="🗓️" className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 text-shadow-sm">Månads-Mästaren</h2>
          <p className="text-emerald-200 font-bold text-sm mb-8">
            {unlockedLevel < 3 ? "Du måste träna på detta mer! Kör en stund varje dag." : "Snyggt jobbat! Men du måste spela för att hålla kunskapen vid liv."}
          </p>
          
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
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-lg'
                  }`}
                >
                  <span>Level {lvl}</span>
                  {isLocked ? <span>🔒</span> : <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md">{levelNames[lvl-1]}</span>}
                </motion.button>
              );
            })}
          </div>
          <div className="text-emerald-300 text-[10px] font-black uppercase tracking-tighter">
            Total träningstid: {Math.floor(totalSeconds / 60)} minuter
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="relative z-10">
          <div className="flex items-center justify-between bg-black/20 rounded-2xl p-3 mb-6 border border-white/10">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Level {level}</span>
              <span className="text-sm font-black text-white">{levelNames[level-1]}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div className="flex gap-1 hidden sm:flex">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`w-2 h-4 rounded-sm ${i < streak ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-white/10'}`}></div>
                  ))}
                </div>
                <span className="text-amber-400 font-black sm:hidden">{streak}/10</span>
              </div>
              <button onClick={() => setGameState('start')} className="bg-red-500/20 text-red-300 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/40 border border-red-500/30 transition-all">
                Avbryt ✖
              </button>
            </div>
          </div>

          <button onClick={() => speakText(question.spoken)} className="mb-6 flex flex-col items-center justify-center w-full active:scale-95 transition-transform">
             <span className="text-[11px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-1">Uppdrag:</span>
             <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/20 flex items-center gap-3 w-full justify-center shadow-inner">
               <span className="text-lg sm:text-xl font-black text-white uppercase tracking-wide drop-shadow-md">{question.text}</span>
               <span className="text-2xl">🔊</span>
             </div>
          </button>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {months.map((m, idx) => (
              <motion.button
                key={m}
                animate={shakeMap[idx] ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(idx)}
                className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-md border ${
                  shakeMap[idx] ? 'bg-red-500 border-red-400 text-white' : 'bg-white text-emerald-900 border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {m.substring(0, 3)}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'levelup' && (
        <div className="py-8 relative z-10">
          <ConfettiRain />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
            <PremiumEmoji emoji="🌟" className="w-28 h-28 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
          </motion.div>
          <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2 text-shadow-md animate-pulse">Level Up!</h2>
          <p className="text-emerald-200 font-bold mb-10 text-lg">Grymt jobbat! Du klarade Level {level}.</p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={nextLevel}
            className="bg-white text-emerald-900 px-10 py-4 rounded-full font-black text-lg uppercase tracking-widest shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            {level < 3 ? 'Nästa Nivå ➡️' : 'Spela igen! 🔄'}
          </motion.button>
        </div>
      )}
    </div>
  );
};

// --- MINI-SPELET: ORD-DETEKTIVEN (Läsning & Ordförråd) ---
const WordGame = () => {
  const [gameState, setGameState] = useState('start');
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shakeMap, setShakeMap] = useState({});
  
  const [currentQ, setCurrentQ] = useState(null);
  const [spelledLetters, setSpelledLetters] = useState([]); // För stavningsfrågor

  const levelNames = ["Bokstavs-Jägaren", "Mening-Skaparen", "Ord-Bossen"];
  const appId = 'test-schema-v2';
  const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');

  const successAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3') : null);
  const failAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3') : null);
  const levelUpAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3') : null);

  useEffect(() => {
    const unsub = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUnlockedLevel(data.unlockedWordLevel || 1);
        setTotalSeconds(data.totalWordPlayTime || 0);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'playing') interval = setInterval(() => setSessionSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const saveProgress = async (newLevel) => {
    try {
      const today = new Date().setHours(0,0,0,0);
      const docSnap = await getDoc(statsRef);
      let newStreak = 1;
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.lastTrainingDate === today) newStreak = d.trainingStreak || 1;
        else if (d.lastTrainingDate === today - 86400000) newStreak = (d.trainingStreak || 0) + 1;
      }

      await updateDoc(statsRef, {
        unlockedWordLevel: Math.max(unlockedLevel, newLevel),
        totalWordPlayTime: totalSeconds + sessionSeconds,
        trainingStreak: newStreak,
        lastTrainingDate: today
      });
      setTotalSeconds(prev => prev + sessionSeconds);
      setSessionSeconds(0);
    } catch (err) { console.error(err); }
  };

  // --- MASSIV FRÅGEBANK FÖR ORD-DETEKTIVEN ---
  const questions = {
    1: [ // NIVÅ 1: Stava korta ord (Ljudning/Fonologi) - Minst 4-5 bokstäver att välja på
      { type: 'spell', word: 'SOL', emoji: '☀️', options: ['S', 'O', 'L', 'M', 'A'] },
      { type: 'spell', word: 'KO', emoji: '🐄', options: ['K', 'O', 'B', 'A', 'P'] },
      { type: 'spell', word: 'BIL', emoji: '🚗', options: ['B', 'I', 'L', 'F', 'E'] },
      { type: 'spell', word: 'TÅG', emoji: '🚂', options: ['T', 'Å', 'G', 'S', 'M'] },
      { type: 'spell', word: 'HUS', emoji: '🏠', options: ['H', 'U', 'S', 'R', 'O'] },
      { type: 'spell', word: 'BÅT', emoji: '⛵', options: ['B', 'Å', 'T', 'M', 'S'] },
      { type: 'spell', word: 'BOK', emoji: '📖', options: ['B', 'O', 'K', 'L', 'A'] },
      { type: 'spell', word: 'FOT', emoji: '🦶', options: ['F', 'O', 'T', 'D', 'R'] },
      { type: 'spell', word: 'MAT', emoji: '🍽️', options: ['M', 'A', 'T', 'N', 'S'] },
      { type: 'spell', word: 'ORM', emoji: '🐍', options: ['O', 'R', 'M', 'N', 'A'] },
      { type: 'spell', word: 'NOS', emoji: '🐕', options: ['N', 'O', 'S', 'M', 'E'] },
      { type: 'spell', word: 'BEN', emoji: '🦴', options: ['B', 'E', 'N', 'D', 'L'] },
      { type: 'spell', word: 'MUS', emoji: '🐁', options: ['M', 'U', 'S', 'L', 'O'] },
      { type: 'spell', word: 'RÄV', emoji: '🦊', options: ['R', 'Ä', 'V', 'F', 'S'] },
      { type: 'spell', word: 'SÄL', emoji: '🦭', options: ['S', 'Ä', 'L', 'V', 'K'] },
      { type: 'spell', word: 'TIO', emoji: '🔟', options: ['T', 'I', 'O', 'E', 'P'] },
      { type: 'spell', word: 'TVÅ', emoji: '2️⃣', options: ['T', 'V', 'Å', 'O', 'M'] },
      { type: 'spell', word: 'BÄR', emoji: '🍓', options: ['B', 'Ä', 'R', 'P', 'S'] },
      { type: 'spell', word: 'LÅS', emoji: '🔒', options: ['L', 'Å', 'S', 'K', 'O'] },
      { type: 'spell', word: 'OST', emoji: '🧀', options: ['O', 'S', 'T', 'A', 'F'] }
    ],
    2: [ // NIVÅ 2: Konkreta ord och funktion (Fylla i luckan) - 4 svarsalternativ!
      { type: 'fill', text: 'För att klippa papper behöver man en...', answer: 'Sax', emoji: '✂️', options: [{w: 'Sax', e: '✂️'}, {w: 'Sked', e: '🥄'}, {w: 'Boll', e: '⚽'}, {w: 'Bok', e: '📖'}] },
      { type: 'fill', text: 'När det regnar kan man använda ett...', answer: 'Paraply', emoji: '☔', options: [{w: 'Bord', e: '🪑'}, {w: 'Paraply', e: '☔'}, {w: 'Äpple', e: '🍎'}, {w: 'Sol', e: '☀️'}] },
      { type: 'fill', text: 'För att låsa upp en dörr behöver man en...', answer: 'Nyckel', emoji: '🔑', options: [{w: 'Klocka', e: '⌚'}, {w: 'Banan', e: '🍌'}, {w: 'Nyckel', e: '🔑'}, {w: 'Boll', e: '🎾'}] },
      { type: 'fill', text: 'Man äter soppa med en...', answer: 'Sked', emoji: '🥄', options: [{w: 'Gaffel', e: '🍴'}, {w: 'Sked', e: '🥄'}, {w: 'Kniv', e: '🔪'}, {w: 'Sax', e: '✂️'}] },
      { type: 'fill', text: 'När man är trött går man och lägger sig i en...', answer: 'Säng', emoji: '🛏️', options: [{w: 'Stol', e: '🪑'}, {w: 'Säng', e: '🛏️'}, {w: 'Bord', e: '🪵'}, {w: 'Bil', e: '🚗'}] },
      { type: 'fill', text: 'Man ritar och målar med en...', answer: 'Penna', emoji: '✏️', options: [{w: 'Penna', e: '✏️'}, {w: 'Bok', e: '📖'}, {w: 'Sudd', e: '🧽'}, {w: 'Nyckel', e: '🔑'}] },
      { type: 'fill', text: 'När man är törstig dricker man ur ett...', answer: 'Glas', emoji: '🥛', options: [{w: 'Tallrik', e: '🍽️'}, {w: 'Glas', e: '🥛'}, {w: 'Gryta', e: '🍲'}, {w: 'Sked', e: '🥄'}] },
      { type: 'fill', text: 'Man kör på vägen med en...', answer: 'Bil', emoji: '🚗', options: [{w: 'Båt', e: '⛵'}, {w: 'Flygplan', e: '✈️'}, {w: 'Bil', e: '🚗'}, {w: 'Tåg', e: '🚂'}] },
      { type: 'fill', text: 'När det är kallt har man på huvudet en...', answer: 'Mössa', emoji: '🧢', options: [{w: 'Vante', e: '🧤'}, {w: 'Mössa', e: '🧢'}, {w: 'Strumpa', e: '🧦'}, {w: 'Sko', e: '👟'}] },
      { type: 'fill', text: 'Efter man badat torkar man sig med en...', answer: 'Handduk', emoji: '🧖', options: [{w: 'Kudde', e: '🛌'}, {w: 'Handduk', e: '🧖'}, {w: 'Matta', e: '🧶'}, {w: 'Tröja', e: '👕'}] },
      { type: 'fill', text: 'Den lyser gult på himlen på dagen...', answer: 'Sol', emoji: '☀️', options: [{w: 'Måne', e: '🌙'}, {w: 'Stjärna', e: '⭐'}, {w: 'Sol', e: '☀️'}, {w: 'Moln', e: '☁️'}] },
      { type: 'fill', text: 'Man tvättar händerna med vatten och...', answer: 'Tvål', emoji: '🧼', options: [{w: 'Schampo', e: '🧴'}, {w: 'Tvål', e: '🧼'}, {w: 'Tandkräm', e: '🪥'}, {w: 'Kräm', e: '🧴'}] },
      { type: 'fill', text: 'När man vill prata med någon långt borta använder man en...', answer: 'Telefon', emoji: '📱', options: [{w: 'Dator', e: '💻'}, {w: 'Bok', e: '📖'}, {w: 'Telefon', e: '📱'}, {w: 'Klocka', e: '⌚'}] },
      { type: 'fill', text: 'Till skolan bär man sina böcker i en...', answer: 'Ryggsäck', emoji: '🎒', options: [{w: 'Påse', e: '🛍️'}, {w: 'Korg', e: '🧺'}, {w: 'Ryggsäck', e: '🎒'}, {w: 'Kudde', e: '🛌'}] },
      { type: 'fill', text: 'Hunden gillar att fånga en kastad...', answer: 'Boll', emoji: '🎾', options: [{w: 'Sten', e: '🪨'}, {w: 'Boll', e: '🎾'}, {w: 'Sko', e: '👞'}, {w: 'Katt', e: '🐈'}] },
      { type: 'fill', text: 'När det är mörkt tänder man en...', answer: 'Lampa', emoji: '💡', options: [{w: 'Lampa', e: '💡'}, {w: 'Fönster', e: '🪟'}, {w: 'Spegel', e: '🪞'}, {w: 'Tavla', e: '🖼️'}] },
      { type: 'fill', text: 'När fötterna fryser inomhus tar man på sig...', answer: 'Tofflor', emoji: '🩴', options: [{w: 'Stövlar', e: '👢'}, {w: 'Tofflor', e: '🩴'}, {w: 'Vantar', e: '🧤'}, {w: 'Halsduk', e: '🧣'}] },
      { type: 'fill', text: 'Man skär bröd med en...', answer: 'Kniv', emoji: '🔪', options: [{w: 'Sked', e: '🥄'}, {w: 'Gaffel', e: '🍴'}, {w: 'Kniv', e: '🔪'}, {w: 'Tallrik', e: '🍽️'}] },
      { type: 'fill', text: 'Vi tittar på barnprogram på vår...', answer: 'TV', emoji: '📺', options: [{w: 'Mikrovågsugn', e: '🎛️'}, {w: 'TV', e: '📺'}, {w: 'Radio', e: '📻'}, {w: 'Bok', e: '📖'}] },
      { type: 'fill', text: 'Innan man sväljer maten måste man...', answer: 'Tugga', emoji: '👄', options: [{w: 'Dricka', e: '🥤'}, {w: 'Tugga', e: '👄'}, {w: 'Sova', e: '😴'}, {w: 'Skrika', e: '🗣️'}] }
    ],
    3: [ // NIVÅ 3: Kategorier, Djur och Logik (Lite svårare samband) - 4 svarsalternativ!
      { type: 'fill', text: 'Vilket av dessa djur kan flyga i luften?', answer: 'Fågel', emoji: '🦅', options: [{w: 'Hund', e: '🐕'}, {w: 'Fågel', e: '🦅'}, {w: 'Gris', e: '🐖'}, {w: 'Katt', e: '🐈'}] },
      { type: 'fill', text: 'Man sätter dem på fötterna innan man tar på skorna...', answer: 'Strumpor', emoji: '🧦', options: [{w: 'Mössa', e: '🧢'}, {w: 'Handskar', e: '🧤'}, {w: 'Strumpor', e: '🧦'}, {w: 'Byxor', e: '👖'}] },
      { type: 'fill', text: 'Vad är stort, grönt och växer i skogen?', answer: 'Träd', emoji: '🌲', options: [{w: 'Bil', e: '🚗'}, {w: 'Träd', e: '🌲'}, {w: 'Hus', e: '🏠'}, {w: 'Sten', e: '🪨'}] },
      { type: 'fill', text: 'Vilket stort djur ger oss mjölk att dricka?', answer: 'Ko', emoji: '🐄', options: [{w: 'Ko', e: '🐄'}, {w: 'Häst', e: '🐎'}, {w: 'Höna', e: '🐔'}, {w: 'Gris', e: '🐖'}] },
      { type: 'fill', text: 'Vilken frukt är gul, böjd och god att skala?', answer: 'Banan', emoji: '🍌', options: [{w: 'Äpple', e: '🍎'}, {w: 'Banan', e: '🍌'}, {w: 'Päron', e: '🍐'}, {w: 'Apelsin', e: '🍊'}] },
      { type: 'fill', text: 'Vad tittar man på för att veta vilken tid det är?', answer: 'Klocka', emoji: '⌚', options: [{w: 'Klocka', e: '⌚'}, {w: 'Bok', e: '📖'}, {w: 'Karta', e: '🗺️'}, {w: 'Radio', e: '📻'}] },
      { type: 'fill', text: 'Vilket husdjur brukar jama och säga mjau?', answer: 'Katt', emoji: '🐈', options: [{w: 'Katt', e: '🐈'}, {w: 'Hund', e: '🐕'}, {w: 'Får', e: '🐑'}, {w: 'Gris', e: '🐖'}] },
      { type: 'fill', text: 'Den har många sidor med text och bilder...', answer: 'Bok', emoji: '📖', options: [{w: 'Kudde', e: '🛌'}, {w: 'Bok', e: '📖'}, {w: 'Tallrik', e: '🍽️'}, {w: 'Tavla', e: '🖼️'}] },
      { type: 'fill', text: 'Ett långt fordon som åker på järnvägsspår...', answer: 'Tåg', emoji: '🚂', options: [{w: 'Tåg', e: '🚂'}, {w: 'Buss', e: '🚌'}, {w: 'Cykel', e: '🚲'}, {w: 'Flygplan', e: '✈️'}] },
      { type: 'fill', text: 'När detta blir jättekallt fryser det till is...', answer: 'Vatten', emoji: '💧', options: [{w: 'Mjölk', e: '🥛'}, {w: 'Vatten', e: '💧'}, {w: 'Saft', e: '🧃'}, {w: 'Sand', e: '🏖️'}] },
      { type: 'fill', text: 'Något man brukar ha sina pengar i...', answer: 'Plånbok', emoji: '👛', options: [{w: 'Väska', e: '🎒'}, {w: 'Plånbok', e: '👛'}, {w: 'Skokartong', e: '📦'}, {w: 'Ficka', e: '👖'}] },
      { type: 'fill', text: 'Ett djur som lever och simmar under vattnet...', answer: 'Fisk', emoji: '🐟', options: [{w: 'Fisk', e: '🐟'}, {w: 'Groda', e: '🐸'}, {w: 'Anka', e: '🦆'}, {w: 'Katt', e: '🐈'}] },
      { type: 'fill', text: 'Man drar det över sig i sängen för att inte frysa...', answer: 'Täcke', emoji: '🛌', options: [{w: 'Handduk', e: '🧖'}, {w: 'Täcke', e: '🛌'}, {w: 'Matta', e: '🧶'}, {w: 'Gardin', e: '🪟'}] },
      { type: 'fill', text: 'Vad behöver en blomma för att växa och inte vissna?', answer: 'Vatten', emoji: '🌧️', options: [{w: 'Godis', e: '🍬'}, {w: 'Vatten', e: '🌧️'}, {w: 'Stenar', e: '🪨'}, {w: 'Mjölk', e: '🥛'}] },
      { type: 'fill', text: 'Vilken färg har oftast en brandbil?', answer: 'Röd', emoji: '🚒', options: [{w: 'Blå', e: '🟦'}, {w: 'Grön', e: '🟩'}, {w: 'Röd', e: '🟥'}, {w: 'Svart', e: '⬛'}] },
      { type: 'fill', text: 'Något man ofta ställer i ett fönster...', answer: 'Blomma', emoji: '🪴', options: [{w: 'Soffa', e: '🛋️'}, {w: 'Blomma', e: '🪴'}, {w: 'Kylskåp', e: '🧊'}, {w: 'Cykel', e: '🚲'}] },
      { type: 'fill', text: 'Vad sätter man över ett litet sår?', answer: 'Plåster', emoji: '🩹', options: [{w: 'Tejp', e: '📼'}, {w: 'Plåster', e: '🩹'}, {w: 'Papper', e: '📄'}, {w: 'Snöre', e: '🧶'}] },
      { type: 'fill', text: 'Ett stort, gult djur med extremt lång hals...', answer: 'Giraff', emoji: '🦒', options: [{w: 'Elefant', e: '🐘'}, {w: 'Giraff', e: '🦒'}, {w: 'Zebra', e: '🦓'}, {w: 'Lejon', e: '🦁'}] },
      { type: 'fill', text: 'Vad tittar man i för att se sig själv?', answer: 'Spegel', emoji: '🪞', options: [{w: 'Tavla', e: '🖼️'}, {w: 'Spegel', e: '🪞'}, {w: 'Fönster', e: '🪟'}, {w: 'Bok', e: '📖'}] },
      { type: 'fill', text: 'I vilket rum hemma lagar man maten?', answer: 'Köket', emoji: '🍳', options: [{w: 'Köket', e: '🍳'}, {w: 'Badrummet', e: '🛁'}, {w: 'Sovrummet', e: '🛏️'}, {w: 'Hallen', e: '🚪'}] }
    ]
  };

  const generateQuestion = (lvl) => {
    const list = questions[lvl];
    const q = list[Math.floor(Math.random() * list.length)];
    // Blanda alternativen så svaret inte alltid är på samma plats
    const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    setCurrentQ({ ...q, options: shuffledOptions });
    setSpelledLetters([]); // Nollställ för stavning
    
    if (q.type === 'spell') {
      speakText(`Stava till ${q.word}`);
    } else {
      speakText(q.text);
    }
  };

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setGameState('playing');
    setStreak(0);
    setSessionSeconds(0);
    generateQuestion(selectedLevel);
  };

  const handleCorrect = () => {
    if (successAudio.current) successAudio.current.play().catch(()=>{});
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak >= 5) { // Bara 5 rätt behövs för att levla upp här (lättare att klara!)
      if (levelUpAudio.current) levelUpAudio.current.play().catch(()=>{});
      setGameState('levelup');
    } else {
      setTimeout(() => generateQuestion(level), 1000); // Liten paus innan nästa
    }
  };

  const handleWrong = (idx) => {
    if (failAudio.current) failAudio.current.play().catch(()=>{});
    setShakeMap({ [idx]: true });
    setTimeout(() => setShakeMap({}), 500);
    setStreak(0);
    speakText("Prova igen!");
  };

  const handleSpellClick = (letter, idx) => {
    const nextLetterIndex = spelledLetters.length;
    const correctLetter = currentQ.word[nextLetterIndex];

    if (letter === correctLetter) {
      // Rätt bokstav klickad!
      const newSpelled = [...spelledLetters, letter];
      setSpelledLetters(newSpelled);
      speakText(letter); // Bekräfta bokstaven med ljud
      
      // Har han stavat hela ordet?
      if (newSpelled.join('') === currentQ.word) {
        speakText(currentQ.word); // Säg hela ordet!
        handleCorrect();
      }
    } else {
      handleWrong(idx);
    }
  };

  const handleFillClick = (option, idx) => {
    if (option.w === currentQ.answer) {
      speakText(option.w);
      handleCorrect();
    } else {
      handleWrong(idx);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#701a75] via-[#86198f] to-[#a21caf] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_15px_50px_rgba(134,25,143,0.4)] border border-fuchsia-400/30 overflow-hidden text-center mb-8">
      
      {/* START SKÄRM */}
      {gameState === 'start' && (
        <div className="py-8 relative z-10">
          <PremiumEmoji emoji="🔍" className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 text-shadow-sm">Ord-Detektiven</h2>
          <p className="text-fuchsia-200 font-bold text-sm mb-8">
            {unlockedLevel < 3 ? "Du måste träna på detta mer! Kör en stund varje dag." : "Snyggt jobbat! Men du måste spela för att hålla kunskapen vid liv."}
          </p>
          
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
                    : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 border-fuchsia-400 text-white shadow-lg'
                  }`}
                >
                  <span>Level {lvl}</span>
                  {isLocked ? <span>🔒</span> : <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md">{levelNames[lvl-1]}</span>}
                </motion.button>
              );
            })}
          </div>
          <div className="text-fuchsia-300 text-[10px] font-black uppercase tracking-tighter">
            Total träningstid: {Math.floor(totalSeconds / 60)} minuter
          </div>
        </div>
      )}

      {/* SPEL SKÄRM */}
      {gameState === 'playing' && currentQ && (
        <div className="relative z-10">
          <div className="flex items-center justify-between bg-black/20 rounded-2xl p-3 mb-6 border border-white/10">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">Level {level}</span>
              <span className="text-sm font-black text-white">{levelNames[level-1]}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div className="flex gap-1 hidden sm:flex">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${i < streak ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-white/10'}`}></div>
                  ))}
                </div>
                <span className="text-amber-400 font-black sm:hidden">{streak}/5</span>
              </div>
              <button onClick={() => setGameState('start')} className="bg-red-500/20 text-red-300 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/40 border border-red-500/30 transition-all">
                Avbryt ✖
              </button>
            </div>
          </div>

          {/* SPEL-LOGIK FÖR NIVÅ 1 (STAVA) */}
          {currentQ.type === 'spell' && (
            <div className="flex flex-col items-center">
              <button onClick={() => speakText(currentQ.word)} className="active:scale-95 transition-transform mb-6">
                <PremiumEmoji emoji={currentQ.emoji.replace(/[^a-zA-Z0-9\p{Emoji}]/gu, '') || "❓"} className="w-32 h-32 mx-auto drop-shadow-xl mb-4" />
                <div className="flex gap-2">
                  {currentQ.word.split('').map((letter, i) => (
                    <div key={i} className="w-16 h-20 bg-white/10 border-2 border-dashed border-fuchsia-300/50 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-inner">
                      {spelledLetters[i] || ""}
                    </div>
                  ))}
                </div>
              </button>
              
              <div className="flex flex-wrap justify-center gap-3 w-full">
                {currentQ.options.map((letter, idx) => (
                  <motion.button
                    key={idx}
                    animate={shakeMap[idx] ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSpellClick(letter, idx)}
                    disabled={spelledLetters.includes(letter) && currentQ.word.split('').filter(l => l === letter).length <= spelledLetters.filter(l => l === letter).length}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl font-black text-3xl shadow-md border disabled:opacity-30 disabled:scale-90 transition-all ${
                      shakeMap[idx] ? 'bg-red-500 border-red-400 text-white' : 'bg-white text-purple-900 border-fuchsia-100 hover:bg-fuchsia-50'
                    }`}
                  >
                    {letter}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* SPEL-LOGIK FÖR NIVÅ 2 & 3 (MENINGAR) */}
          {currentQ.type === 'fill' && (
            <div className="flex flex-col items-center w-full">
              <button onClick={() => speakText(currentQ.text)} className="w-full bg-white/10 px-6 py-6 rounded-3xl border border-white/20 mb-8 active:scale-95 transition-transform shadow-inner flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-white leading-relaxed drop-shadow-md mb-2">{currentQ.text}</span>
                <span className="text-3xl">🔊</span>
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
                {currentQ.options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    animate={shakeMap[idx] ? { x: [-8, 8, -8, 8, 0] } : {}}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFillClick(opt, idx)}
                    className={`flex flex-col items-center justify-center py-6 rounded-2xl border-4 shadow-lg transition-all ${
                      shakeMap[idx] ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-fuchsia-200 hover:border-fuchsia-400'
                    }`}
                  >
                    <span className="text-5xl mb-3">{opt.e}</span>
                    <span className={`text-xl font-black uppercase tracking-wider ${shakeMap[idx] ? 'text-white' : 'text-slate-800'}`}>{opt.w}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LEVEL UP SKÄRM */}
      {gameState === 'levelup' && (
        <div className="py-8 relative z-10">
          <ConfettiRain />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
            <PremiumEmoji emoji="🎉" className="w-28 h-28 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
          </motion.div>
          <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2 text-shadow-md animate-pulse">Level Up!</h2>
          <p className="text-fuchsia-200 font-bold mb-10 text-lg">Helt otroligt bra! Du klarade Level {level}.</p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              const nextLvl = level < 3 ? level + 1 : 3;
              saveProgress(nextLvl);
              setLevel(nextLvl);
              setGameState('start');
            }}
            className="bg-white text-purple-900 px-10 py-4 rounded-full font-black text-lg uppercase tracking-widest shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            Fortsätt
          </motion.button>
        </div>
      )}
    </div>
  );
};

// --- MINI-SPELET: MENING-FIXAREN (Grammatik & Dåtid) ---
const GrammarGame = () => {
  const [gameState, setGameState] = useState('start');
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shakeIdx, setShakeIdx] = useState(null);
  
  const [currentQ, setCurrentQ] = useState(null);

  const levelNames = ["Dåtids-Fixaren", "Svåra Orden", "Grammatik-Bossen"];
  const appId = 'test-schema-v2';
  const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'bank', 'adrian');

  const successAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3') : null);
  const failAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3') : null);
  const levelUpAudio = useRef(typeof Audio !== "undefined" ? new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3') : null);

  useEffect(() => {
    const unsub = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUnlockedLevel(data.unlockedGrammarLevel || 1);
        setTotalSeconds(data.totalGrammarPlayTime || 0);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'playing') interval = setInterval(() => setSessionSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const saveProgress = async (newLevel) => {
    try {
      const today = new Date().setHours(0,0,0,0);
      const docSnap = await getDoc(statsRef);
      let newStreak = 1;
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.lastTrainingDate === today) newStreak = d.trainingStreak || 1;
        else if (d.lastTrainingDate === today - 86400000) newStreak = (d.trainingStreak || 0) + 1;
      }

      await updateDoc(statsRef, {
        unlockedGrammarLevel: Math.max(unlockedLevel, newLevel),
        totalGrammarPlayTime: totalSeconds + sessionSeconds,
        trainingStreak: newStreak,
        lastTrainingDate: today
      });
      setTotalSeconds(prev => prev + sessionSeconds);
      setSessionSeconds(0);
    } catch (err) { console.error(err); }
  };

  // Expanderad Frågebank för Mening-Fixaren!
  const questions = {
    1: [ // NIVÅ 1: Mycket vanliga oregelbundna verb i dåtid (Fokus: "-de" övergeneralisering)
      { part1: 'Igår', part2: 'jag mig i sängen.', answer: 'la', wrong: 'läggde', emoji: '🛏️' },
      { part1: 'Han', part2: 'till skolan imorse.', answer: 'gick', wrong: 'gådde', emoji: '🚶' },
      { part1: 'Vi', part2: 'en stor fågel i skogen.', answer: 'såg', wrong: 'sågde', emoji: '🦅' },
      { part1: 'På kalaset', part2: 'vi tårta.', answer: 'åt', wrong: 'ätade', emoji: '🎂' },
      { part1: 'Jag', part2: 'hela natten.', answer: 'sov', wrong: 'sovde', emoji: '😴' },
      { part1: 'Hon', part2: 'en bok innan hon somnade.', answer: 'läste', wrong: 'läsade', emoji: '📖' },
      { part1: 'Vi', part2: 'ett stort hus på kullen.', answer: 'fann', wrong: 'finnade', emoji: '🏠' }, // Eller hittade
      { part1: 'Hunden', part2: 'över staketet.', answer: 'hoppade', wrong: 'hoppde', emoji: '🐕' }, // Här är -de rätt, bra för att testa om han bara memorerat "undvik -de"
      { part1: 'Katten', part2: 'musen.', answer: 'tog', wrong: 'tagade', emoji: '🐈' },
      { part1: 'Jag', part2: 'vatten ur glaset.', answer: 'drack', wrong: 'drickte', emoji: '🥛' },
      { part1: 'Mamma', part2: 'mat i köket.', answer: 'lagade', wrong: 'lagde', emoji: '🍳' }, // Igen, testa om han fattar när det FAKTISKT ska vara -de/-ade
      { part1: 'Han', part2: 'ett brev till mormor.', answer: 'skrev', wrong: 'skrivde', emoji: '✉️' },
      { part1: 'Bollen', part2: 'ner i vattnet.', answer: 'föll', wrong: 'fallade', emoji: '⚽' },
      { part1: 'Vi', part2: 'på en stol.', answer: 'satt', wrong: 'sittade', emoji: '🪑' },
      { part1: 'Jag', part2: 'en tröja på mig.', answer: 'hade', wrong: 'hadde', emoji: '👕' } // Klassiskt felstavnings/uttalsfel
    ],
    2: [ // NIVÅ 2: Fler och lite klurigare verb (Tempus-blandning och fler fel-mönster)
      { part1: 'Fågeln', part2: 'högt upp i luften.', answer: 'flög', wrong: 'flygde', emoji: '☁️' },
      { part1: 'Jag', part2: 'glaset på bordet.', answer: 'ställde', wrong: 'stådde', emoji: '🥤' },
      { part1: 'Han', part2: 'och väntade länge.', answer: 'stod', wrong: 'stådde', emoji: '🧍' },
      { part1: 'Vi', part2: 'runt i en ring.', answer: 'sprang', wrong: 'springde', emoji: '🏃' },
      { part1: 'Solen', part2: 'starkt igår.', answer: 'sken', wrong: 'skinade', emoji: '☀️' },
      { part1: 'Kompisen', part2: 'över en sten.', answer: 'snubblade', wrong: 'snubblde', emoji: '🤕' },
      { part1: 'Jag', part2: 'om en mardröm.', answer: 'drömde', wrong: 'drömmade', emoji: '💭' },
      { part1: 'Han', part2: 'hela vägen hem.', answer: 'grät', wrong: 'gråtade', emoji: '😢' },
      { part1: 'Pappa', part2: 'nycklarna.', answer: 'tappade', wrong: 'tappde', emoji: '🔑' },
      { part1: 'Bilen', part2: 'väldigt snabbt.', answer: 'körde', wrong: 'kördade', emoji: '🏎️' },
      { part1: 'Trädet', part2: 'i vinden.', answer: 'vajade', wrong: 'vajde', emoji: '🌳' },
      { part1: 'Vi', part2: 'högt av skämtet.', answer: 'skrattade', wrong: 'skrattde', emoji: '😂' },
      { part1: 'Han', part2: 'att det var sant.', answer: 'ljög', wrong: 'ljugade', emoji: '🤥' },
      { part1: 'Vi', part2: 'en stor grop.', answer: 'grävde', wrong: 'grävade', emoji: '🕳️' },
      { part1: 'Isen', part2: 'i värmen.', answer: 'smälte', wrong: 'smältade', emoji: '🧊' }
    ],
    3: [ // NIVÅ 3: Fokus på Plural (En/Flera) av svåra och "oregelbundna" substantiv
      { part1: 'I huset fanns det tre små', part2: '.', answer: 'möss', wrong: 'mössar', emoji: '🐁' },
      { part1: 'Människan har två', part2: '.', answer: 'fötter', wrong: 'föttar', emoji: '👣' },
      { part1: 'I boken fanns det många', part2: '.', answer: 'böcker', wrong: 'bokar', emoji: '📚' },
      { part1: 'På gården stod två', part2: '.', answer: 'män', wrong: 'mannar', emoji: '👨' },
      { part1: 'Jag borstade mina', part2: '.', answer: 'tänder', wrong: 'tandrar', emoji: '🦷' },
      { part1: 'I skogen växte många', part2: '.', answer: 'träd', wrong: 'trädar', emoji: '🌲' }, // Nollplural
      { part1: 'Vi har tre', part2: 'hemma.', answer: 'barn', wrong: 'barnar', emoji: '🧒' },   // Nollplural
      { part1: 'Hon köpte fyra', part2: 'i affären.', answer: 'äpplen', wrong: 'äpplar', emoji: '🍎' },
      { part1: 'Hönan lade fem', part2: 'igår.', answer: 'ägg', wrong: 'äggar', emoji: '🥚' },   // Nollplural
      { part1: 'Vi såg många', part2: 'på himlen.', answer: 'moln', wrong: 'molnar', emoji: '☁️' }, // Nollplural
      { part1: 'Gårdens', part2: 'åt gräs.', answer: 'får', wrong: 'fårar', emoji: '🐑' },       // Nollplural
      { part1: 'Båda mina', part2: 'är kalla.', answer: 'händer', wrong: 'handar', emoji: '🖐️' },
      { part1: 'Vi plockade många', part2: '.', answer: 'bär', wrong: 'bärar', emoji: '🍓' },     // Nollplural
      { part1: 'I sjön simmade tre', part2: '.', answer: 'gäss', wrong: 'gåsar', emoji: '🦢' },
      { part1: 'Jag ritade två', part2: '.', answer: 'ögon', wrong: 'ögor', emoji: '👀' }
    ]
  };
  const generateQuestion = (lvl) => {
    const list = questions[lvl];
    const q = list[Math.floor(Math.random() * list.length)];
    // Blanda om "rätt" och "fel" ligger till vänster eller höger
    const isAnswerFirst = Math.random() > 0.5;
    const options = isAnswerFirst ? [q.answer, q.wrong] : [q.wrong, q.answer];
    
    setCurrentQ({ ...q, options, correctIdx: isAnswerFirst ? 0 : 1 });
    
    // Läs upp meningen med ett litet "Hmm" där ordet saknas
    speakText(`${q.part1} ... ${q.part2}`);
  };

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setGameState('playing');
    setStreak(0);
    setSessionSeconds(0);
    generateQuestion(selectedLevel);
  };

  const handleCorrect = () => {
    if (successAudio.current) successAudio.current.play().catch(()=>{});
    // Läs upp hela den rätta meningen så han hör hur den ska låta!
    speakText(`${currentQ.part1} ${currentQ.answer} ${currentQ.part2}`);
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak >= 5) { // 5 rätt för level up
      if (levelUpAudio.current) levelUpAudio.current.play().catch(()=>{});
      setGameState('levelup');
    } else {
      setTimeout(() => generateQuestion(level), 1500); // Vänta lite längre så han hinner höra meningen
    }
  };

  const handleWrong = (idx) => {
    if (failAudio.current) failAudio.current.play().catch(()=>{});
    setShakeIdx(idx);
    setTimeout(() => setShakeIdx(null), 500);
    setStreak(0);
    speakText("Prova det andra ordet!");
  };

  return (
    <div className="relative bg-gradient-to-br from-[#9a3412] via-[#c2410c] to-[#ea580c] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_15px_50px_rgba(194,65,12,0.4)] border border-orange-400/30 overflow-hidden text-center mb-8">
      
      {gameState === 'start' && (
        <div className="py-8 relative z-10">
          <PremiumEmoji emoji="🔧" className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 text-shadow-sm">Mening-Fixaren</h2>
          <p className="text-orange-200 font-bold text-sm mb-8">
            {unlockedLevel < 3 ? "Du måste träna på detta mer! Kör en stund varje dag." : "Snyggt jobbat! Men du måste spela för att hålla kunskapen vid liv."}
          </p>
          
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
                    : 'bg-gradient-to-r from-orange-500 to-amber-600 border-orange-400 text-white shadow-lg'
                  }`}
                >
                  <span>Level {lvl}</span>
                  {isLocked ? <span>🔒</span> : <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md">{levelNames[lvl-1]}</span>}
                </motion.button>
              );
            })}
          </div>
          <div className="text-orange-300 text-[10px] font-black uppercase tracking-tighter">
            Total träningstid: {Math.floor(totalSeconds / 60)} minuter
          </div>
        </div>
      )}

      {gameState === 'playing' && currentQ && (
        <div className="relative z-10">
          <div className="flex items-center justify-between bg-black/20 rounded-2xl p-3 mb-6 border border-white/10">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-300">Level {level}</span>
              <span className="text-sm font-black text-white">{levelNames[level-1]}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div className="flex gap-1 hidden sm:flex">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${i < streak ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-white/10'}`}></div>
                  ))}
                </div>
                <span className="text-amber-400 font-black sm:hidden">{streak}/5</span>
              </div>
              <button onClick={() => setGameState('start')} className="bg-red-500/20 text-red-300 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/40 border border-red-500/30 transition-all">
                Avbryt ✖
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center w-full">
            <PremiumEmoji emoji={currentQ.emoji} className="w-24 h-24 mb-4 drop-shadow-lg" />
            
            <button onClick={() => speakText(`${currentQ.part1} ... ${currentQ.part2}`)} className="w-full bg-white/10 px-6 py-6 rounded-3xl border border-white/20 mb-8 active:scale-95 transition-transform shadow-inner flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-black text-white leading-relaxed drop-shadow-md mb-2">
                {currentQ.part1} <span className="inline-block w-16 border-b-4 border-dashed border-orange-300 mx-2"></span> {currentQ.part2}
              </span>
              <span className="text-3xl mt-2">🔊</span>
            </button>

            <div className="grid grid-cols-2 gap-4 w-full">
              {currentQ.options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  animate={shakeIdx === idx ? { x: [-8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => idx === currentQ.correctIdx ? handleCorrect() : handleWrong(idx)}
                  className={`flex flex-col items-center justify-center py-6 rounded-2xl border-4 shadow-lg transition-all ${
                    shakeIdx === idx ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-orange-200 hover:border-orange-400'
                  }`}
                >
                  <span className={`text-2xl font-black uppercase tracking-wider ${shakeIdx === idx ? 'text-white' : 'text-slate-800'}`}>{opt}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'levelup' && (
        <div className="py-8 relative z-10">
          <ConfettiRain />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
            <PremiumEmoji emoji="🏆" className="w-28 h-28 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
          </motion.div>
          <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2 text-shadow-md animate-pulse">Level Up!</h2>
          <p className="text-orange-200 font-bold mb-10 text-lg">Du är en riktig Mening-Fixare!</p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              const nextLvl = level < 3 ? level + 1 : 3;
              saveProgress(nextLvl);
              setLevel(nextLvl);
              setGameState('start');
            }}
            className="bg-white text-orange-900 px-10 py-4 rounded-full font-black text-lg uppercase tracking-widest shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            Fortsätt
          </motion.button>
        </div>
      )}
    </div>
  );
};

// --- TRÄNINGS-STREAK (Visas ovanför spelen) ---
const TrainingStreakCard = () => {
  const [streak, setStreak] = useState(0);
  const [lastTrained, setLastTrained] = useState(0);

  useEffect(() => {
    const statsRef = doc(db, 'artifacts', 'test-schema-v2', 'public', 'data', 'bank', 'adrian');
    const unsub = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setStreak(docSnap.data().trainingStreak || 0);
        setLastTrained(docSnap.data().lastTrainingDate || 0);
      }
    });
    return () => unsub();
  }, []);

  const today = new Date().setHours(0,0,0,0);
  const isTrainedToday = lastTrained === today;

  return (
    <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex items-center justify-between text-white mb-2 border border-amber-300/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm border border-white/30">
          🔥
        </div>
        <div>
          <h3 className="font-black uppercase tracking-widest text-sm drop-shadow-sm mb-0.5">Tränings-Streak</h3>
          <p className="text-[11px] font-bold opacity-90 tracking-wide">
            {isTrainedToday ? 'Grymt jobbat! Du har tränat idag.' : 'Du måste träna! Håll lågan vid liv.'}
          </p>
        </div>
      </div>
      <div className="text-3xl font-black bg-white text-orange-500 px-5 py-2 rounded-2xl shadow-inner">
        {streak}
      </div>
    </div>
  );
};

// --- HUVUDKOMPONENT ---
const LearnTab = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8 pb-12 pt-2 px-2">
      
      <TrainingStreakCard />

      {/* VÅRA SPEL LÄNGST UPP! */}
      <ClockGame />
      <MonthGame />
      <WordGame />
      <GrammarGame />
      
      {/* KALENDERN LIGGER KVAR SNYGGT DÄR UNDER */}
      <CalendarCard />
      
    </motion.div>
  );
};

export default LearnTab;