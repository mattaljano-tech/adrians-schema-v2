import React from 'react';
import { motion } from 'framer-motion';

const SchemaTab = ({ activities, currentTime, dailyMessage, adminName, onNavigateToEarn }) => {
  const now = currentTime.getTime();
  
  // Sortera ut det som händer idag och framåt
  const activeAndFuture = activities.filter(a => a.endTime > now && (a.startTime - now) < 24 * 60 * 60 * 1000);
  
  // --- SKAPA TIMELINE MED FRITIDS-LUCKOR MELLAN AKTIVITETERNA ---
  const timeline = [];
  for (let i = 0; i < activeAndFuture.length; i++) {
    timeline.push(activeAndFuture[i]);
    
    // Kolla om det finns ett glapp till NÄSTA aktivitet
    if (i < activeAndFuture.length - 1) {
      const currentEvent = activeAndFuture[i];
      const nextEvent = activeAndFuture[i + 1];
      const gapMs = nextEvent.startTime - currentEvent.endTime;
      
      // Om det är mer än 5 minuters glapp, lägg in en Fritids-lucka
      if (gapMs >= 5 * 60000) { 
        timeline.push({
          id: `gap-${currentEvent.id}`,
          title: 'Välj ett uppdrag 🎯',
          startTime: currentEvent.endTime,
          endTime: nextEvent.startTime,
          duration: Math.round(gapMs / 60000),
          isGap: true
        });
      }
    }
  }

  // Hitta vad som händer exakt just nu
  const current = activeAndFuture.find(a => a.startTime <= now && a.endTime > now);
  
  // Hitta framtiden (inklusive de nya luckorna)
  const future = timeline.filter(a => a.startTime > now);
  
  // Hitta NÄSTA RIKTIGA grej (för att kunna räkna ner fritiden i toppen)
  const nextRealActivity = activeAndFuture.find(a => a.startTime > now);

  const getRem = (targetTime) => {
    const diff = targetTime - now;
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return { 
      h: Math.floor(diff / 3600000), 
      m: Math.floor((diff / 60000) % 60), 
      s: Math.floor((diff / 1000) % 60) 
    };
  };

  const pad = (n) => String(n).padStart(2, '0');

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} tim` : `${h} h ${m} m`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-8 pb-12"
    >
      {/* DAGENS MEDDELANDE */}
      {dailyMessage && (
        <div className="bg-blue-50 border-4 border-blue-200 rounded-[2.5rem] p-6 flex flex-col items-center gap-3 shadow-sm relative overflow-hidden text-center">
          <div className="text-5xl absolute -left-4 -top-4 opacity-20">💬</div>
          <div className="text-4xl relative z-10">💬</div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-1">{adminName || 'En hälsning'} säger:</p>
            <p className="text-xl font-bold text-slate-800">{dailyMessage}</p>
          </div>
        </div>
      )}

      {/* VAD HÄNDER JUST NU? (ELLER FRITID) */}
      {current ? (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-4 border-blue-200 shadow-md flex flex-col items-center relative z-20 w-full overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest shadow-sm mb-4">
            Just nu
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 uppercase text-center leading-tight">
            {current.title}
          </h2>
          
          <div className="w-full bg-slate-50 p-6 rounded-[1.5rem] border-2 border-slate-200 flex flex-col items-center shadow-inner">
            <div className="text-slate-400 font-black uppercase text-[10px] mb-2 text-center">Tid kvar</div>
            <div className="flex items-baseline justify-center gap-2 font-black text-5xl sm:text-6xl text-slate-800">
              {getRem(current.endTime).h > 0 && (
                <><span>{pad(getRem(current.endTime).h)}</span><span className="text-slate-300 text-3xl">:</span></>
              )}
              <span>{pad(getRem(current.endTime).m)}</span>
              <span className="text-slate-300 text-3xl">:</span>
              <span className="text-blue-600">{pad(getRem(current.endTime).s)}</span>
            </div>
            <div className="mt-4 text-slate-500 font-bold text-xs uppercase tracking-widest">
              Klar kl {new Date(current.endTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        </div>
      ) : (
        /* HUVUD-FRITIDSRUTAN I TOPPEN */
        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="flex gap-6 mb-8 relative z-10">
            <div className="w-16 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center transform -rotate-6 shadow-lg text-3xl">🎯</div>
            <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center transform rotate-12 shadow-lg text-3xl">💰</div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 uppercase mb-4">Fritid!</h2>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Perfekt läge att göra ett uppdrag och tjäna pengar!</p>

          {nextRealActivity && (
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner w-full flex flex-col items-center mt-2 mb-6">
              <span className="text-slate-400 font-black uppercase text-[10px] mb-2 tracking-widest">Tid kvar till nästa sak i schemat</span>
              <div className="flex items-baseline gap-1 font-black text-4xl sm:text-5xl text-slate-700">
                {getRem(nextRealActivity.startTime).h > 0 && <><span className="leading-none">{pad(getRem(nextRealActivity.startTime).h)}</span><span className="text-slate-300 text-2xl">:</span></>}
                <span className="leading-none">{pad(getRem(nextRealActivity.startTime).m)}</span>
                <span className="text-slate-300 text-2xl">:</span>
                <span className="leading-none">{pad(getRem(nextRealActivity.startTime).s)}</span>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateToEarn}
            className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm sm:text-base shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            Gå till Uppdrag
          </motion.button>
        </div>
      )}

      {/* VAD HÄNDER SEN? (Kommande uppdrag & Fritidsluckor) */}
      {future.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-xs text-center border-b-2 border-slate-200 pb-2">
            Det som händer sen...
          </h3>
          <div className="space-y-3">
            {future.map((a) => {
              
              // --- OM DET ÄR EN LÅNG FRITIDSLUCKA ---
              if (a.isGap) {
                return (
                  <motion.div 
                    key={a.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNavigateToEarn}
                    className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-[1.5rem] p-4 flex items-center gap-4 cursor-pointer hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                    <div className="text-3xl drop-shadow-sm ml-2">🎯</div>
                    <div className="flex-1">
                      <div className="font-black text-emerald-800 uppercase text-sm">Fritid! ({formatDuration(a.duration)})</div>
                      <div className="font-bold text-emerald-600 text-[10px] uppercase tracking-widest mt-0.5">Klicka här för att tjäna pengar</div>
                    </div>
                    <div className="text-emerald-400 mr-2">▶</div>
                  </motion.div>
                );
              }

              // --- OM DET ÄR ETT VANLIGT SCHEMA-UPPDRAG (Stilren P&P Design) ---
              return (
                <div key={a.id} className="bg-white rounded-[1.5rem] border border-slate-200 p-4 flex items-center shadow-sm">
                  
                  {/* Vänster: Tid & Längd */}
                  <div className="flex flex-col items-center justify-center min-w-[65px] border-r border-slate-200 pr-4 mr-4">
                    <span className="font-black text-lg text-slate-800">
                      {new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className="font-black text-[9px] uppercase tracking-widest text-slate-400 mt-1">
                      {formatDuration(a.duration)}
                    </span>
                  </div>
                  
                  {/* Höger: Rubrik */}
                  <div className="flex-1">
                    <span className="font-black text-[16px] uppercase text-slate-800 tracking-wide">
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