import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Association, Player, Match } from '../types';
import { Activity, Shield, Target, Flame, Footprints, Medal, History, ChevronDown, ChevronRight, Calendar, Star } from 'lucide-react';

export function PlayerRankings({ advancedPlayerStats }: { advancedPlayerStats: any[] }) {
    
    // 4. Ranking de Victorias (antes Historico)
    const hist = [...advancedPlayerStats]
        .filter(x => x.matchesPlayed >= 1)
        .sort((a,b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.matchesPlayed - a.matchesPlayed;
        })
        .slice(0, 10);
    // 5. Ranking de Efectividad
    const vic = [...advancedPlayerStats]
        .filter(x => x.matchesPlayed >= 2)
        .sort((a,b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winPercent - a.winPercent;
        })
        .slice(0, 10);
    // 6. Invictos Consecutivos (antes Rachas)
    const rachas = [...advancedPlayerStats].sort((a,b) => b.maxUnbeatenStreak - a.maxUnbeatenStreak).slice(0, 10);
    // 7. Presencias Consecutivas
    const pres = [...advancedPlayerStats].sort((a,b) => b.currentAttendanceStreak - a.currentAttendanceStreak).slice(0, 10);

    // 8. Ranking de Goleadores
    const goles = [...advancedPlayerStats]
        .filter(x => x.goals > 0)
        .sort((a,b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            return a.matchesPlayed - b.matchesPlayed;
        })
        .slice(0, 10);

    // 9. Ranking de Asistencias
    const asistencias = [...advancedPlayerStats]
        .filter(x => x.assists > 0)
        .sort((a,b) => {
            if (b.assists !== a.assists) return b.assists - a.assists;
            return a.matchesPlayed - b.matchesPlayed;
        })
        .slice(0, 10);

    // 10. Historial de Reservas
    const reservas = [...advancedPlayerStats]
        .filter(x => x.reservationsCount > 0)
        .sort((a,b) => b.reservationsCount - a.reservationsCount)
        .slice(0, 10);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* 4. Ranking de Victorias */}
             <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <History size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Ranking de Victorias</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Jugador</th>
                                 <th className="px-4 py-3 text-center">PJ</th>
                                 <th className="px-4 py-3 text-center text-green-500">V</th>
                                 <th className="px-4 py-3 text-center text-gray-400">E</th>
                                 <th className="px-5 py-3 text-center text-red-500">D</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {hist.map((s, i) => (
                               <motion.tr key={s.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                 <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                 <td className="px-4 py-3 text-center font-bold">{s.matchesPlayed}</td>
                                 <td className="px-4 py-3 text-center">{s.wins}</td>
                                 <td className="px-4 py-3 text-center text-gray-400">{s.draws}</td>
                                 <td className="px-5 py-3 text-center">{s.losses}</td>
                               </motion.tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>

             {/* 5. Ranking de Efectividad */}
             <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <Medal size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Ranking de Efectividad</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Jugador</th>
                                 <th className="px-4 py-3 text-center">PJ</th>
                                 <th className="px-4 py-3 text-center">Vic</th>
                                 <th className="px-5 py-3 text-right">%</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {vic.map((s, i) => (
                               <motion.tr key={s.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                 <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                 <td className="px-4 py-3 text-center text-gray-400">{s.matchesPlayed}</td>
                                 <td className="px-4 py-3 text-center">{s.wins}</td>
                                 <td className="px-5 py-3 text-right font-bold text-[#eaba3f]">{s.winPercent.toFixed(1)}%</td>
                               </motion.tr>
                             ))}
                         </tbody>
                     </table>
                     <div className="p-2 text-[9px] text-center text-gray-500 uppercase tracking-widest border-t border-white/5">Mínimo 2 partidos disputados</div>
                 </div>
             </div>

             {/* 6. Invictos Consecutivos */}
             <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <Flame size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Invictos Consecutivos</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Jugador</th>
                                 <th className="px-4 py-3 text-center">Racha histórica</th>
                                 <th className="px-4 py-3 text-center text-[#eaba3f]">Vic (Máx)</th>
                                 <th className="px-5 py-3 text-center text-green-500">Racha Actual</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {rachas.map((s, i) => (
                               <motion.tr key={s.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                 <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                 <td className="px-4 py-3 text-center">{s.maxUnbeatenStreak}</td>
                                 <td className="px-4 py-3 text-center font-bold">{s.maxWinStreak}</td>
                                 <td className="px-5 py-3 text-center text-green-500">{s.currentWinStreak} V</td>
                               </motion.tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>

             {/* 7. Presencias Consecutivas */}
             <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <Footprints size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Presencias Consecutivas</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Jugador</th>
                                 <th className="px-4 py-3 text-center">Asistencia</th>
                                 <th className="px-5 py-3 text-center text-white">Consecutivos</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {pres.map((s, i) => (
                               <motion.tr key={s.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                 <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                 <td className="px-4 py-3 text-center text-[#eaba3f] font-bold">{Math.round(s.attendancePercent)}%</td>
                                 <td className="px-5 py-3 text-center">{s.currentAttendanceStreak > 0 ? `${s.currentAttendanceStreak} al hilo` : '-'}</td>
                               </motion.tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>

             {/* 8. Goleadores, 9. Asistencias, 10. Historial de Reservas in one row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                 {/* 8. Goleadores */}
                 <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                     <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                       <Target size={16} className="text-[#eaba3f]" />
                       <h3 className="text-lg font-bold tracking-tight text-white font-display">Goleadores</h3>
                     </div>
                     <div className="overflow-x-auto text-white">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                              <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                                  <tr>
                                      <th className="px-5 py-3">Jugador</th>
                                      <th className="px-4 py-3 text-center text-gray-400">PJ</th>
                                      <th className="px-5 py-3 text-right">G</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {goles.map((s, i) => (
                                    <motion.tr key={`goleador-${s.player.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                      <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                      <td className="px-4 py-3 text-center text-gray-400">{s.matchesPlayed}</td>
                                      <td className="px-5 py-3 text-right font-black text-[#eaba3f] text-sm">{s.goals}</td>
                                    </motion.tr>
                                  ))}
                              </tbody>
                          </table>
                     </div>
                 </div>

                 {/* 9. Asistencias */}
                 <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                     <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                       <Star size={16} className="text-[#eaba3f]" />
                       <h3 className="text-lg font-bold tracking-tight text-white font-display">Asistencias</h3>
                     </div>
                     <div className="overflow-x-auto text-white">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                              <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                                  <tr>
                                      <th className="px-5 py-3">Jugador</th>
                                      <th className="px-4 py-3 text-center text-gray-400">PJ</th>
                                      <th className="px-5 py-3 text-right">A</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {asistencias.map((s, i) => (
                                    <motion.tr key={`asistidor-${s.player.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                      <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                      <td className="px-4 py-3 text-center text-gray-400">{s.matchesPlayed}</td>
                                      <td className="px-5 py-3 text-right font-black text-emerald-400 text-sm">{s.assists}</td>
                                    </motion.tr>
                                  ))}
                              </tbody>
                          </table>
                     </div>
                 </div>

                 {/* 10. Historial de Reservas */}
                 <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                     <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                       <Calendar size={16} className="text-[#eaba3f]" />
                       <h3 className="text-lg font-bold tracking-tight text-white font-display">Reservas</h3>
                     </div>
                     <div className="overflow-x-auto text-white">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                              <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                                  <tr>
                                      <th className="px-5 py-3">Jugador</th>
                                      <th className="px-5 py-3 text-right">Cant</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {reservas.map((s, i) => (
                                    <motion.tr key={`reserva-${s.player.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5">
                                      <td className="px-5 py-3 font-bold text-white">{s.player.name}</td>
                                      <td className="px-5 py-3 text-right font-black text-[#eaba3f] text-sm">{s.reservationsCount}</td>
                                    </motion.tr>
                                  ))}
                              </tbody>
                          </table>
                     </div>
                 </div>
             </div>
        </div>
    );
}

export function AssociationRankings({ ofensiva, defensiva, exitosa, players, allMatches }: { ofensiva: Association[], defensiva: Association[], exitosa: Association[], players: Player[], allMatches: Match[] }) {
    
    const [expandedAssoc, setExpandedAssoc] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        if (expandedAssoc === id) setExpandedAssoc(null);
        else setExpandedAssoc(id);
    };

    const getNames = (ids: string[]) => ids.map(id => {
        const p = players.find(x => x.id === id);
        if (!p) return 'Anónimo';
        const parts = p.name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}. ${parts[parts.length - 1]}`;
        }
        return p.name;
    }).join(' + ');

    const MIN_DISPLAY = 2;
    const filteredOfensiva = ofensiva;
    const filteredDefensiva = defensiva;
    const filteredExitosa = exitosa;

    const renderBreakdown = (assoc: Association, colSpan: number = 4) => {
        if (expandedAssoc !== assoc.id) return null;

        const assocMatches = allMatches.filter(m => {
            const inTeamA = assoc.playerIds.every(id => m.teamA.players.some(p => p.id === id));
            const inTeamB = assoc.playerIds.every(id => m.teamB.players.some(p => p.id === id));
            return inTeamA || inTeamB;
        });

        return (
            <tr>
                <td colSpan={colSpan} className="p-0 bg-black/40">
                    <AnimatePresence>
                        {expandedAssoc === assoc.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 border-b border-white/5 space-y-2 overflow-hidden">
                                <div className="text-[10px] uppercase font-bold text-[#eaba3f] tracking-widest mb-3">Historial</div>
                                {assocMatches.map((m, idx) => {
                                    const isTeamA = assoc.playerIds.every(id => m.teamA.players.some(p => p.id === id));
                                    const goalsFor = isTeamA ? m.result!.teamAGoals : m.result!.teamBGoals;
                                    const goalsAgainst = isTeamA ? m.result!.teamBGoals : m.result!.teamAGoals;
                                    const isWin = goalsFor > goalsAgainst;
                                    const isDraw = goalsFor === goalsAgainst;
                                    
                                    return (
                                        <div key={m.id || idx} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-gray-400" />
                                                <span className="text-gray-300 font-medium">{new Date(m.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm ${isWin ? 'text-green-500 bg-green-500/10' : isDraw ? 'text-gray-400 bg-gray-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                                    {isWin ? 'Victoria' : isDraw ? 'Empate' : 'Derrota'}
                                                </span>
                                                <span className="font-mono text-white bg-black px-2.5 py-1 rounded-md border border-white/10 font-bold">
                                                    {isTeamA ? `${m.result!.teamAGoals} - ${m.result!.teamBGoals}` : `${m.result!.teamBGoals} - ${m.result!.teamAGoals}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </td>
            </tr>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Sociedad Ofensiva */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <Target size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Sociedad Ofensiva</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Asociación</th>
                                 <th className="px-4 py-3 text-center">PJ</th>
                                 <th className="px-4 py-3 text-center text-green-500">GF/P</th>
                                 <th className="px-5 py-3 text-center text-[#eaba3f]">Vic %</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {filteredOfensiva.length > 0 ? filteredOfensiva.map((s, i) => (
                               <React.Fragment key={s.id}>
                                   <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 cursor-pointer" onClick={() => toggleExpand(s.id)}>
                                     <td className="px-5 py-3 font-bold text-white text-[10px] uppercase flex items-center gap-2">
                                         <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                             {expandedAssoc === s.id ? <ChevronDown size={14} className="text-[#eaba3f]" /> : <ChevronRight size={14} className="text-gray-500" />}
                                         </div>
                                         <span className="truncate max-w-[120px]">{getNames(s.playerIds)}</span>
                                     </td>
                                     <td className="px-4 py-3 text-center text-gray-400">{s.matchesPlayed}</td>
                                     <td className="px-4 py-3 text-center font-bold text-green-500">{(s.goalsFor / s.matchesPlayed).toFixed(1)}</td>
                                     <td className="px-5 py-3 text-center text-[#eaba3f] font-bold">{Math.round((s.wins / s.matchesPlayed) * 100)}%</td>
                                   </motion.tr>
                                   {renderBreakdown(s, 4)}
                               </React.Fragment>
                             )) : (
                                <tr><td colSpan={4} className="p-5 text-center text-gray-500 italic text-[10px]">No existen asociaciones con suficientes partidos para generar estadísticas confiables.</td></tr>
                             )}
                         </tbody>
                         <tfoot className="border-t border-white/5">
                             <tr>
                                 <td colSpan={4} className="p-2 text-[9px] text-center text-gray-500 uppercase tracking-widest">Mínimo {MIN_DISPLAY} partidos jugados</td>
                             </tr>
                         </tfoot>
                     </table>
                 </div>
            </div>

            {/* 2. Sociedad Defensiva */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <Shield size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Sociedad Defensiva</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Asociación</th>
                                 <th className="px-4 py-3 text-center">PJ</th>
                                 <th className="px-4 py-3 text-center text-red-500">GC/P</th>
                                 <th className="px-4 py-3 text-center text-blue-400">Vallas Inv.</th>
                                 <th className="px-5 py-3 text-center text-[#eaba3f]">Vic %</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {filteredDefensiva.length > 0 ? filteredDefensiva.map((s, i) => (
                               <React.Fragment key={s.id}>
                                   <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 cursor-pointer" onClick={() => toggleExpand(s.id)}>
                                     <td className="px-5 py-3 font-bold text-white text-[10px] uppercase flex items-center gap-2">
                                         <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                             {expandedAssoc === s.id ? <ChevronDown size={14} className="text-[#eaba3f]" /> : <ChevronRight size={14} className="text-gray-500" />}
                                         </div>
                                         <span className="truncate max-w-[120px]">{getNames(s.playerIds)}</span>
                                     </td>
                                     <td className="px-4 py-3 text-center text-gray-400">{s.matchesPlayed}</td>
                                     <td className="px-4 py-3 text-center font-bold text-red-500">{(s.goalsAgainst / s.matchesPlayed).toFixed(1)}</td>
                                     <td className="px-4 py-3 text-center font-mono text-blue-400">{s.cleanSheets || 0}</td>
                                     <td className="px-5 py-3 text-center text-[#eaba3f] font-bold">{Math.round((s.wins / s.matchesPlayed) * 100)}%</td>
                                   </motion.tr>
                                   {renderBreakdown(s, 5)}
                               </React.Fragment>
                             )) : (
                                <tr><td colSpan={5} className="p-5 text-center text-gray-500 italic text-[10px]">No existen asociaciones con suficientes partidos para generar estadísticas confiables.</td></tr>
                             )}
                         </tbody>
                         <tfoot className="border-t border-white/5">
                             <tr>
                                 <td colSpan={5} className="p-2 text-[9px] text-center text-gray-500 uppercase tracking-widest">Mínimo {MIN_DISPLAY} partidos jugados</td>
                             </tr>
                         </tfoot>
                     </table>
                 </div>
            </div>

            {/* 3. Sociedad Creativa */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm md:col-span-2">
                 <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                   <Activity size={16} className="text-[#eaba3f]" />
                   <h3 className="text-lg font-bold tracking-tight text-white font-display">Sociedad Creativa</h3>
                 </div>
                 <div className="overflow-x-auto text-white">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                         <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                             <tr>
                                 <th className="px-5 py-3">Asociación</th>
                                 <th className="px-4 py-3 text-center">PJ</th>
                                 <th className="px-4 py-3 text-center text-[#eaba3f]">Vic %</th>
                                 <th className="px-4 py-3 text-center text-gray-400">Emp %</th>
                                 <th className="px-5 py-3 text-center text-white">Dif/P</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {filteredExitosa.length > 0 ? filteredExitosa.map((s, i) => (
                               <React.Fragment key={s.id}>
                                   <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 cursor-pointer" onClick={() => toggleExpand(s.id)}>
                                     <td className="px-5 py-3 font-bold text-white text-[10px] uppercase flex items-center gap-2">
                                         <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                             {expandedAssoc === s.id ? <ChevronDown size={14} className="text-[#eaba3f]" /> : <ChevronRight size={14} className="text-gray-500" />}
                                         </div>
                                         <span className="truncate max-w-[150px]">{getNames(s.playerIds)}</span>
                                     </td>
                                     <td className="px-4 py-3 text-center text-gray-400">{s.matchesPlayed}</td>
                                     <td className="px-4 py-3 text-center font-bold text-[#eaba3f]">{Math.round((s.wins / s.matchesPlayed) * 100)}%</td>
                                     <td className="px-4 py-3 text-center text-gray-500">{Math.round((s.draws / s.matchesPlayed) * 100)}%</td>
                                     <td className="px-5 py-3 text-center font-mono text-[10px]">
                                         <div className={`px-1.5 py-0.5 rounded font-bold inline-block min-w-[28px] text-center ${s.goalsFor - s.goalsAgainst > 0 ? 'bg-green-500/20 text-green-400' : s.goalsFor - s.goalsAgainst < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                             {((s.goalsFor - s.goalsAgainst) / s.matchesPlayed).toFixed(1)}
                                         </div>
                                     </td>
                                   </motion.tr>
                                   {renderBreakdown(s, 5)}
                               </React.Fragment>
                             )) : (
                                <tr><td colSpan={5} className="p-5 text-center text-gray-500 italic text-[10px]">No existen asociaciones con suficientes partidos para generar estadísticas confiables.</td></tr>
                             )}
                         </tbody>
                         <tfoot className="border-t border-white/5">
                             <tr>
                                 <td colSpan={5} className="p-2 text-[9px] text-center text-gray-500 uppercase tracking-widest">Mínimo {MIN_DISPLAY} partidos jugados</td>
                             </tr>
                         </tfoot>
                     </table>
                 </div>
            </div>
        </div>
    );
}
