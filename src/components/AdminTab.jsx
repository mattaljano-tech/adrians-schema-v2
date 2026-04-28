import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, CheckCircle2 } from 'lucide-react'; // Importera ikoner från Lucide

const SchemaTab = ({ activities, currentTime, dailyMessage, adminName }) => {
  const now = currentTime.getTime();
  
  // Sortera ut det som händer idag och framåt
  const activeAndFuture = activities.filter(a => a.endTime > now && (a.startTime - now) < 24 * 60 * 60 * 1000);
  
  // Hitta vad som händer exakt just nu
  const current = activeAndFuture.find(a => a.startTime <= now && a.endTime > now);
  // Hitta vad som händer sen
  const future = activeAndFuture.filter(a => a.startTime > now);

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

  // --- NYTT: SMART IKON-GISSARE ---
  // Bildstöd är A och O vid språkstörning och IF
  const getIconForTitle = (title) => {
    const t = title.toLowerCase();
    if (t.includes('frukost') || t.includes('mat') || t.includes('middag') || t.includes('lunch')) return '🍽️';
    if (t.includes('dusch') || t.includes('bada') || t.includes('tvätta')) return '🚿';
    if (t.includes('skola') || t.includes('läxa')) return '🎒';
    if (t.includes('spel') || t.includes('playstation') || t.includes('roblox') || t.includes('teardown')) return '🎮';
    if (t.includes('sova') || t.includes('säng') || t.includes('natt') || t.includes('vila')) return '🛌';
    if (t.includes('läs') || t.includes('bok')) return '📖';
    if (t.includes('tv') || t.includes('film') || t.includes('youtube')) return '📺';
    if (t.includes('träning') || t.includes('gym') || t.includes('sport')) return '🏃‍♂️';
    if (t.includes('medicin') || t.includes('medicinering') || t.includes('tablett')) return '💊';
    return '📌'; // Standard-ikon om ingen matchar
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="space-y-6 pb-20"
    >
      
      {/* DAGENS MEDDELANDE */}
      <AnimatePresence>
        {dailyMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 border-4 border-yellow-200 rounded-[2.5rem] p-5 sm:p-6 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-yellow-400 text-yellow-800 p-3 rounded-2xl shadow-md shrink-0">
                <MessageSquare size={28} />
              </div>
              <div className="flex-1">
                <p className="text-yellow-600 font-black uppercase text-[10px] sm:text-xs tracking-widest mb-0.5">{adminName || 'En hälsning'} säger:</p>
                <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{dailyMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VAD HÄNDER JUST NU? */}
      <AnimatePresence mode="wait">
        {current ? (
          <motion.div 
            key="current-task"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-6 sm:p-8 border-4 border-blue-200 shadow-xl flex flex-col items-center relative overflow-hidden"
          >
            {/* Dekorativ "Glow" i bakgrunden */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <div className="bg-blue-500 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-md mb-6 flex items-center gap-2">
              <Clock size={16} /> Just nu
            </div>
            
            <span className="text-6xl mb-4 drop-shadow-md">{getIconForTitle(current.title)}</span>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-8 uppercase text-center leading-tight tracking-tighter">
              {current.title}
            </h2>
            
            <div className="w-full bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 shadow-inner flex flex-col items-center">
              <div className="text-slate-400 font-black uppercase text-[10px] sm:text-xs mb-3 text-center tracking-widest">
                Tid kvar
              </div>
              
              {/* Klockan */}
              <div className="flex items-baseline justify-center gap-2 font-black text-5xl sm:text-6xl text-slate-800 tabular-nums">
                {getRem(current.endTime).h > 0 && (
                  <><span>{pad(getRem(current.endTime).h)}</span><span className="text-slate-300 text-4xl">:</span></>
                )}
                <span>{pad(getRem(current.endTime).m)}</span>
                <span className="text-slate-300 text-4xl">:</span>
                <span className="text-blue-500">{pad(getRem(current.endTime).s)}</span>
              </div>

              {/* Progress Bar (Visuell hjälp för att se tid passera) */}
              <div className="w-full mt-6">
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-300 shadow-inner">
                  <motion.div 
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ 
                      width: `${((current.endTime - now) / (current.duration * 60000)) * 100}%` 
                    }}
                    transition={{ ease: "linear", duration: 1 }}
                  />
                </div>
              </div>

              <div className="mt-4 bg-white px-4 py-2 rounded-xl text-slate-500 font-black text-[10px] sm:text-xs uppercase tracking-widest border-2 border-slate-200 shadow-sm">
                Klar kl {new Date(current.endTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="free-time"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 sm:p-10 rounded-[3rem] border-4 border-slate-200 shadow-xl flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner border-2 border-emerald-200">
              <span className="text-4xl">🎮</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase mb-3 tracking-tighter">Fritid!</h2>
            <p className="text-slate-500 font-bold text-sm sm:text-base leading-relaxed">
              Inget inplanerat just nu. Passa på att ta det lugnt, eller gör ett uppdrag för att tjäna pengar!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VAD HÄNDER SEN? (Kommande uppdrag) */}
      {future.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-slate-400 font-black uppercase tracking-widest px-4 text-xs sm:text-sm flex items-center gap-2">
            <span className="flex-1 h-1 bg-slate-200 rounded-full"></span>
            Det som händer sen...
            <span className="flex-1 h-1 bg-slate-200 rounded-full"></span>
          </h3>
          
          <div className="space-y-4 pl-2 border-l-4 border-slate-200 ml-6">
            {future.map((a, index) => {
              const isNext = index === 0 && !current; // "Nästa"-aktiviteten om man har fritid
              
              return (
                <div 
                  key={a.id} 
                  className={`p-5 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative transition-all border-4 ${isNext ? 'bg-orange-50 border-orange-200 shadow-md ml-[-24px] z-10' : 'bg-white border-slate-100 shadow-sm ml-[-12px]'}`}
                >
                  
                  {/* Visuell punkt på tidslinjen */}
                  <div className={`absolute top-1/2 -left-[14px] sm:-left-[18px] w-6 h-6 rounded-full border-4 border-white -translate-y-1/2 ${isNext ? 'bg-orange-400 w-8 h-8 -left-[20px]' : 'bg-slate-300'}`}></div>

                  {/* Tid & Längd */}
                  <div className="flex flex-col items-start min-w-[70px]">
                    <span className={`text-xl sm:text-2xl font-black tracking-tighter ${isNext ? 'text-orange-600' : 'text-slate-600'}`}>
                      {new Date(a.startTime).toLocaleTimeString('sv-SE', {hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isNext ? 'text-orange-400' : 'text-slate-400'}`}>
                      {formatDuration(a.duration)}
                    </span>
                  </div>
                  
                  {/* Ikon + Titel */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl drop-shadow-sm">{getIconForTitle(a.title)}</span>
                    <span className={`text-lg sm:text-xl font-black uppercase tracking-tight leading-tight ${isNext ? 'text-orange-800' : 'text-slate-700'}`}>
                      {a.title}
                    </span>
                  </div>

                  {/* Om det är Nästa (isNext): Visa nedräkning */}
                  {isNext && (
                    <div className="bg-white rounded-2xl p-4 border-2 border-orange-100 flex flex-col items-center justify-center gap-1 shadow-sm shrink-0 min-w-[120px]">
                      <span className="font-black uppercase text-orange-400 text-[10px] tracking-widest">Börjar om</span>
                      <div className="font-black text-xl text-orange-600 tabular-nums">
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