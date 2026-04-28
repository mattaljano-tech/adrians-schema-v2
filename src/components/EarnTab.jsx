import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- FLYING COIN ANIMATION ---
const FlyingCoin = ({ coin }) => {
  const [pos, setPos] = useState({ left: coin.startX, top: coin.startY, scale: 1, opacity: 1 });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPos({ left: coin.startX + coin.tx, top: coin.startY + coin.ty, scale: 0.2, opacity: 0 });
    }, 50);
    return () => clearTimeout(timer);
  }, [coin]);

  return (
    <div className="fixed z-[9999] pointer-events-none transition-all duration-[800ms] ease-in-out flex flex-col items-center justify-center font-black text-xl sm:text-2xl bg-yellow-400 text-yellow-900 border-4 border-yellow-500 rounded-full w-14 h-14 shadow-[0_0_20px_rgba(250,204,21,0.8)]"
         style={{ left: pos.left - 28, top: pos.top - 28, transform: `scale(${pos.scale})`, opacity: pos.opacity }}>
      {coin.amount < 0 ? coin.amount : `+${coin.amount}`}
    </div>
  );
};

const EarnTab = ({ bankBalance, bankStreak, handleClaim, claimedQuests }) => {
  // --- STATES FÖR TIMERS & FUNKTIONER ---
  const [walkTime, setWalkTime] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const watchId = useRef(null);
  const lastPosition = useRef(null);
  const lastMovementTime = useRef(Date.now());
  
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [expandedChore, setExpandedChore] = useState(null);

  const [readTime, setReadTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [showReadPrompt, setShowReadPrompt] = useState(false);

  const levelUpAudioRef = useRef(null);
  const mindfulnessAudioRef = useRef(null);
  
  const [isMindfulnessPlaying, setIsMindfulnessPlaying] = useState(false);
  const mindfulnessSongs = [
    { id: 'm1', title: 'Avslappning i Rymden', url: 'Avslappning i rymden.mp3' },
    { id: 'm2', title: 'Lugna Skogen', url: 'Lugna Skogen.mp3' },
    { id: 'm3', title: 'Gaming Chill Lofi', url: 'https://din-länk-till-låt-3.mp3' }
  ];
  const [selectedSong, setSelectedSong] = useState(mindfulnessSongs[0].url);

  // --- UPPDRAG & CHECKLISTOR ---
  const cleanTasks = [
    { id: 'c1', text: 'Plocka upp kläder', reward: 5 },
    { id: 'c2', text: 'Bädda sängen', reward: 5 }
  ];
  const schoolTasks = [
    { id: 'h1', text: 'Gör läxa / Träna hjärnan i 15 min', reward: 10 },
    { id: 'h2', text: 'Packa skolväskan', reward: 5 }
  ];
  const learnTasks = [
    { id: 'l1', text: 'Träna på klockan', reward: 5 },
    { id: 'l2', text: 'Träna på veckodagarna', reward: 5 },
    { id: 'l3', text: 'Träna på månaderna', reward: 5 },
    { id: 'l4', text: 'Kolla på en lärande dokumentär (minst 10 min)', reward: 15 }
  ];
  const physicalTasks = [
    { id: 'p1', text: 'Armhävningar (3x5)', reward: 10 },
    { id: 'p2', text: 'Squats / Benböj (20 st)', reward: 10 },
    { id: 'p3', text: 'Plankan (30 sekunder)', reward: 10 }
  ];

  const fastQuests = [
    { id: 'q1', title: "Hjälpa till med disken", reward: 15, icon: "🍽️", type: "simple" },
    { id: 'q4', title: "Duka bordet", reward: 10, icon: "🥣", type: "simple" },
    { id: 'q2', title: "Städa ditt rum", icon: "🧹", type: "checklist", list: 'clean' },
    { id: 'q5', title: "Skol-Fix", icon: "🎒", type: "checklist", list: 'school' },
    { id: 'q3', title: "Ta ut sopor & Återvinning", reward: 10, icon: "🗑️", type: "simple" },
    { id: 'q10', title: "Hjärngympa & Lärande", icon: "🧠", type: "checklist", list: 'learn' },
    { id: 'q9', title: "Egen Fysisk Utmaning", icon: "🏃‍♂️", type: "checklist", list: 'physical' },
    { id: 'q7', title: "Gymmet med Mamma", reward: 30, icon: "🏋️‍♀️", type: "simple" },
    { id: 'q8', title: "Spela fotboll med Mathias", reward: 30, icon: "⚽", type: "simple" },
    { id: 'q12', title: "Lyssna på musik (10 min)", reward: 10, icon: "🎧", type: "simple" }
  ];

  const getTasks = (listType) => {
    if (listType === 'clean') return cleanTasks;
    if (listType === 'school') return schoolTasks;
    if (listType === 'learn') return learnTasks;
    if (listType === 'physical') return physicalTasks;
    return [];
  };

  const isClaimedToday = (id) => {
    if (!claimedQuests || !claimedQuests[id]) return false;
    const claimDateStr = new Date(claimedQuests[id]).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return claimDateStr === todayStr;
  };

  // --- FUNKTIONER FÖR LÄSNING ---
  useEffect(() => {
    if (readTime === 900) setShowReadPrompt(true); // 15 min
    if (readTime === 1020 && showReadPrompt) { // 17 min
      setIsReading(false);
      setShowReadPrompt(false);
    }
    // Dela ut 10kr per 10:e minut (600 sekunder)
    if (readTime > 0 && readTime % 600 === 0 && isReading) {
      triggerReward(10, null, null, "Läsning 10 minuter");
    }
  }, [readTime, isReading, showReadPrompt]);

  const handleReadAction = () => {
    setIsReading(!isReading);
  };
  
  const readableTens = Math.floor(readTime / 600);
  const readReward = readableTens * 10;

  // --- FUNKTIONER FÖR PROMENAD (GPS) ---
  const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371e3;
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleWalkAction = (e) => {
    if (!isWalking) {
      if ('geolocation' in navigator) {
        lastMovementTime.current = Date.now();
        setIsMoving(true);
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            if (lastPosition.current) {
              const dist = haversineDistance(lastPosition.current, pos.coords);
              if (dist > 5) {
                lastMovementTime.current = now;
                lastPosition.current = pos.coords;
              }
            } else {
              lastPosition.current = pos.coords;
              lastMovementTime.current = now;
            }
          },
          (err) => console.warn("GPS fel:", err),
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      } else {
        alert("GPS stöds inte på denna enhet.");
      }
      setIsWalking(true);
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      const walkEarned = Math.floor(walkTime / 60);
      if (walkEarned > 0) triggerReward(walkEarned, e, null, "Promenad");
      setIsWalking(false);
      setIsMoving(false);
      setWalkTime(0);
      lastPosition.current = null;
    }
  };

  const walkEarned = Math.floor(walkTime / 60);

  // Uppdatera timers varje sekund
  useEffect(() => {
    window.isTimerActive = isWalking || isReading;
    let interval = null;
    if (isWalking || isReading) {
      interval = setInterval(() => {
        const now = Date.now();
        if (isWalking) {
          if (now - lastMovementTime.current < 180000) { // 3 min utan rörelse = paus
            setWalkTime(t => t + 1);
            setIsMoving(true);
          } else {
            setIsMoving(false); 
          }
        }
        if (isReading) {
          setReadTime(t => t + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWalking, isReading]);

  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- XP BERÄKNING ---
  const totalXP = fastQuests.length;
  const earnedXP = fastQuests.filter(q => {
    if (q.type === 'simple') return isClaimedToday(q.id);
    if (q.type === 'checklist') {
      const tasks = getTasks(q.list);
      return tasks.length > 0 && tasks.every(t => isClaimedToday(t.id));
    }
    return false;
  }).length;
  const progressPercent = totalXP > 0 ? Math.round((earnedXP / totalXP) * 100) : 0;

  // --- LOKAL FUNKTION FÖR BELÖNINGAR OCH ANIMATIONER ---
  const triggerReward = (amount, e, questId = null, title = "Uppdrag") => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0) {
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    const id = Date.now() + Math.random();
    const bankEl = document.getElementById('adrians-bank-balance');
    let tx = 0;
    let ty = -500;
    if (bankEl) {
      const bankRect = bankEl.getBoundingClientRect();
      tx = (bankRect.left + bankRect.width / 2) - startX;
      ty = (bankRect.top + bankRect.height / 2) - startY;
    }

    setFlyingCoins(prev => [...prev, { id, amount, startX, startY, tx, ty }]);

    // Ropa på App.jsx funktion för att faktiskt spara pengarna
    handleClaim(amount, questId, title); 
    
    // Spela ljud och confetti
    if (amount >= 10) { 
      if(window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#4CAF50', '#FFEB3B', '#2196F3'] });
      levelUpAudioRef.current?.play().catch(err => console.log(err));
    }

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(c => c.id !== id));
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8 pb-12">
      <audio ref={levelUpAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3" preload="auto" />
      {flyingCoins.map(c => <FlyingCoin key={c.id} coin={c} />)}

      {/* VIRTUELL BANK */}
      <div id="adrians-bank-balance" className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-xl border-4 border-slate-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[10rem] -mt-10 -mr-10 pointer-events-none select-none">💳</div>
        
        <div className="flex justify-between items-start relative z-10 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Adrians Bank</h2>
            {bankStreak > 0 && (
              <div className="mt-2 bg-orange-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full shadow-md animate-pulse inline-block">
                🔥 {bankStreak} Dagars Streak!
              </div>
            )}
          </div>
          <div className="w-12 h-10 bg-yellow-400 rounded-md border-2 border-yellow-500 flex flex-col justify-center gap-1 p-1 shadow-inner">
            <div className="w-full h-[2px] bg-yellow-600"></div>
            <div className="w-full h-[2px] bg-yellow-600"></div>
            <div className="w-full h-[2px] bg-yellow-600"></div>
          </div>
        </div>

        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1 relative z-10">Tillgängligt Saldo</p>
        <div className="text-6xl font-black text-white relative z-10 flex items-baseline gap-2">
          {bankBalance} <span className="text-2xl text-slate-400">kr</span>
        </div>
      </div>

      <div className="bg-emerald-50 border-4 border-emerald-200 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
        <span className="text-4xl drop-shadow-sm">💰</span>
        <p className="font-bold text-emerald-800 text-sm">Gör uppdrag nedan och se dina pengar växa!</p>
      </div>

      {/* XP MÄTARE */}
      <div className="bg-white border-4 border-slate-200 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-end mb-3 relative z-10">
          <h3 className="font-black uppercase tracking-widest text-slate-700 text-xs">Dagens XP (Level Progress)</h3>
          <span className="text-2xl font-black text-emerald-500">{progressPercent}%</span>
        </div>
        <div className="w-full h-6 bg-slate-100 rounded-full border-2 border-slate-200 overflow-hidden relative z-10">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        {progressPercent === 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
            <span className="text-xl sm:text-2xl animate-bounce font-black text-orange-500 uppercase tracking-widest">🔥 Max Level Nådd Idag! 🔥</span>
          </div>
        )}
      </div>

      <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-xs mt-8 mb-4 text-center">🎯 Fasta Uppdrag</h3>
      
      {/* UPPDRAGS-LISTAN (CHECKLISTOR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 items-start">
        {fastQuests.map(q => {
          const tasks = getTasks(q.list);
          const totalReward = q.type === 'checklist' ? tasks.reduce((sum, t) => sum + t.reward, 0) : q.reward;
          const isSimpleDone = q.type === 'simple' && isClaimedToday(q.id);
          const isChecklistDone = q.type === 'checklist' && tasks.length > 0 && tasks.every(t => isClaimedToday(t.id));
          const completelyDone = isSimpleDone || isChecklistDone;

          return (
            <div key={q.id} className={`bg-white p-5 rounded-3xl border-4 shadow-sm flex flex-col transition-colors ${completelyDone ? 'border-slate-200 opacity-60 grayscale-[50%]' : 'border-slate-200 hover:border-emerald-300'}`}>
              <div 
                className={`flex justify-between items-center group ${completelyDone ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={(e) => {
                  if (completelyDone) return;
                  if (q.type === 'simple') {
                    if (q.id === 'q12') window.open('https://spotify.com', '_blank');
                    triggerReward(q.reward, e, q.id, q.title);
                  }
                  else setExpandedChore(expandedChore === q.id ? null : q.id);
                }}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-4xl drop-shadow-sm ${completelyDone ? '' : 'group-hover:scale-110 transition-transform'}`}>{q.icon}</span>
                  <span className="font-black text-slate-700 uppercase text-xs sm:text-sm leading-tight">
                    {q.title}
                    {completelyDone && <span className="block text-[10px] text-emerald-600 mt-1 tracking-widest">Klar för idag ✅</span>}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`${completelyDone ? 'bg-slate-200 text-slate-400' : 'bg-emerald-100 text-emerald-700'} font-black px-3 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap`}>
                    {q.type === 'checklist' ? `Max +${totalReward} kr` : `+${q.reward} kr`}
                  </div>
                  {q.type === 'checklist' && (
                    <div className={`${completelyDone ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-500'} font-bold px-3 py-1 rounded-full border-2 border-slate-200 text-[9px] uppercase tracking-widest`}>
                      {expandedChore === q.id ? 'Dölj' : 'Visa'}
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKLISTAN NÄR MAN FÄLLER UT */}
              {q.type === 'checklist' && expandedChore === q.id && (
                <div className="mt-4 pt-4 border-t-2 border-slate-100 space-y-2">
                  {tasks.map(task => {
                    const taskDone = isClaimedToday(task.id);
                    return (
                      <div key={task.id} className={`flex justify-between items-center p-3 rounded-xl border-2 transition-colors ${taskDone ? 'bg-green-50 border-green-200 opacity-60' : 'bg-slate-50 border-slate-200'}`}>
                        <span className={`font-bold uppercase text-[10px] sm:text-xs pr-2 ${taskDone ? 'text-green-600 line-through' : 'text-slate-700'}`}>{task.text}</span>
                        <motion.button 
                          whileHover={!taskDone ? { scale: 1.05 } : {}}
                          whileTap={!taskDone ? { scale: 0.95 } : {}}
                          disabled={taskDone}
                          onClick={(e) => triggerReward(task.reward, e, task.id, task.text)}
                          className={`px-3 py-1.5 rounded-full font-black text-[10px] uppercase whitespace-nowrap flex-shrink-0 ${taskDone ? 'bg-green-200 text-green-700' : 'bg-emerald-500 text-white shadow-sm'}`}
                        >
                          {taskDone ? 'Klar!' : `+${task.reward} kr`}
                        </motion.button>
                      </div>
                    );
                  })}
                  {tasks.length > 0 && tasks.every(t => isClaimedToday(t.id)) && (
                    <div className="text-center font-black text-emerald-600 uppercase text-[10px] tracking-widest pt-2 animate-pulse">Snyggt jobbat! Allt är klart.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-xs mt-8 mb-4 text-center">Fokus & Rörelse</h3>

      {/* TIMERS: LÄSA (Exakt kopierat från din SVG-kod) */}
      <div className={`rounded-[2.5rem] p-6 sm:p-8 shadow-sm border-4 relative overflow-hidden transition-colors duration-500 ${isReading ? 'border-orange-400' : 'border-slate-200'}`}>
        <svg className="absolute inset-0 w-full h-full object-cover z-0" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="400" fill="#fef3c7" />
          <rect x="100" y="50" width="150" height="200" fill="#1e1b4b" stroke="#ffffff" strokeWidth="8" />
          <line x1="100" y1="150" x2="250" y2="150" stroke="#ffffff" strokeWidth="4" />
          <line x1="175" y1="50" x2="175" y2="250" stroke="#ffffff" strokeWidth="4" />
          <circle cx="210" cy="90" r="15" fill="#fef08a" />
          <circle cx="130" cy="80" r="2" fill="#ffffff" />
          <circle cx="140" cy="180" r="2" fill="#ffffff" />
          <circle cx="220" cy="200" r="1.5" fill="#ffffff" />
          <rect x="550" y="50" width="180" height="300" fill="#78350f" />
          <rect x="560" y="120" width="160" height="10" fill="#92400e" />
          <rect x="560" y="200" width="160" height="10" fill="#92400e" />
          <rect x="560" y="280" width="160" height="10" fill="#92400e" />
          <rect x="570" y="70" width="20" height="50" fill="#ef4444" />
          <rect x="595" y="60" width="15" height="60" fill="#3b82f6" />
          <rect x="615" y="80" width="25" height="40" fill="#10b981" />
          <rect x="660" y="70" width="15" height="50" fill="#f59e0b" transform="rotate(15 660 120)" />
          <rect x="580" y="150" width="30" height="50" fill="#8b5cf6" />
          <rect x="615" y="140" width="20" height="60" fill="#f43f5e" />
          <rect x="640" y="160" width="40" height="40" fill="#14b8a6" />
          <rect x="570" y="230" width="15" height="50" fill="#f59e0b" />
          <rect x="590" y="220" width="25" height="60" fill="#3b82f6" />
          <rect x="620" y="240" width="20" height="40" fill="#ef4444" />
          <circle cx="680" cy="260" r="15" fill="#d97706" />
          <path d="M680 260 Q670 230 660 250" stroke="#15803d" fill="none" strokeWidth="4"/>
          <path d="M680 260 Q690 220 700 240" stroke="#15803d" fill="none" strokeWidth="4"/>
          <rect x="0" y="350" width="800" height="50" fill="#b45309" />
          <ellipse cx="400" cy="360" rx="200" ry="20" fill="#0f766e" />
          <rect x="200" y="100" width="50" height="40" fill="#fbbf24" />
          <polygon points="180,140 270,140 240,100 210,100" fill="#fcd34d" />
          <line x1="225" y1="140" x2="225" y2="350" stroke="#475569" strokeWidth="6" />
          <ellipse cx="225" cy="350" rx="30" ry="5" fill="#475569" />
          <polygon points="180,140 270,140 400,350 50,350" fill="#fef08a" opacity="0.2" />
          <path d="M300 200 C300 150, 450 150, 450 200 L450 320 C450 340, 300 340, 300 320 Z" fill="#b91c1c" />
          <rect x="280" y="220" width="40" height="100" rx="20" fill="#991b1b" />
          <rect x="430" y="220" width="40" height="100" rx="20" fill="#991b1b" />
          <path d="M320 280 Q375 260 430 280 L430 320 Q375 340 320 320 Z" fill="#7f1d1d" />
          <ellipse cx="400" cy="355" rx="25" ry="12" fill="#f59e0b" />
          <circle cx="385" cy="352" r="10" fill="#f59e0b" />
          <polygon points="378,348 382,340 388,345" fill="#f59e0b" />
          <polygon points="388,345 392,340 396,348" fill="#f59e0b" />
        </svg>

        <div className="absolute inset-0 bg-slate-900/65 z-10 backdrop-blur-[1px]"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md ${isReading ? 'bg-orange-400 animate-pulse' : 'bg-white'}`}>📖</div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-wide drop-shadow-md">Läs en bok</h4>
              <p className="text-slate-200 font-bold text-[10px] sm:text-xs drop-shadow-md">Läs hur länge du vill. Tjäna 10 kr för varje 10 minuter.</p>
            </div>
          </div>

          <div className="text-white flex flex-col items-center mb-6">
            <span className="text-6xl sm:text-[5.5rem] leading-none font-black tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{formatTimer(readTime)}</span>
            <div className="mt-4 text-center bg-slate-900/80 px-4 py-2 rounded-full border-2 border-slate-500 shadow-md backdrop-blur-md">
              {readReward > 0 
                ? <span className="text-green-400 font-black uppercase text-xs animate-bounce">Du har tjänat {readReward} kr!</span>
                : <span className="text-slate-300 font-bold uppercase text-[10px]">Läs i 10 min för att tjäna 10 kr</span>
              }
            </div>
          </div>

          {showReadPrompt && (
            <div className="mb-4 bg-yellow-400 p-4 rounded-xl border-4 border-yellow-500 shadow-xl text-center animate-bounce">
              <h4 className="text-lg font-black text-yellow-900 uppercase mb-1">Läser du fortfarande? 👀</h4>
              <p className="text-yellow-800 font-bold text-xs mb-3">Svara inom 2 minuter annars stängs timern av!</p>
              <button onClick={() => setShowReadPrompt(false)} className="bg-yellow-900 text-yellow-400 px-6 py-2 rounded-full font-black uppercase text-sm shadow-md hover:bg-yellow-800">
                Ja, jag läser!
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
              onClick={handleReadAction} 
              className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-colors border-2 ${isReading ? 'bg-orange-500 text-white border-orange-600' : 'bg-blue-600 text-white border-blue-700'}`}
            >
              {readTime === 0 ? '▶ Starta Timer' : isReading ? '⏸ Pausa' : '▶ Fortsätt läsa'}
            </motion.button>
            {readTime > 0 && !isReading && (
              <motion.button 
                onClick={() => setReadTime(0)} 
                className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest border-2 border-slate-300"
              >
                ⏹ Avsluta & Nollställ
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* TIMERS: GÅ (GPS) */}
      <div className={`rounded-[2.5rem] p-6 sm:p-8 shadow-sm border-4 relative overflow-hidden transition-colors duration-500 ${isWalking ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}>
        <svg className="absolute inset-0 w-full h-full object-cover z-0" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="400" fill="#bae6fd" />
          <circle cx="650" cy="100" r="50" fill="#fde047" />
          <g fill="#ffffff" opacity="0.8"><circle cx="200" cy="100" r="30" /><circle cx="230" cy="90" r="40" /><circle cx="260" cy="100" r="30" /></g>
          <g fill="#ffffff" opacity="0.6"><circle cx="600" cy="140" r="25" /><circle cx="630" cy="130" r="35" /><circle cx="660" cy="140" r="25" /></g>
          <rect x="50" y="150" width="180" height="250" fill="#fcd34d" rx="4" />
          <rect x="250" y="100" width="220" height="300" fill="#fca5a5" rx="4" />
          <rect x="490" y="160" width="160" height="240" fill="#fcd34d" rx="4" />
          <rect x="80" y="180" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="155" y="180" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="80" y="260" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="155" y="260" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="290" y="140" width="40" height="55" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="390" y="140" width="40" height="55" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="290" y="220" width="40" height="55" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="390" y="220" width="40" height="55" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="290" y="300" width="40" height="55" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="390" y="300" width="40" height="55" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="520" y="190" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="585" y="190" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="520" y="270" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <rect x="585" y="270" width="35" height="50" fill="#e0f2fe" opacity="0.9" rx="2"/>
          <circle cx="80" cy="300" r="70" fill="#166534" />
          <circle cx="140" cy="280" r="80" fill="#15803d" />
          <circle cx="430" cy="290" r="85" fill="#166534" />
          <circle cx="500" cy="310" r="65" fill="#15803d" />
          <circle cx="700" cy="270" r="95" fill="#166534" />
          <circle cx="780" cy="300" r="70" fill="#15803d" />
          <rect x="0" y="340" width="800" height="60" fill="#94a3b8" />
          <rect x="0" y="340" width="800" height="8" fill="#cbd5e1" />
          <text x="550" y="385" fontSize="45">🚶‍♂️</text>
          <text x="600" y="385" fontSize="35">🐕</text>
          <text x="180" y="380" fontSize="40">🏃‍♀️</text>
          <text x="350" y="385" fontSize="40">🚶‍♀️</text>
        </svg>

        <div className="absolute inset-0 bg-slate-900/65 z-10 backdrop-blur-[1px]"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md ${isWalking ? 'bg-green-400 animate-bounce' : 'bg-white'}`}>🚶‍♂️</div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-wide drop-shadow-md">Ta en promenad</h4>
              <p className="text-slate-200 font-bold text-[10px] sm:text-xs drop-shadow-md">Gå ut och rör på dig. Tjäna 1 kr per minut.</p>
            </div>
          </div>

          <div className="text-white flex flex-col items-center mb-6">
            <span className="text-6xl sm:text-[5.5rem] leading-none font-black tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{formatTimer(walkTime)}</span>
            <div className="mt-4 text-center bg-slate-900/80 px-4 py-2 rounded-full border-2 border-slate-500 shadow-md backdrop-blur-md">
              <span className="text-slate-300 font-bold uppercase text-[10px] mr-2">Du har tjänat:</span>
              <span className="text-green-400 font-black text-sm">+{walkEarned} kr</span>
            </div>
            {isWalking && !isMoving && (
              <div className="mt-2 text-orange-400 font-bold text-[10px] uppercase animate-pulse text-center bg-slate-900/80 px-3 py-1.5 rounded-lg">
                Pausad: Ingen rörelse på 3 minuter
              </div>
            )}
            {isWalking && isMoving && (
              <div className="mt-2 text-green-400 font-bold text-[10px] uppercase animate-pulse text-center bg-slate-900/80 px-3 py-1.5 rounded-lg">
                GPS-spårning aktiv 📍
              </div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
            onClick={handleWalkAction} 
            className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-colors border-2 ${isWalking ? 'bg-green-500 text-white border-green-600' : 'bg-blue-600 text-white border-blue-700'}`}
          >
            {!isWalking ? '▶ Börja gå!' : `⏹ Avsluta & Hämta ${walkEarned} kr`}
          </motion.button>
        </div>
      </div>

      {/* MINDFULNESS SPELARE */}
      <div className="bg-indigo-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border-4 border-indigo-300 relative overflow-hidden transition-colors duration-500">
        <svg className="absolute inset-0 w-full h-full object-cover z-0" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="400" fill="#a5b4fc" />
          <circle cx="700" cy="80" r="40" fill="#fef3c7" />
          <path d="M0,320 C150,250 350,380 500,310 C650,240 800,340 800,320 L800,400 L0,400 Z" fill="#6366f1" />
          <path d="M0,360 C100,340 200,390 300,360 C400,330 500,380 600,350 C700,330 800,380 800,360 L800,400 L0,400 Z" fill="#4f46e5" />
          <g fill="none" stroke="#c7d2fe" strokeWidth="3" opacity="0.5"><circle cx="400" cy="200" r="50" /><circle cx="400" cy="200" r="100" /><circle cx="400" cy="200" r="150" /></g>
          <text x="350" y="340" fontSize="50">🧘‍♂️</text>
          <text x="100" y="100" fontSize="30">✨</text>
          <text x="600" y="150" fontSize="30">✨</text>
        </svg>

        <div className="absolute inset-0 bg-slate-900/60 z-10 backdrop-blur-[1px]"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md bg-white">🎧</div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-wide drop-shadow-md flex items-center gap-2">
                Mindfulness
                <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full border border-emerald-400">+5 kr</span>
              </h4>
              <p className="text-indigo-100 font-bold text-[10px] drop-shadow-md mt-1">Lyssna klart på hela låten för att få belöningen.</p>
            </div>
          </div>

          <div className="bg-white/95 p-4 rounded-xl border-2 border-indigo-100 shadow-sm mb-4 backdrop-blur-sm">
            <label className="block text-[10px] font-black uppercase text-indigo-400 mb-2">Välj låt:</label>
            <select 
              value={selectedSong} 
              onChange={(e) => setSelectedSong(e.target.value)}
              className="w-full p-2 bg-indigo-50 border border-indigo-200 rounded-lg font-bold text-sm text-indigo-900 outline-none"
            >
              {mindfulnessSongs.map(song => (
                <option key={song.id} value={song.url}>{song.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-white/95 p-4 rounded-xl shadow-sm border-2 border-indigo-100 backdrop-blur-sm">
            <audio 
              ref={mindfulnessAudioRef}
              src={selectedSong} 
              onEnded={(e) => {
                setIsMindfulnessPlaying(false);
                triggerReward(5, e, null, "Lyssna på Mindfulness");
              }}
              onPlay={() => setIsMindfulnessPlaying(true)}
              onPause={() => setIsMindfulnessPlaying(false)}
            ></audio>
            
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isMindfulnessPlaying) mindfulnessAudioRef.current.pause();
                else mindfulnessAudioRef.current.play();
              }}
              className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-colors border-2 flex justify-center items-center gap-2 ${isMindfulnessPlaying ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-indigo-600 text-white border-indigo-700'}`}
            >
              {isMindfulnessPlaying ? '⏸ Pausa Låten' : '▶ Starta Låten'}
            </motion.button>
          </div>
        </div>
      </div>
      
    </motion.div>
  );
};

export default EarnTab;