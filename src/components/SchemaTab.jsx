import React from 'react';
import { motion } from 'framer-motion';

const SchemaTab = ({ activities, currentTime, dailyMessage, adminName, onNavigateToEarn }) => {
  const now = currentTime.getTime();
  
  // Sortera ut det som händer idag och framåt
  const activeAndFuture = activities.filter(a => a.endTime > now && (a.startTime - now) < 24 * 60 * 60 * 1000);
  
  // Hitta vad som händer exakt just nu
  const current = activeAndFuture.find(a => a.startTime <= now && a.endTime > now);
  
  // Hitta vad som händer sen
  const future = activeAndFuture.filter(a => a.startTime > now);
  
  // Hitta nästa grej (för att kunna räkna ner fritiden)
  const nextActivity = future.length > 0 ? future[0] : null;

  // Hjälpfunktion för nedräkning
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

  // Hjälpfunktion för att visa hur lång tid något tar
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
        /* --- HÄR ÄR DEN NYA FRITIDS-RUTAN --- */
        <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="flex gap-6 mb-8 relative z-10">
            <div className="w-16 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center transform -rotate-6 shadow-lg text-3xl">🎯</div>
            <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center transform rotate-12 shadow-lg text-3xl">💰</div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 uppercase mb-4">Fritid!</h2>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Perfekt läge att välja ett uppdrag och tjäna pengar!</p>

          {/* Räkna ner till nästa uppdrag i schemat (om det finns något) */}
          {nextActivity && (
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner w-full flex flex-col items-center mt-2 mb-6">
              <span className="text-slate-400 font-black uppercase text-[10px] mb-2 tracking-widest">Tid kvar till nästa sak i schemat</span>
              <div className="flex items-baseline gap-1 font-black text-4xl sm:text-5xl text-slate-700">
                {getRem(nextActivity.startTime).h > 0 && <><span className="leading-none">{pad(getRem(nextActivity.startTime).h)}</span><span className="text-slate-300 text-2xl">:</span></>}
                <span className="leading-none">{pad(getRem(nextActivity.startTime).m)}</span>
                <span className="text-slate-300 text-2xl">:</span>
                <span className="leading-none">{pad(getRem(nextActivity.startTime).s)}</span>
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

      {/* VAD HÄNDER SEN? (Kommande uppdrag) */}
      {future.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-xs text-center border-b-2 border-slate-200 pb-2">
            Det som händer sen...
          </h3>
          <div className="space-y-3">
            {future.map((a, index) => {
              const isNext = index === 0 && !current; // Om det inte finns en "current", markera första som "Nästa"
              
              return (
                <div key={a.id} className={`p-5 rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-4 transition-all border-2 ${isNext ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                  
                  <div className={`flex flex-col items-center min-w-[70px] border-b-2 sm:border-b-0 sm:border-r-2 pb-3 sm:pb-0 sm:pr-4 ${isNext ? 'border-orange-200' : 'border-slate-100'}`}>
                    <span className={`text-xl font-black ${isNext ? 'text-orange-600' : 'text-slate-600'}`}>
                      {new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isNext ? 'text-orange-400' : 'text-slate-400'}`}>
                      {formatDuration(a.duration)}
                    </span>
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <span className={`text-lg font-black uppercase ${isNext ? 'text-orange-800' : 'text-slate-700'}`}>
                      {a.title}
                    </span>
                  </div>

                  {isNext && (
                    <div className="bg-white rounded-xl p-3 border-2 border-orange-100 flex items-center justify-between gap-3 text-center sm:text-right">
                      <span className="font-black uppercase text-orange-400 text-[10px] tracking-widest">Börjar om:</span>
                      <div className="font-black text-xl text-orange-600">
                        {getRem(a.startTime).h > 0 ? `${pad(getRem(a.startTime).h)}:` : ''}{pad(getRem(a.startTime).m)}:{pad(getRem(a.startTime).s)}
                      </div>
                    </div>
                  )}

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