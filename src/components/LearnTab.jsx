// --- KALENDER (Premium, rena ikoner, supertydlig dag) ---
const CalendarCard = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const realToday = new Date(); // Dagens faktiska datum

  const monthThemes = [
    { name: "Januari", emoji: "❄️", gradient: "from-blue-400 to-indigo-500" },
    { name: "Februari", emoji: "⛄", gradient: "from-cyan-400 to-blue-500" },
    { name: "Mars", emoji: "🌱", gradient: "from-emerald-400 to-green-500" },
    { name: "April", emoji: "🐣", gradient: "from-green-400 to-lime-500" },
    { name: "Maj", emoji: "🌸", gradient: "from-pink-400 to-rose-500" },
    { name: "Juni", emoji: "🍓", gradient: "from-yellow-400 to-orange-400" },
    { name: "Juli", emoji: "🏖️", gradient: "from-orange-400 to-red-400" },
    { name: "Augusti", emoji: "🍉", gradient: "from-red-400 to-rose-600" },
    { name: "September", emoji: "🍂", gradient: "from-amber-500 to-orange-600" },
    { name: "Oktober", emoji: "🎃", gradient: "from-orange-600 to-red-700" },
    { name: "November", emoji: "🌧️", gradient: "from-slate-400 to-slate-600" },
    { name: "December", emoji: "🎄", gradient: "from-red-500 to-green-600" }
  ];

  const currentMonth = monthThemes[viewDate.getMonth()];
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div className="bg-white rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
      <div className={`bg-gradient-to-br ${currentMonth.gradient} p-6 sm:p-8 flex items-center justify-between relative overflow-hidden`}>
        <div className="absolute -right-4 -bottom-8 opacity-20 transform scale-150 pointer-events-none">
          <PremiumEmoji emoji={currentMonth.emoji} className="w-40 h-40" />
        </div>
        
        {/* Navigering för månader - Premium UI */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevMonth} 
            className="bg-white/20 hover:bg-white/30 p-3 sm:p-4 rounded-full backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center transition-colors"
          >
            {/* Vänsterpil SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </motion.button>

          <div className="text-center px-4">
            <h2 className="text-white/80 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-1">Månad</h2>
            <p className="text-white font-black text-3xl sm:text-4xl tracking-tight leading-none">
              {currentMonth.name} <span className="opacity-80 block text-lg sm:text-xl mt-1">{viewDate.getFullYear()}</span>
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextMonth} 
            className="bg-white/20 hover:bg-white/30 p-3 sm:p-4 rounded-full backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center transition-colors"
          >
            {/* Högerpil SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["M", "T", "O", "T", "F", "L", "S"].map((d, i) => (
            <div key={i} className="text-center text-slate-400 font-black text-[10px]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            // Kontrollera om dagen vi ritar ut är EXAKT dagens datum i verkligheten
            const isToday = 
              day === realToday.getDate() && 
              viewDate.getMonth() === realToday.getMonth() && 
              viewDate.getFullYear() === realToday.getFullYear();

            return (
              <div 
                key={i} 
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl font-black transition-all ${
                  isToday 
                  ? 'bg-[#FDE047] text-black border-[3px] border-black scale-[1.15] z-10 shadow-[0_4px_15px_rgba(250,204,21,0.5)]' 
                  : 'text-slate-500 bg-slate-50 hover:bg-slate-100 text-sm sm:text-base'
                }`}
              >
                <span className={isToday ? "text-2xl sm:text-3xl" : ""}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};