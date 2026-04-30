import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM EMOJI ---
const PremiumEmoji = ({ emoji, className = "w-10 h-10" }) => (
  <img 
    src={`https://emojicdn.elk.sh/${emoji}?style=apple`} 
    alt={emoji} 
    className={`${className} drop-shadow-sm select-none pointer-events-none`} 
    draggable="false"
  />
);

// --- TIMER-RING ---
const TimerRing = ({ percentage, color = "#3b82f6" }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  // Säkerställ att percentage inte blir NaN
  const safePercentage = isNaN(percentage) ? 0 : percentage;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300 ease-linear"
      />
    </svg>
  );
};

// --- FLYING COIN ---
const FlyingCoin = ({ coin }) => {
  const [pos, setPos] = useState({ left: coin.startX, top: coin.startY, scale: 1, opacity: 1 });
  useEffect(() => {
    setTimeout(() => setPos({ left: coin.startX + coin.tx, top: coin.startY + coin.ty, scale: 0.2, opacity: 0 }), 50);
  }, [coin]);
  return (
    <div className="fixed z-[9999] pointer-events-none transition-all duration-[800ms] ease-in-out flex items-center justify-center font-black bg-yellow-400 text-yellow-900 border-2 border-yellow-500 rounded-full w-12 h-12 shadow-lg"
         style={{ left: pos.left - 24, top: pos.top - 24, transform: `scale(${pos.scale})`, opacity: pos.opacity }}>
      +{coin.amount}
    </div>
  );
};

