import React, { useState, useEffect } from 'react';
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

// --- PREMIUM VISUELL TIMER (Tillbaka till den snygga, men med subtil puls) ---
const PremiumTimer = ({ totalMs, remainingMs, colorStop1 = "#fb7185", colorStop2 = "#e11d48", trackColor = "#f1f5f9" }) => {
  const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const radius = 36; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
      {/* Det pulserande, mjukt färgade skenet bakom ringen */}
      <div className="absolute inset-0 bg-rose-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }}></div>
      
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStop1} />
            <stop offset="100%" stopColor={colorStop2} />
          </linearGradient>
        </defs>

        {/* Bakgrundsspåret */}
        <circle 
          cx="50" cy="50" r={radius} 
          fill="none" 
          stroke={trackColor} 
          strokeWidth="16" 
        />
        
        {/* Den färgade tiden som krymper */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear drop-shadow-md"
        />
      </svg>
    </div>
  );
};

// --- FRISTÅENDE PREMIUM ANALOG KLOCKA ---
const SleekAnalogClock = ({ date }) => {
  const hDeg = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
  const mDeg = date.getMinutes() * 6;
  const sDeg = date.getSeconds() * 6;

  return (
    <div className="flex justify-center mb-6">
      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[6px] border-slate-50 relative flex items-center justify-center">
        {/* Minut-markeringar */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-[2px] h-1.5 bg-slate-300 rounded-full"
            style={{ 
              transform: `rotate(${i * 30}deg) translateY(-12px)`, 
              top: '50%' 
            }}
          />
        ))}

        {/* Timvisare */}
        <div 
          className="absolute w-1.5 h-[25%] bg-slate-800 rounded-full origin-bottom -translate-y-full z-10 transition-transform duration-300" 
          style={{ transform: `rotate(${hDeg}deg) translateY(-100%)`, top: '50%' }}
        />
        {/* Minutvisare */}
        <div 
          className="absolute w-1 h-[35%] bg-blue-500 rounded-full origin-bottom -translate-y-full z-10 transition-transform duration-300" 
          style={{ transform: `rotate(${mDeg}deg) translateY(-100%)`, top: '50%' }}
        />
        {/* Sekundvisare (Svepande röd) */}
        <div 
          className="absolute w-[1.5px] h-[40%] bg-red-400 rounded-full origin-bottom -translate-y-full z-10 transition-transform duration-1000 ease-linear" 
          style={{ transform: `rotate(${sDeg}deg) translateY(-100%)`, top: '50%' }}
        />
        
        {/* Centrum-pluppar */}
        <div className="absolute w-3 h-3 bg-slate-800 rounded-full z-20 shadow-sm" />
        <div className="absolute w-1 h-1 bg-white rounded-full z-30" />
      </div>
    </div>
  );
};

