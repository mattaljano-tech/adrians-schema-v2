import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- VISUELL TIME TIMER (FIXAD!) ---
const VisualTimer = ({ totalMs, remainingMs }) => {
  const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  
  // Rätt matte för SVG Pie Chart: 
  // Om r=25 och strokeWidth=50, fyller linjen exakt från mitten (0) ut till kanten (50) av en 100x100 ruta.
  const radius = 25; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    // Yttre behållare som garanterar att den är rund med en lyxig ram
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center rounded-full bg-white border-[4px] border-slate-100 shadow-[inset_0_4px_10px_rgba(0,0,0,0.05)] overflow-hidden">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        
        {/* Vit bakgrund (tavlan) */}
        <circle cx="50" cy="50" r="50" fill="white" />
        
        {/* Den röda tids-ytan som minskar */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#ef4444" /* Röd färg (Time Timer standard) */
          strokeWidth="50" /* Måste vara dubbla radien för att nå centrum */
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
        
        {/* Mitten-prick för att se ut som en klocka */}
        <circle cx="50" cy="50" r="4" fill="#1e293b" />
      </svg>
    </div>
  );
};

const SchemaTab = ({ activities, currentTime, dailyMessage, adminName, onNavigateToEarn }) => {
  const [now, setNow] = useState(currentTime.getTime());

  // Uppdatera "now" för att få en jämn nedräkning
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
          title: 'Ledig tid (Fritid)',
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
  const getRemMins = (targetTime) => Math.ceil(getRemMs(targetTime) / 60000);

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} minuter`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} timmar` : `${h} timmar och ${m} min`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12"
    >
      {/* --- DAGENS MEDDELANDE --- */}
      {dailyMessage && (
        <div className="bg-[#f0f9ff] rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <div className="text-3xl select-none">💬</div>
          <div>
            <p className="text-slate-500 font-bold text-xs mb-1">{adminName || 'Hälsning'} säger:</p>
            <p className="text-lg font-bold text-slate-800 leading-snug">{dailyMessage}</p>
          </div>
        </div>
      )}

      {/* --- VAD HÄNDER JUST NU? --- */}
      {current ? (
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center relative z-20 w-full">
          <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-xs mb-4">
            Just nu
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-6 text-center">
            {current.title}
          </h2>
          
          <div className="flex flex-col items-center bg-slate-50 w-full p-6 rounded-3xl border border-slate-100">
            {/* Visual Time Timer istället för abstrakta siffror */}
            <VisualTimer 
              totalMs={current.duration * 60000} 
              remainingMs={getRemMs(current.endTime)} 
            />
            
            <p className="text-slate-600 font-bold text-lg mt-5">
              {getRemMins(current.endTime)} minuter kvar
            </p>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Klar kl. {new Date(current.endTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
            </p>
          </div>
        </div>
      ) : (
        /* --- LEDIG TID (GAP) --- */
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4">
            <span className="text-5xl">🎯</span>
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">Ledig tid</h2>
          <p className="text-slate-500 font-medium text-sm max-w-[250px] leading-relaxed mb-6">
            Inget är inplanerat. Vill du göra ett uppdrag och tjäna lite extra pengar?
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNavigateToEarn}
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-sm transition-all"
          >
            Visa uppdrag
          </motion.button>

          {nextRealActivity && (
            <div className="mt-8 pt-6 border-t border-slate-100 w-full">
              <p className="text-slate-500 font-bold text-xs mb-4">Tid kvar till nästa sak:</p>
              <div className="flex justify-center items-center gap-5">
                <VisualTimer 
                  totalMs={(nextRealActivity.startTime - now) || (60 * 60000)}
                  remainingMs={getRemMs(nextRealActivity.startTime)} 
                />
                <div className="text-left">
                  <p className="text-xl font-black text-slate-800">{nextRealActivity.title}</p>
                  <p className="text-slate-500 font-bold">{getRemMins(nextRealActivity.startTime)} min kvar</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- VAD HÄNDER SEN? (FRAMTID) --- */}
      {future.length > 0 && (
        <div className="pt-4">
          <h3 className="text-slate-400 font-bold text-xs mb-4 px-2">Senare idag</h3>
          
          <div className="space-y-3">
            {future.map((a) => {
              // Fritidslucka
              if (a.isGap) {
                return (
                  <motion.div 
                    key={a.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onNavigateToEarn}
                    className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
                  >
                    <div className="text-2xl">🎯</div>
                    <div className="flex-1">
                      <div className="font-bold text-blue-800">{a.title}</div>
                      <div className="font-medium text-blue-600/80 text-xs mt-0.5">Cirka {formatDuration(a.duration)}</div>
                    </div>
                  </motion.div>
                );
              }

              // Vanligt uppdrag i schemat
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center shadow-sm">
                  {/* Tid till vänster */}
                  <div className="flex flex-col items-center justify-center min-w-[65px] border-r border-slate-100 pr-4 mr-4">
                    <span className="font-black text-lg text-slate-700">
                      {new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className="font-medium text-[10px] text-slate-400">
                      {formatDuration(a.duration)}
                    </span>
                  </div>
                  
                  {/* Titel till höger */}
                  <div className="flex-1">
                    <span className="font-bold text-base text-slate-800">
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