const EarnTab = ({ bankBalance, bankStreak, handleClaim, claimedQuests }) => {
  const [flyingCoins, setFlyingCoins] = useState([]);
  
  // States för Läsning & Promenad
  const [readTime, setReadTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [walkTime, setWalkTime] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [showReadPrompt, setShowReadPrompt] = useState(false);
  const [expandedQuest, setExpandedQuest] = useState(null);

  // --- MINDFULNESS LOGIK ---
  const audioRef = useRef(null);
  const mindfulnessSongs = [
    { id: 'm1', title: 'Rymden', url: 'Avslappning i rymden.mp3', reward: 5 },
    { id: 'm2', title: 'Skogen', url: 'Lugna skogen.mp3', reward: 5 },
    { id: 'm3', title: 'Lofi', url: 'https://din-länk-till-låt-3.mp3', reward: 5 }
  ];
  const [selectedSongId, setSelectedSongId] = useState(mindfulnessSongs[0].id);
  const [mindStatus, setMindStatus] = useState('idle'); // 'idle', 'playing', 'finished'
  const [mindProgress, setMindProgress] = useState(0);

  const currentSong = mindfulnessSongs.find(s => s.id === selectedSongId);

  // --- UPPDRAGSDATA ---
  const cleanTasks = [
    { id: 'c1', text: 'Plocka upp kläder', reward: 5 },
    { id: 'c2', text: 'Bädda sängen', reward: 5 }
  ];
  const schoolTasks = [
    { id: 'h1', text: 'Gör läxa / Träna hjärnan 15 min', reward: 10 },
    { id: 'h2', text: 'Packa skolväskan', reward: 5 }
  ];
  const learnTasks = [
    { id: 'l1', text: 'Träna på klockan', reward: 5 },
    { id: 'l2', text: 'Träna på veckodagarna', reward: 5 },
    { id: 'l3', text: 'Träna på månaderna', reward: 5 },
    { id: 'l4', text: 'Lärande dokumentär (10 min)', reward: 15 }
  ];
  const physicalTasks = [
    { id: 'p1', text: 'Armhävningar (3x5)', reward: 10 },
    { id: 'p2', text: 'Squats / Benböj (20 st)', reward: 10 },
    { id: 'p3', text: 'Plankan (30 sekunder)', reward: 10 }
  ];

  const quests = [
    { id: 'q1', title: "Hjälpa till med disken", reward: 15, icon: "🍽️", type: "simple" },
    { id: 'q4', title: "Duka bordet", reward: 10, icon: "🥣", type: "simple" },
    { id: 'q2', title: "Städa ditt rum", icon: "🧹", type: "checklist", tasks: cleanTasks },
    { id: 'q5', title: "Skol-Fix", icon: "🎒", type: "checklist", tasks: schoolTasks },
    { id: 'q3', title: "Ta ut sopor & Återvinning", reward: 10, icon: "🗑️", type: "simple" },
    { id: 'q10', title: "Hjärngympa & Lärande", icon: "🧠", type: "checklist", tasks: learnTasks },
    { id: 'q9', title: "Egen Fysisk Utmaning", icon: "🏃‍♂️", type: "checklist", tasks: physicalTasks },
    { id: 'q7', title: "Gymmet med Mamma", reward: 30, icon: "🏋️‍♀️", type: "simple" },
    { id: 'q8', title: "Spela fotboll med Mathias", reward: 30, icon: "⚽", type: "simple" },
    { id: 'q12', title: "Lyssna på musik (10 min)", reward: 10, icon: "🎧", type: "simple" }
  ];

  // --- LOGIK FÖR LÄS/GÅ-TIMERS ---
  useEffect(() => {
    let interval;
    if (isReading || isWalking) {
      interval = setInterval(() => {
        if (isReading) setReadTime(t => t + 1);
        if (isWalking) setWalkTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReading, isWalking]);

  useEffect(() => {
    if (readTime === 900) setShowReadPrompt(true); 
    if (readTime === 1020 && showReadPrompt) { 
      setIsReading(false);
      setShowReadPrompt(false);
    }
  }, [readTime, showReadPrompt]);

  const isDone = (id) => {
    if (!claimedQuests || !claimedQuests[id]) return false;
    return new Date(claimedQuests[id]).toDateString() === new Date().toDateString();
  };

  const triggerReward = (amount, e, id, title) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const bankRect = document.getElementById('bank-hero')?.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const tx = bankRect ? (bankRect.left + bankRect.width / 2) - startX : 0;
    const ty = bankRect ? (bankRect.top + bankRect.height / 2) - startY : -400;

    setFlyingCoins(prev => [...prev, { id: Math.random(), amount, startX, startY, tx, ty }]);
    handleClaim(amount, id, title);
    setTimeout(() => setFlyingCoins(prev => prev.slice(1)), 800);
  };

  const formatMinSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const readReward = Math.floor(readTime / 600) * 10;
  const walkReward = Math.floor(walkTime / 60);

  // --- MINDFULNESS HANDLERS ---
  const startMindfulness = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed: ", e));
      setMindStatus('playing');
    }
  };

  const cancelMindfulness = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setMindStatus('idle');
    setMindProgress(0);
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setMindProgress(progress);
    }
  };

  const handleAudioEnded = () => {
    setMindStatus('finished');
    setMindProgress(100);
  };

  const claimMindfulness = (e) => {
    triggerReward(currentSong.reward, e, `mind_${currentSong.id}_${Date.now()}`, currentSong.title);
    setMindStatus('idle');
    setMindProgress(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 pb-12">
      {flyingCoins.map(c => <FlyingCoin key={c.id} coin={c} />)}

      {/* --- BANK HERO --- */}
      <div className="px-2 sm:px-4 pt-4">
        <div id="bank-hero" className="bg-gradient-to-br from-[#1E293B] to-[#0f172a] rounded-[2.5rem] p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-700/50">
          <div className="absolute -right-6 -top-10 opacity-10 pointer-events-none select-none blur-[1px] rotate-12">
            <PremiumEmoji emoji="💳" className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs drop-shadow-sm mt-1">Ditt saldo</h2>
              {bankStreak > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse border border-orange-400/50 flex items-center gap-1.5">
                  <span className="drop-shadow-md text-sm">🔥</span>
                  <span>{bankStreak} {bankStreak === 1 ? 'Dags' : 'Dagars'} Streak!</span>
                </div>
              )}
            </div>
            <div className="text-5xl sm:text-6xl font-black text-white font-clock tabular-nums tracking-tight flex items-baseline gap-2 drop-shadow-md mt-1">
              {bankBalance} <span className="text-xl sm:text-2xl text-slate-400 font-sans tracking-wide">kr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 px-4 mb-2">
        <PremiumEmoji emoji="⏳" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Aktiva Uppdrag</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 px-2 sm:px-4">
        
        {/* --- LÄS-KORT --- */}
        <div className={`relative bg-white rounded-[2.5rem] border transition-all overflow-hidden ${isReading ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-100 shadow-sm'}`}>
          <div className="absolute inset-y-0 right-0 w-3/4 bg-cover bg-right opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative flex-shrink-0 bg-white rounded-full shadow-sm">
                <TimerRing percentage={(readTime % 600) / 6} color="#3b82f6" />
                <div className="absolute inset-0 flex items-center justify-center"><PremiumEmoji emoji="📖" className="w-8 h-8" /></div>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-xl tracking-tight">Läs en bok</h3>
                <p className="text-slate-600 font-bold text-xs">10 kr per 10 minuter</p>
                <div className="mt-1 text-2xl font-black text-slate-800 font-clock">{formatMinSec(readTime)}</div>
              </div>
              <button onClick={() => setIsReading(!isReading)} className={`px-5 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm ${isReading ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white active:scale-95'}`}>{isReading ? 'Pausa' : 'Starta'}</button>
            </div>
            {readTime > 0 && !isReading && (
              <button onClick={(e) => { triggerReward(readReward, e, 'read', 'Läsning'); setReadTime(0); }} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform">Hämta {readReward} kr</button>
            )}
            {showReadPrompt && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center animate-pulse">
                <p className="font-black text-yellow-800 text-xs uppercase mb-2">Läser du fortfarande?</p>
                <button onClick={() => setShowReadPrompt(false)} className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-black text-xs uppercase shadow-sm">Ja, jag läser!</button>
              </div>
            )}
          </div>
        </div>

        {/* --- PROMENAD-KORT --- */}
        <div className={`relative bg-white rounded-[2.5rem] border transition-all overflow-hidden ${isWalking ? 'border-green-300 ring-4 ring-green-50' : 'border-slate-100 shadow-sm'}`}>
          <div className="absolute inset-y-0 right-0 w-3/4 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative flex-shrink-0 bg-white rounded-full shadow-sm">
                <TimerRing percentage={(walkTime % 60) * 1.66} color="#10b981" />
                <div className="absolute inset-0 flex items-center justify-center"><PremiumEmoji emoji="🏃‍♂️" className="w-8 h-8" /></div>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-xl tracking-tight">Ta en promenad</h3>
                <p className="text-slate-600 font-bold text-xs">1 kr per minut</p>
                <div className="mt-1 text-2xl font-black text-slate-800 font-clock">{formatMinSec(walkTime)}</div>
              </div>
              <button onClick={() => setIsWalking(!isWalking)} className={`px-5 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm ${isWalking ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white active:scale-95'}`}>{isWalking ? 'Pausa' : 'Starta'}</button>
            </div>
            {walkTime > 0 && !isWalking && (
              <button onClick={(e) => { triggerReward(walkReward, e, 'walk', 'Promenad'); setWalkTime(0); }} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform">Hämta {walkReward} kr</button>
            )}
          </div>
        </div>

        {/* --- MINDFULNESS-KORT (PREMIUM NY DESIGN) --- */}
        <div className={`relative bg-white rounded-[2.5rem] border transition-all overflow-hidden ${mindStatus === 'playing' ? 'border-purple-300 ring-4 ring-purple-50' : mindStatus === 'finished' ? 'border-emerald-300 ring-4 ring-emerald-50' : 'border-slate-100 shadow-sm'}`}>
          <div className="absolute inset-y-0 right-0 w-3/4 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&q=80&w=800')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
          
          <div className="relative z-10 p-5 flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative flex-shrink-0 bg-white rounded-full shadow-sm">
                <TimerRing percentage={mindProgress} color={mindStatus === 'finished' ? "#10b981" : "#8b5cf6"} />
                <div className="absolute inset-0 flex items-center justify-center"><PremiumEmoji emoji="🧘‍♂️" className="w-8 h-8" /></div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-xl tracking-tight leading-none mb-1">Mindfulness</h3>
                {mindStatus === 'idle' ? (
                  <p className="text-slate-600 font-bold text-xs">Slappna av & tjäna {currentSong.reward} kr</p>
                ) : (
                  <div className="mt-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold w-max shadow-sm">
                    Låten "{currentSong.title}" spelas...
                  </div>
                )}
              </div>
              
              {/* START/AVBRYT KNAPP LÄNGST TILL HÖGER */}
              {mindStatus === 'idle' && (
                <button onClick={startMindfulness} className="px-5 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest bg-purple-600 text-white shadow-sm active:scale-95 transition-transform">
                   Starta
                </button>
              )}
              {mindStatus === 'playing' && (
                <button onClick={cancelMindfulness} className="px-5 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 shadow-sm active:scale-95 transition-transform">
                   Avbryt
                </button>
              )}
            </div>

            <audio 
              ref={audioRef} 
              src={currentSong.url} 
              onTimeUpdate={handleAudioTimeUpdate} 
              onEnded={handleAudioEnded}
            />

            {/* DE NYA PREMIUM-CHIPSEN (Visas bara när man kan välja låt) */}
            {mindStatus === 'idle' && (
              <div className="mt-6">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Välj Låt</p>
                <div className="flex overflow-x-auto gap-2 pb-2 snap-x hide-scrollbar">
                  {mindfulnessSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSongId(song.id)}
                      className={`flex-shrink-0 snap-start px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all ${
                        selectedSongId === song.id 
                        ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {song.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* HÄMTA BELÖNING (Pulsande) */}
            {mindStatus === 'finished' && (
              <div className="mt-5">
                <button onClick={claimMindfulness} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-transform animate-bounce">
                  ✨ Hämta {currentSong.reward} kr ✨
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* --- DAGENS UPPDRAG --- */}
      <div className="flex items-center gap-2 pt-6 px-4 mb-2">
        <PremiumEmoji emoji="🎯" className="w-6 h-6" />
        <h3 className="text-[#8ba3b8] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">Dagens Uppdrag</h3>
      </div>

      <div className="space-y-3 px-2 sm:px-4">
        {quests.map(q => {
          const done = q.type === 'simple' ? isDone(q.id) : q.tasks.every(t => isDone(t.id));
          const totalReward = q.type === 'checklist' ? q.tasks.reduce((sum, t) => sum + t.reward, 0) : q.reward;

          return (
            <div key={q.id} className={`bg-white rounded-[1.5rem] border transition-all duration-200 ${done ? 'opacity-60 grayscale-[30%] shadow-none border-slate-100' : 'shadow-sm hover:shadow-md border-slate-200'}`}>
              <div 
                className="p-3 sm:p-4 flex items-center justify-between cursor-pointer" 
                onClick={() => q.type === 'checklist' && setExpandedQuest(expandedQuest === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#f8fafc]"><PremiumEmoji emoji={q.icon} className="w-10 h-10" /></div>
                  <div className="flex flex-col">
                    <h4 className={`font-black text-sm sm:text-base ${done ? 'text-slate-400 line-through' : 'text-[#1E293B]'}`}>{q.title}</h4>
                    {q.type === 'checklist' && !done && (
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{q.tasks.length} delmoment</p>
                    )}
                    {done && <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">✅ Klar för idag</p>}
                  </div>
                </div>
                
                {q.type === 'simple' ? (
                  <button 
                    disabled={done} 
                    onClick={(e) => {
                      if(q.id === 'q12') window.open('https://spotify.com', '_blank');
                      triggerReward(q.reward, e, q.id, q.title);
                    }} 
                    className={`px-4 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest ${done ? 'bg-slate-100 text-slate-400' : 'bg-[#dcfce7] text-[#059669] shadow-sm active:scale-95 transition-transform'}`}
                  >
                    {done ? 'Hämtad' : `+${q.reward} kr`}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 pr-2">
                    {!done && (
                      <span className="bg-emerald-50 text-emerald-600 font-black px-3 py-1.5 rounded-full text-[10px] uppercase whitespace-nowrap border border-emerald-200 shadow-sm hidden sm:block">
                        Upp till +{totalReward} kr
                      </span>
                    )}
                    {!done && (
                      <span className="bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded-full text-[10px] uppercase whitespace-nowrap border border-emerald-200 shadow-sm sm:hidden">
                        Max {totalReward} kr
                      </span>
                    )}
                    
                    {/* Snygg pil istället för texten "V" */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${expandedQuest === q.id ? 'bg-slate-800 text-white rotate-180 shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              <AnimatePresence>
                {q.type === 'checklist' && expandedQuest === q.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/80 rounded-b-[1.5rem] border-t border-slate-100 px-4 pb-4">
                    <div className="pt-4 space-y-2">
                      {q.tasks.map(t => {
                        const tDone = isDone(t.id);
                        return (
                          <div key={t.id} className={`flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-colors ${tDone ? 'opacity-50' : ''}`}>
                            <span className={`text-xs font-bold ${tDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.text}</span>
                            <button disabled={tDone} onClick={(e) => triggerReward(t.reward, e, t.id, t.text)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${tDone ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500 text-white active:scale-95 transition-transform'}`}>
                                {tDone ? 'Klar' : `+${t.reward} kr`}
                            </button>
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
      
      {/* Litet hack för att gömma en default-scroll i tailwind */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default EarnTab;