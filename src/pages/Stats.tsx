import React, { useMemo, useState, useEffect } from 'react';
import { getPlayerStats, getMatches, getPlayers } from '../lib/storage';
import { Trophy, Activity, Medal, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Match, Player, PlayerStats } from '../types';

export function Stats() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ps, matches, p] = await Promise.all([
          getPlayerStats(),
          getMatches(),
          getPlayers()
        ]);
        setPlayerStats(ps);
        setAllMatches(matches);
        setPlayers(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const matches = useMemo(() => allMatches.filter(m => m.status === 'completed'), [allMatches]);

  const teamStats = useMemo(() => {
    let bellottiWins = 0;
    let fluvitoWins = 0;
    let draws = 0;

    matches.forEach(m => {
      const gA = m.result?.teamAGoals ?? 0;
      const gB = m.result?.teamBGoals ?? 0;
      if (gA > gB) bellottiWins++;
      else if (gB > gA) fluvitoWins++;
      else draws++;
    });

    return { bellottiWins, fluvitoWins, draws, total: matches.length };
  }, [matches]);

  const sortedPlayerStats = useMemo(() => {
    return [...playerStats]
      .filter(ps => ps.matchesPlayed > 0)
      .sort((a, b) => b.wins - a.wins);
  }, [playerStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#eaba3f] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando Estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold tracking-tight text-white font-display">Estadística</h2>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 pl-0.5">
          <Activity size={16} className="text-[#eaba3f]" /> Rendimiento de equipos y jugadores
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Team Comparison Card */}
         <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base tracking-tight text-white mb-6 flex items-center gap-2 font-display">
               <Trophy size={18} className="text-[#eaba3f]" /> Dominio del juego
            </h3>
            
            <div className="flex items-center justify-between mb-8">
               <div className="flex flex-col items-center">
                  <span className="font-bold text-sm text-white mb-2">Bellotti</span>
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-white shadow-sm">
                     {teamStats.bellottiWins}
                  </div>
               </div>

               <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-gray-400 mb-1">Empates</span>
                  <span className="text-xl font-bold text-gray-500">{teamStats.draws}</span>
               </div>

               <div className="flex flex-col items-center">
                  <span className="font-bold text-sm text-white mb-2">Fluvito</span>
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-[#eaba3f] shadow-sm">
                     {teamStats.fluvitoWins}
                  </div>
               </div>
            </div>

            <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
               <div 
                 className="h-full bg-white" 
                 style={{ width: `${teamStats.total > 0 ? (teamStats.bellottiWins / teamStats.total) * 100 : 50}%` }} 
               />
               <div 
                 className="h-full bg-white/20" 
                 style={{ width: `${teamStats.total > 0 ? (teamStats.draws / teamStats.total) * 100 : 0}%` }} 
               />
               <div 
                 className="h-full bg-[#eaba3f]" 
                 style={{ width: `${teamStats.total > 0 ? (teamStats.fluvitoWins / teamStats.total) * 100 : 50}%` }} 
               />
            </div>
         </div>

         {/* General Stats summary */}
         <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-center gap-6">
            <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-2 font-display">
               <Activity size={18} className="text-[#eaba3f]" /> Resumen general
            </h3>
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <span className="text-sm font-semibold text-gray-500">Partidos Jugados</span>
               <span className="text-xl font-bold text-white">{teamStats.total}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-sm font-semibold text-gray-500">Más Victorias</span>
               <span className="text-sm font-bold text-[#eaba3f]">
                 {teamStats.bellottiWins > teamStats.fluvitoWins ? "Bellotti FC" : teamStats.fluvitoWins > teamStats.bellottiWins ? "Fluvito" : "Empate"}
               </span>
            </div>
         </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-white/5 flex items-center gap-2 bg-white/5">
          <Medal size={18} className="text-[#eaba3f]" />
          <h3 className="font-bold text-base tracking-tight text-white font-display">Ranking de jugadores</h3>
        </div>
        
        {sortedPlayerStats.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Activity size={32} className="mb-2 opacity-50" />
              <p className="font-medium text-sm">Sin actividad de jugadores</p>
           </div>
        ) : (
          <div className="overflow-x-auto text-white">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Jugador</th>
                  <th className="px-4 py-3 text-center">PJ</th>
                  <th className="px-4 py-3 text-center text-white">V</th>
                  <th className="px-4 py-3 min-w-[120px]">Rendimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedPlayerStats.map((stat, index) => {
                  const player = players.find(p => p.id === stat.playerId);
                  const winRate = stat.matchesPlayed > 0 ? Math.round((stat.wins / stat.matchesPlayed) * 100) : 0;
                  
                  return (
                    <motion.tr 
                      key={stat.playerId} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                         <div className="font-bold text-white">
                            {player?.name || 'Desconocido'}
                         </div>
                         <div className="text-[10px] text-gray-500 font-medium">#{player?.number} • {player?.primaryPos}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-400">{stat.matchesPlayed}</td>
                      <td className="px-4 py-3 text-center font-bold text-white">{stat.wins}</td>
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-[#eaba3f]" style={{ width: `${winRate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-300 w-8">{winRate}%</span>
                         </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
