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
    <div className="fixed z-[9999] pointer-events-none transition-all duration-[800ms] ease-in-out flex flex-col items-center justify-center font-black text-xl bg-yellow-400 text-yellow-900 border-2 border-yellow-500 rounded-full w-12 h-12 shadow-[0_0_15px_rgba(250,204,21,0.6)]"
         style={{ left: pos.left - 24, top: pos.top - 24, transform: `scale(${pos.scale})`, opacity: pos.opacity }}>
      {coin.amount < 0 ? coin.amount : `+${coin.amount}`}
    </div>
  );
};

const EarnTab = ({ bankBalance, bankStreak, handleClaim, claimedQuests }) => {
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
    { id: 'l4', text: 'Kolla på en lärande dokumentär', reward: 15 }
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
    if (readTime === 900) setShowReadPrompt(true); 
    if (readTime === 1020 && showReadPrompt) { 
      setIsReading(false);
      setShowReadPrompt(false);
    }
    if (readTime > 0 && readTime % 600 === 0 && isReading) {
      triggerReward(10, null, null, "Läsning 10 minuter");
    }
  }, [readTime, isReading, showReadPrompt]);

  const handleReadAction = () => setIsReading(!isReading);
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

  useEffect(() => {
    window.isTimerActive = isWalking || isReading;
    let interval = null;
    if (isWalking || isReading) {
      interval = setInterval(() => {
        const now = Date.now();
        if (isWalking) {
          if (now - lastMovementTime.current < 180000) { 
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
    handleClaim(amount, questId, title); 
    
    if (amount >= 10) { 
      if(window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#fbbf24', '#3b82f6'] });
      levelUpAudioRef.current?.play().catch(err => console.log(err));
    }

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(c => c.id !== id));
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6 pb-12">
      <audio ref={levelUpAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3" preload="auto" />
      {flyingCoins.map(c => <FlyingCoin key={c.id} coin={c} />)}

      {/* --- VIRTUELL BANK (Premium Fintech Style) --- */}
      <div id="adrians-bank-balance" className="bg-gradient-to-br from-[#1E293B] to-[#0f172a] rounded-[2rem] p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.15)] relative overflow-hidden mt-4 border border-slate-700/50">
        
        {/* Dekorativ bakgrundseffekt */}
        <div className="absolute -right-6 -top-10 opacity-10 text-[130px] pointer-events-none select-none blur-[1px] rotate-12">💳</div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-start mb-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs drop-shadow-sm">
              Adrians Bank
            </h2>
            {bankStreak > 0 && (
              <div className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-max shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                <span className="text-sm">🔥</span> {bankStreak} Dagars Streak!
              </div>
            )}
          </div>
          
          {/* Guld-chip (Ger kreditkorts-känsla) */}
          <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md border border-yellow-200/50 shadow-inner flex flex-col justify-evenly p-1.5 opacity-90">
            <div className="w-full h-[1px] bg-yellow-700/40"></div>
            <div className="w-full h-[1px] bg-yellow-700/40"></div>
            <div className="w-full h-[1px] bg-yellow-700/40"></div>
          </div>
        </div>

        <div className="relative z-10 pt-2">
          <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[9px] sm:text-[10px] mb-1">
            Tillgängligt Saldo
          </p>
          <div className="text-5xl sm:text-6xl font-black text-white font-clock tabular-nums tracking-tight flex items-baseline gap-2 drop-shadow-md">
            {bankBalance} <span className="text-xl sm:text-2xl text-slate-400 font-sans tracking-wide">kr</span>
          </div>
        </div>
      </div>

      {/* --- RUBRIK --- */}
      <div className="flex items-center justify-center gap-2 pt-2 mb-2">
        <span className="text-lg">🎯</span>
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Fasta Uppdrag</h3>
      </div>
      
      {/* --- UPPDRAGS-LISTA (EN KOLUMN - PREMIUM) --- */}
      <div className="flex flex-col gap-3 mb-10">
        {fastQuests.map(q => {
          const tasks = getTasks(q.list);
          const totalReward = q.type === 'checklist' ? tasks.reduce((sum, t) => sum + t.reward, 0) : q.reward;
          const isSimpleDone = q.type === 'simple' && isClaimedToday(q.id);
          const isChecklistDone = q.type === 'checklist' && tasks.length > 0 && tasks.every(t => isClaimedToday(t.id));
          const completelyDone = isSimpleDone || isChecklistDone;

          return (
            <div key={q.id} className="flex flex-col">
              <div 
                className={`bg-white rounded-[1.5rem] p-3 sm:p-4 flex items-center justify-between border transition-all duration-200 ${completelyDone ? 'border-slate-100 opacity-60 grayscale-[30%]' : 'border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] active:scale-[0.98]'}`}
                onClick={(e) => {
                  if (completelyDone) return;
                  if (q.type === 'simple') {
                    if (q.id === 'q12') window.open('https://spotify.com', '_blank');
                    triggerReward(q.reward, e, q.id, q.title);
                  }
                  else setExpandedChore(expandedChore === q.id ? null : q.id);
                }}
              >
                {/* Vänster: Ikon i en egen mjuk box */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 transition-colors ${completelyDone ? 'bg-slate-50' : 'bg-[#f8fafc]'}`}>
                    {q.icon}
                  </div>
                  
                  {/* Mitten: Titel och Subtitel */}
                  <div className="flex flex-col justify-center">
                    <span className={`font-black uppercase tracking-wide text-sm sm:text-base ${completelyDone ? 'text-slate-400 line-through' : 'text-[#1E293B]'}`}>
                      {q.title}
                    </span>
                    {q.type === 'checklist' && !completelyDone && (
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                        {tasks.length} delmoment
                      </span>
                    )}
                    {completelyDone && (
                      <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                        ✅ Klar för idag
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Höger: Prislapp och "Visa"-knapp/Pil */}
                <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0 pl-2">
                  <div className={`${completelyDone ? 'bg-slate-100 text-slate-400' : 'bg-[#dcfce7] text-[#059669] shadow-sm'} font-black px-4 py-2 rounded-full text-xs sm:text-sm tracking-wide`}>
                    {q.type === 'checklist' ? `Max +${totalReward} kr` : `+${q.reward} kr`}
                  </div>
                  
                  {q.type === 'checklist' && !completelyDone && (
                    <div className="flex items-center gap-1 text-slate-400 mt-1 mr-1">
                      <span className="font-bold text-[10px] uppercase tracking-widest">{expandedChore === q.id ? 'Dölj' : 'Visa'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${expandedChore === q.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKLISTAN */}
              <AnimatePresence>
                {q.type === 'checklist' && expandedChore === q.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }} 
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden pl-4 pr-2"
                  >
                    <div className="bg-slate-50/80 border border-slate-100 rounded-[1.5rem] p-3 space-y-2">
                      {tasks.map(task => {
                        const taskDone = isClaimedToday(task.id);
                        return (
                          <div key={task.id} className={`flex justify-between items-center p-3 rounded-[1rem] transition-colors ${taskDone ? 'bg-transparent opacity-60' : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100'}`}>
                            <span className={`font-bold uppercase text-xs pl-2 ${taskDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</span>
                            <motion.button 
                              whileHover={!taskDone ? { scale: 1.05 } : {}}
                              whileTap={!taskDone ? { scale: 0.95 } : {}}
                              disabled={taskDone}
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerReward(task.reward, e, task.id, task.text);
                              }}
                              className={`px-4 py-2 rounded-full font-black text-[10px] sm:text-xs uppercase whitespace-nowrap flex-shrink-0 ${taskDone ? 'bg-slate-200 text-slate-500' : 'bg-[#10b981] text-white shadow-sm'}`}
                            >
                              {taskDone ? 'Klar' : `+${task.reward} kr`}
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3 pt-6 mb-4">
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Fokus & Rörelse</h3>
      </div>

      {/* --- TIMERS: LÄSA --- */}
      <div className={`rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border relative overflow-hidden transition-colors duration-500 ${isReading ? 'bg-[#fff7ed] border-[#fde68a]' : 'bg-white border-slate-100'}`}>
        <svg className="absolute inset-0 w-full h-full object-cover z-0 opacity-20" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="400" fill="transparent" />
          <circle cx="210" cy="90" r="15" fill="#fef08a" />
          <ellipse cx="400" cy="360" rx="200" ry="20" fill="#0f766e" />
          <rect x="200" y="100" width="50" height="40" fill="#fbbf24" />
          <polygon points="180,140 270,140 240,100 210,100" fill="#fcd34d" />
        </svg>

        <div className="absolute inset-0 bg-white/80 z-10 backdrop-blur-[2px]"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${isReading ? 'bg-orange-100 animate-pulse' : 'bg-slate-50'}`}>📖</div>
            <div>
              <h4 className="text-xl font-black text-[#1E293B] uppercase tracking-wide">Läs en bok</h4>
              <p className="text-slate-500 font-bold text-xs mt-1">Läs hur länge du vill. Tjäna 10 kr för varje 10 minuter.</p>
            </div>
          </div>

          <div className="flex flex-col items-center mb-6">
            <span className={`text-[5.5rem] sm:text-[6.5rem] leading-none font-black tracking-widest font-clock ${isReading ? 'text-orange-500' : 'text-slate-700'}`}>{formatTimer(readTime)}</span>
            <div className={`mt-4 text-center px-6 py-2.5 rounded-full border shadow-sm ${readReward > 0 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              {readReward > 0 
                ? <span className="text-[#059669] font-black uppercase text-sm animate-bounce">Du har tjänat {readReward} kr!</span>
                : <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Läs i 10 min för att tjäna 10 kr</span>
              }
            </div>
          </div>

          {showReadPrompt && (
            <div className="mb-6 bg-yellow-50 p-5 rounded-2xl border border-yellow-200 shadow-sm text-center animate-bounce">
              <h4 className="text-base font-black text-yellow-800 uppercase mb-1">Läser du fortfarande? 👀</h4>
              <p className="text-yellow-600 font-bold text-xs mb-4">Svara inom 2 minuter annars stängs timern av!</p>
              <button onClick={() => setShowReadPrompt(false)} className="bg-yellow-400 text-yellow-900 px-8 py-3 rounded-full font-black uppercase text-sm shadow-sm hover:bg-yellow-300 transition-colors">
                Ja, jag läser!
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
              onClick={handleReadAction} 
              className={`flex-1 py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-md transition-colors border ${isReading ? 'bg-orange-500 text-white border-orange-600' : 'bg-[#3b82f6] text-white border-[#2563eb]'}`}
            >
              {readTime === 0 ? '▶ Starta Timer' : isReading ? '⏸ Pausa' : '▶ Fortsätt läsa'}
            </motion.button>
            {readTime > 0 && !isReading && (
              <motion.button 
                onClick={() => setReadTime(0)} 
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-sm tracking-widest border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                ⏹ Avsluta & Nollställ
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* --- TIMERS: GÅ (GPS) --- */}
      <div className={`rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border relative overflow-hidden transition-colors duration-500 ${isWalking ? 'bg-[#ecfdf5] border-[#a7f3d0]' : 'bg-white border-slate-100'}`}>
        <svg className="absolute inset-0 w-full h-full object-cover z-0 opacity-20" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <circle cx="650" cy="100" r="50" fill="#fde047" />
          <circle cx="80" cy="300" r="70" fill="#166534" />
          <circle cx="140" cy="280" r="80" fill="#15803d" />
        </svg>

        <div className="absolute inset-0 bg-white/80 z-10 backdrop-blur-[2px]"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${isWalking ? 'bg-green-100 animate-bounce' : 'bg-slate-50'}`}>🚶‍♂️</div>
            <div>
              <h4 className="text-xl font-black text-[#1E293B] uppercase tracking-wide">Ta en promenad</h4>
              <p className="text-slate-500 font-bold text-xs mt-1">Gå ut och rör på dig. Tjäna 1 kr per minut.</p>
            </div>
          </div>

          <div className="flex flex-col items-center mb-6">
            <span className={`text-[5.5rem] sm:text-[6.5rem] leading-none font-black tracking-widest font-clock ${isWalking ? 'text-emerald-500' : 'text-slate-700'}`}>{formatTimer(walkTime)}</span>
            <div className="mt-4 text-center bg-slate-50 px-6 py-2.5 rounded-full border border-slate-200 shadow-sm">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mr-2">Du har tjänat:</span>
              <span className="text-[#059669] font-black text-base">+{walkEarned} kr</span>
            </div>
            {isWalking && !isMoving && (
              <div className="mt-3 text-orange-500 font-bold text-xs uppercase animate-pulse text-center bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
                Pausad: Ingen rörelse på 3 minuter
              </div>
            )}
            {isWalking && isMoving && (
              <div className="mt-3 text-[#059669] font-bold text-xs uppercase animate-pulse text-center bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                GPS-spårning aktiv 📍
              </div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
            onClick={handleWalkAction} 
            className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-md transition-colors border ${isWalking ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-[#3b82f6] text-white border-[#2563eb]'}`}
          >
            {!isWalking ? '▶ Börja gå!' : `⏹ Avsluta & Hämta ${walkEarned} kr`}
          </motion.button>
        </div>
      </div>

      {/* --- MINDFULNESS SPELARE --- */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden transition-colors duration-500">
        <svg className="absolute inset-0 w-full h-full object-cover z-0 opacity-10" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <circle cx="700" cy="80" r="40" fill="#fef3c7" />
          <path d="M0,320 C150,250 350,380 500,310 C650,240 800,340 800,320 L800,400 L0,400 Z" fill="#6366f1" />
        </svg>

        <div className="absolute inset-0 bg-white/80 z-10 backdrop-blur-[2px]"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm bg-indigo-50 text-indigo-500">🎧</div>
            <div>
              <h4 className="text-xl font-black text-[#1E293B] uppercase tracking-wide flex items-center gap-3">
                Mindfulness
                <span className="bg-[#dcfce7] text-[#059669] text-[10px] px-2.5 py-1 rounded-full border border-green-200 shadow-sm">+5 kr</span>
              </h4>
              <p className="text-slate-500 font-bold text-xs mt-1">Lyssna klart på hela låten för belöning.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner mb-4">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Välj låt:</label>
            <select 
              value={selectedSong} 
              onChange={(e) => setSelectedSong(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              {mindfulnessSongs.map(song => (
                <option key={song.id} value={song.url}>{song.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl shadow-inner border border-slate-100">
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
              className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-md transition-colors border flex justify-center items-center gap-2 ${isMindfulnessPlaying ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-indigo-500 text-white border-indigo-600'}`}
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