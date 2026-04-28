import React from 'react';
import { motion } from 'framer-motion';

const SchemaTab = ({ activities, currentTime, dailyMessage, adminName, onNavigateToEarn }) => {
  const now = currentTime.getTime();
  
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
          title: 'Fritid! Passa på att göra uppdrag',
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-8 pb-12"
    >
      {/* DAGENS MEDDELANDE (PREMIUM) */}
      {dailyMessage && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col items-center text-center">
          <div className="text-4xl relative z-10 mb-2 drop-shadow-sm">💬</div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">{adminName || 'En hälsning'} säger:</p>
            <p className="text-xl font-bold text-slate-800 leading-snug">{dailyMessage}</p>
          </div>
        </div>
      )}

      {/* VAD HÄNDER JUST NU? (PREMIUM) */}
      {current ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-col items-center relative z-20 w-full">
          <div className="bg-slate-900 text-white px-5 py-1.5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] mb-6 shadow-sm">
            Händer just nu
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-8 uppercase text-center tracking-tight">
            {current.title}
          </h2>
          
          <div className="w-full bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center">
            <div className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-3">Tid kvar</div>
            <div className="flex items-baseline justify-center gap-2 font-black text-5xl sm:text-6xl text-slate-800 font-clock tabular-nums tracking-tight">
              {getRem(current.endTime).h > 0 && (
                <><span>{pad(getRem(current.endTime).h)}</span><span className="text-slate-300 font-sans font-light -mt-2">:</span></>
              )}
              <span>{pad(getRem(current.endTime).m)}</span>
              <span className="text-slate-300 font-sans font-light -mt-2">:</span>
              <span className="text-blue-500">{pad(getRem(current.endTime).s)}</span>
            </div>
            <div className="mt-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
              Klar kl {new Date(current.endTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        </div>
      ) : (
        /* HUVUD-FRITIDSRUTAN I TOPPEN (EXAKT SOM DIN BILD) */
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative">
          <div className="mb-6 drop-shadow-md">
            <span className="text-6xl">🎯</span>
          </div>
          
          <h2 className="text-3xl font-black text-[#1E293B] uppercase tracking-tight mb-3">Fritid!</h2>
          <p className="text-slate-500 font-bold text-sm max-w-[250px] leading-relaxed mb-8">
            Du har inget inplanerat just nu. Passa på att göra ett uppdrag för att tjäna pengar!
          </p>

          {nextRealActivity && (
            <div className="w-full mb-8">
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] mb-2 block">Tid kvar till nästa:</span>
              <div className="flex items-baseline justify-center gap-1 font-black text-3xl text-slate-300 font-clock tabular-nums">
                {getRem(nextRealActivity.startTime).h > 0 && <><span className="text-slate-700">{pad(getRem(nextRealActivity.startTime).h)}</span><span className="font-sans font-light">:</span></>}
                <span className="text-slate-700">{pad(getRem(nextRealActivity.startTime).m)}</span>
                <span className="font-sans font-light">:</span>
                <span className="text-slate-400">{pad(getRem(nextRealActivity.startTime).s)}</span>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNavigateToEarn}
            className="w-full bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <span>Gå till Uppdrag</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
      )}

      {/* VAD HÄNDER SEN? (PREMIUM LISTA) */}
      {future.length > 0 && (
        <div className="pt-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
              Det som händer sen...
            </h3>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>
          
          <div className="space-y-4">
            {future.map((a) => {
              
              // --- PREMIUM FRITIDSLUCKA MED RIKTIG SVG-PIL ---
              if (a.isGap) {
                return (
                  <motion.div 
                    key={a.id}
                    whileHover={{ scale: 1.01, backgroundColor: "#ecfdf5" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNavigateToEarn}
                    className="group bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-5 flex items-center gap-4 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="text-2xl ml-1">🎯</div>
                    <div className="flex-1">
                      <div className="font-black text-emerald-700 uppercase tracking-wide text-sm">{a.title}</div>
                      <div className="font-bold text-emerald-500/80 text-[10px] uppercase tracking-widest mt-1">Längd: {formatDuration(a.duration)}</div>
                    </div>
                    {/* ÄKTA PREMIUM-PIL INSTÄLLET FÖR TEXT-SYMBOL */}
                    <div className="mr-2 text-emerald-300 group-hover:text-emerald-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                );
              }

              // --- VANLIGT SCHEMA-UPPDRAG (Kopia av din snygga bild) ---
              return (
                <div key={a.id} className="bg-white rounded-[2rem] border border-slate-100 p-5 sm:p-6 flex items-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow">
                  
                  {/* Vänster: Tid & Längd */}
                  <div className="flex flex-col items-center justify-center min-w-[75px] border-r border-slate-100 pr-5 mr-5">
                    <span className="font-black text-[22px] text-slate-700 tracking-tight font-clock">
                      {new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className="font-bold text-[9px] uppercase tracking-[0.15em] text-slate-400 mt-1">
                      {formatDuration(a.duration)}
                    </span>
                  </div>
                  
                  {/* Höger: Rubrik */}
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-black text-[16px] uppercase text-[#1E293B] tracking-wide">
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