const SchemaTab = ({ activities, currentTime, dailyMessage, adminName, onNavigateToEarn }) => {
  const [now, setNow] = useState(currentTime.getTime());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().getTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAndFuture = activities.filter(a => a.endTime > now && (a.startTime - now) < 24 * 60 * 60 * 1000);
  
  const timeline = [];
  for (let i = 0; i < activeAndFuture.length; i++) {
    timeline.push(activeAndFuture[i]);
    
    if (i < activeAndFuture.length - 1) {
      const currentEvent = activeAndFuture[i];
      const nextEvent = activeAndFuture[i + 1];
      const gapMs = nextEvent.startTime - currentEvent.endTime;
      
      if (gapMs >= 5 * 60000) { 
        timeline.push({
          id: `gap-${currentEvent.id}`,
          title: 'Välj ett uppdrag för att tjäna pengar',
          startTime: currentEvent.endTime,
          endTime: nextEvent.startTime,
          duration: Math.round(gapMs / 60000),
          isGap: true
        });
      }
    }
  }

  const current = activeAndFuture.find(a => a.startTime <= now && a.endTime > now);
  const future = timeline.filter(a => a.startTime > now);
  const nextRealActivity = activeAndFuture.find(a => a.startTime > now);

  const getRemMs = (targetTime) => Math.max(0, targetTime - now);
  
  const formatTimeLeft = (targetTime) => {
    const diffMs = getRemMs(targetTime);
    const totalMins = Math.ceil(diffMs / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    
    if (h > 0) {
      if (m === 0) return `${h} timmar kvar`;
      return `${h} tim och ${m} min kvar`;
    }
    return `${m} minuter kvar`;
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} minuter`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} timmar` : `${h} tim och ${m} min`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12 pt-2"
    >
      {/* --- EGEN PREMIUM KLOCKA HÖGST UPP --- */}
      <SleekAnalogClock date={currentTime} />

      {/* --- DAGENS MEDDELANDE (Premium Bakgrund) --- */}
      {dailyMessage && (
        <div className="relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden flex items-center gap-5">
          {/* Mjuk himmelsbakgrund för citatet */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509803874385-db7c23652552?auto=format&fit=crop&q=80&w=800')" }}
          ></div>
          {/* Vit frostad gradient för läsbarhet */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40"></div>
          
          <div className="relative z-10 text-3xl select-none bg-blue-50/80 backdrop-blur-sm w-14 h-14 rounded-2xl flex items-center justify-center border border-white">
            💬
          </div>
          <div className="relative z-10 flex-1">
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">{adminName || 'Hälsning'}</p>
            <p className="text-[17px] font-bold text-slate-800 leading-snug drop-shadow-sm">{dailyMessage}</p>
          </div>
        </div>
      )}

      {/* --- VAD HÄNDER JUST NU? (Clean White Card) --- */}
      {current ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.05)] border border-slate-50 relative overflow-hidden flex flex-col items-center">
          {/* Vacker, subtil blå glöd i bakgrunden istället för bild */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full opacity-60 pointer-events-none"></div>

          <div className="relative z-10 w-full p-8 flex flex-col items-center">
            
            <div className="bg-blue-50 text-blue-600 px-5 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm mb-6 border border-blue-100">
              Händer just nu
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-8 text-center leading-tight">
              {current.title}
            </h2>
            
            <div className="relative w-full flex flex-col items-center">
              <PremiumTimer 
                totalMs={current.duration * 60000} 
                remainingMs={getRemMs(current.endTime)} 
                colorStop1="#fb7185" 
                colorStop2="#e11d48"
              />
              
              <div className="mt-8 text-center">
                <p className="text-slate-800 font-black text-xl sm:text-2xl mb-1">
                  {formatTimeLeft(current.endTime)}
                </p>
                <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                  Klar kl. {new Date(current.endTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- LEDIG TID KORTET (Clean White Card) --- */
        <div className="bg-white rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.05)] border border-slate-50 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-50 rounded-br-full opacity-60 pointer-events-none"></div>

          <div className="relative z-10 w-full p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
              <span className="text-4xl">🎯</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-6">
              Välj ett uppdrag för att tjäna pengar
            </h2>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNavigateToEarn}
              className="w-full bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
            >
              Visa uppdrag
            </motion.button>

            {nextRealActivity && (
              <div className="mt-10 pt-6 border-t border-slate-100 w-full">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-4">Ditt nästa inplanerade pass</p>
                
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-5 border border-slate-100">
                  <div className="w-16 h-16 flex-shrink-0">
                    <PremiumTimer 
                      totalMs={(nextRealActivity.startTime - (current?.endTime || now)) || (60 * 60000)}
                      remainingMs={getRemMs(nextRealActivity.startTime)} 
                      colorStop1="#60a5fa" 
                      colorStop2="#3b82f6"
                      trackColor="#e2e8f0"
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-lg font-black text-slate-800 mb-0.5">{nextRealActivity.title}</p>
                    <p className="text-slate-500 font-bold text-xs">{formatTimeLeft(nextRealActivity.startTime)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VAD HÄNDER SEN? --- */}
      {future.length > 0 && (
        <div className="pt-6">
          <div className="flex items-center gap-3 mb-5 px-2">
            <div className="h-[2px] w-6 bg-slate-200 rounded-full"></div>
            <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Senare idag</h3>
          </div>
          
          <div className="space-y-3">
            {future.map((a) => {
              if (a.isGap) {
                return (
                  <motion.div 
                    key={a.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onNavigateToEarn}
                    className="bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] p-4 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="text-2xl ml-1">🎯</div>
                    <div className="flex-1">
                      <div className="font-black text-emerald-800 text-sm sm:text-base leading-tight">{a.title}</div>
                      <div className="font-bold text-emerald-600/80 text-[11px] mt-1">Cirka {formatDuration(a.duration)}</div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <div key={a.id} className="bg-white rounded-[1.5rem] border border-slate-100 p-4 sm:p-5 flex items-center shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-100 pr-5 mr-5">
                    <span className="font-black text-[20px] text-slate-800 leading-none">
                      {new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mt-1.5">
                      {formatDuration(a.duration)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <span className="font-black text-[16px] text-slate-800">
                      {a.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SchemaTab;