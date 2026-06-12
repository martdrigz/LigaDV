import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Position, Match } from '../types';
import { X, Shield, Trophy, Activity, Target, Zap, ShieldCheck, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface PlayerDetailCardProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  matches: Match[];
}

export function PlayerDetailCard({ isOpen, onClose, player, matches }: PlayerDetailCardProps) {
  if (!player) return null;

  // Calculate detailed stats
  const completedMatches = matches.filter(m => m.status === 'completed');
  
  const bellotti = { pj: 0, vic: 0, e: 0, der: 0, gf: 0, gc: 0 };
  const fluvito = { pj: 0, vic: 0, e: 0, der: 0, gf: 0, gc: 0 };

  const playerMatches = completedMatches
    .filter(m => m.teamA.players.some(p => p.id === player.id) || m.teamB.players.some(p => p.id === player.id))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  completedMatches.forEach(m => {
    const isTeamA = m.teamA.players.some(p => p.id === player.id);
    const isTeamB = m.teamB.players.some(p => p.id === player.id);
    const gA = m.result?.teamAGoals ?? 0;
    const gB = m.result?.teamBGoals ?? 0;

    if (isTeamA) {
      bellotti.pj++;
      bellotti.gf += gA;
      bellotti.gc += gB;
      if (gA > gB) bellotti.vic++;
      else if (gA < gB) bellotti.der++;
      else bellotti.e++;
    } else if (isTeamB) {
      fluvito.pj++;
      fluvito.gf += gB;
      fluvito.gc += gA;
      if (gB > gA) fluvito.vic++;
      else if (gB < gA) fluvito.der++;
      else fluvito.e++;
    }
  });

  const totalPlayed = bellotti.pj + fluvito.pj;
  const totalWins = bellotti.vic + fluvito.vic;
  const totalLosses = bellotti.der + fluvito.der;
  
  // Trend Logic (last 3 matches)
  const lastThree = playerMatches.slice(0, 3);
  let tr: 'up' | 'down' | 'steady' = 'steady';
  if (lastThree.length > 0) {
    let score = 0;
    lastThree.forEach(m => {
        const isTeamA = m.teamA.players.some(p => p.id === player.id);
        const win = isTeamA ? (m.result!.teamAGoals > m.result!.teamBGoals) : (m.result!.teamBGoals > m.result!.teamAGoals);
        const loss = isTeamA ? (m.result!.teamAGoals < m.result!.teamBGoals) : (m.result!.teamBGoals < m.result!.teamAGoals);
        if (win) score++;
        else if (loss) score--;
    });
    if (score > 0) tr = 'up';
    else if (score < 0) tr = 'down';
  }

  // Calculate actual statistics from match history
  const { totalGoals, totalAssists } = matches.reduce((acc, match) => {
    const stats = match.playerStats?.find(s => s.playerId === player.id);
    if (stats) {
      acc.totalGoals += stats.goals || 0;
      acc.totalAssists += stats.assists || 0;
    }
    return acc;
  }, { totalGoals: 0, totalAssists: 0 });

  const effectiveness = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
  
  // High-level derived technical stats
  const goals = totalGoals; 
  const assists = totalAssists; 
  const defScore = Math.round((player.skill * 8) + (player.speed * 2)); 

  const posColors = {
    DEF: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    MED: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    DEL: "text-red-400 border-red-500/30 bg-red-500/5",
    POR: "text-amber-400 border-amber-500/30 bg-amber-500/5"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150 || info.velocity.y > 500) {
                onClose();
              }
            }}
            transition={{ type: 'spring', damping: 35, stiffness: 400, mass: 0.6 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] max-w-2xl mx-auto h-[92vh] flex flex-col shadow-[0_-20px_120px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Drag Handle Area - Absolute Overlay */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-none" style={{ height: 'calc(var(--spacing) * 7)' }}>
              <div className="w-12 h-1 bg-white/20 rounded-full shadow-lg pointer-events-auto" />
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-6 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-colors pointer-events-auto"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Wrapper */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="flex flex-col min-h-full">
                {/* Hero Section - Reaches top edges */}
                <div className="relative h-[410px] md:h-[540px] bg-white/5 overflow-hidden">
                  {player.imageUrl ? (
                    <img 
                      src={player.imageUrl} 
                      alt={player.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <User size={120} strokeWidth={1} />
                    </div>
                  )}
                  
                  {/* Hero Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/20 to-transparent" />
                </div>

                {/* Identity & Stats Section */}
                <div className="px-6 pb-20 -mt-[30px] relative z-10 flex flex-col gap-10">
                  {/* Identity: Number + Name + Header PJ Stats + Trend */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-900 border border-white/10 flex items-center justify-center shadow-2xl flex-none mr-[-8px]">
                      <span className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tighter">
                        {player.number || '00'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-[-12px] pt-[2px] pb-[6px]">
                        <h2 className="text-[28px] font-bold text-white capitalize tracking-tight truncate leading-[24px] pb-[7px] mb-[-8px]">
                            {player.name.toLowerCase()}
                        </h2>
                        <div className="flex-none pt-1">
                            {tr === 'up' && <TrendingUp size={24} className="text-emerald-400" />}
                            {tr === 'down' && <TrendingDown size={24} className="text-red-500" />}
                            {tr === 'steady' && <Activity size={24} className="text-[#eaba3f]" />}
                        </div>
                      </div>
                      
                      {/* Meta Stats Row Seguidos al costado */}
                      <div className="flex items-center gap-3 mt-4 overflow-x-auto no-scrollbar">
                        <div className="flex items-center flex-none">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded border",
                            posColors[player.primaryPos]
                          )}>
                            {player.primaryPos}
                          </span>
                        </div>
                        
                        <div className="h-4 w-px bg-white/10 flex-none" />
                        
                        <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] flex-none">
                           <span className="text-white/20">PJ <span className="text-white font-black ml-0.5 text-[12px]">{totalPlayed}</span></span>
                           <span className="text-emerald-400/30">VIC <span className="text-emerald-400 font-black ml-0.5 text-[12px]">{totalWins}</span></span>
                           <span className="text-red-500/30">DER <span className="text-red-500 font-black ml-0.5 text-[12px]">{totalLosses}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Analysis Matrix */}
                  <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-sm overflow-hidden mt-[-14px]">
                    <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                        <Activity size={18} className="text-[#eaba3f]" />
                        <h3 className="font-bold text-lg tracking-tight text-white font-display">Estadísticas Jugador</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-white/5 overflow-hidden">
                        <div className="bg-[#111111] pt-7 pb-7 pl-8 pr-8 grid grid-cols-1 gap-8 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em] text-[18px]">GOL</span>
                                <span className="text-2xl font-bold text-white transition-transform hover:scale-110 duration-200 cursor-default">{goals.toString().padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em]">ASIT</span>
                                <span className="text-2xl font-bold text-white transition-transform hover:scale-110 duration-200 cursor-default">{assists.toString().padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em]">DEF</span>
                                <span className="text-2xl font-bold text-white transition-transform hover:scale-110 duration-200 cursor-default">{defScore.toString().padStart(2, '0')}</span>
                            </div>
                        </div>

                        <div className="bg-[#111111] pt-7 pb-7 pl-8 pr-8 grid grid-cols-1 gap-8 relative hover:bg-white/[0.02] transition-colors">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-16 bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em]">VIC</span>
                                <span className="text-2xl font-bold text-white transition-transform hover:scale-110 duration-200 cursor-default">{totalWins.toString().padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em]">DER</span>
                                <span className="text-2xl font-bold text-white transition-transform hover:scale-110 duration-200 cursor-default">{totalLosses.toString().padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em]">PJ</span>
                                <span className="text-2xl font-bold text-white transition-transform hover:scale-110 duration-200 cursor-default">{totalPlayed.toString().padStart(2, '0')}</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Team Performance Breakdown */}
                  <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                        <Trophy size={18} className="text-[#eaba3f]" />
                        <h3 className="font-bold text-lg tracking-tight text-white font-display">Estadísticas en Equipos</h3>
                    </div>
                    
                    <div className="overflow-x-auto text-white">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[12px]">
                                <tr>
                                    <th className="px-5 py-3 text-[12px]">Equipo</th>
                                    <th className="px-4 py-3 text-center text-[12px]">PJ</th>
                                    <th className="px-4 py-3 text-center text-green-500 text-[12px]">V</th>
                                    <th className="px-4 py-3 text-center text-gray-500 text-[12px]">E</th>
                                    <th className="px-4 py-3 text-center text-red-500 text-[12px]">D</th>
                                    <th className="px-4 py-3 text-center text-green-500 text-[12px]">GF</th>
                                    <th className="px-5 py-3 text-center text-red-500 text-[12px]">GC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5 transition-colors group">
                                    <td className="px-5 py-4 font-bold text-white flex items-center gap-3">
                                        <img 
                                            src="https://demo.martinrod.com/images/Escudo-BELLOTTI-FC.png" 
                                            alt="Bellotti" 
                                            className="w-6 h-6 object-contain filter brightness-110 group-hover:scale-110 transition-transform"
                                            referrerPolicy="no-referrer"
                                        />
                                        Bellotti FC
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold">{bellotti.pj}</td>
                                    <td className="px-4 py-4 text-center font-bold text-emerald-500">{bellotti.vic}</td>
                                    <td className="px-4 py-4 text-center text-gray-400">{bellotti.e}</td>
                                    <td className="px-4 py-4 text-center text-red-500">{bellotti.der}</td>
                                    <td className="px-4 py-4 text-center font-bold text-emerald-500">{bellotti.gf}</td>
                                    <td className="px-5 py-4 text-center font-bold text-red-500">{bellotti.gc}</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors group">
                                    <td className="px-5 py-4 font-bold text-white flex items-center gap-3">
                                        <img 
                                            src="https://demo.martinrod.com/images/Escudo-FLU-DV.png" 
                                            alt="Fluvito" 
                                            className="w-6 h-6 object-contain filter brightness-110 group-hover:scale-110 transition-transform"
                                            referrerPolicy="no-referrer"
                                        />
                                        Fluvito
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold">{fluvito.pj}</td>
                                    <td className="px-4 py-4 text-center font-bold text-emerald-500">{fluvito.vic}</td>
                                    <td className="px-4 py-4 text-center text-gray-400">{fluvito.e}</td>
                                    <td className="px-4 py-4 text-center text-red-500">{fluvito.der}</td>
                                    <td className="px-4 py-4 text-center font-bold text-emerald-500">{fluvito.gf}</td>
                                    <td className="px-5 py-4 text-center font-bold text-red-500">{fluvito.gc}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
