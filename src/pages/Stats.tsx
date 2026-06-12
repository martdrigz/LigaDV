import React, { useMemo, useState, useEffect } from 'react';
import { getPlayerStats, getMatches, getPlayers } from '../lib/storage';
import { calculateAllAssociations } from '../lib/historicalAnalysis';
import { Trophy, Activity, Medal, Loader2, Shield, Target, History, Star, Flame, User, Footprints, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Match, Player, PlayerStats, Association } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../components/FirebaseProvider';
import { AnimatedButton } from '../components/ui/animated-button';
import Papa from 'papaparse';

import { PlayerRankings, AssociationRankings } from '../components/StatsTables';

export function Stats() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useFirebase();

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
    let bellotti = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 };
    let fluvito = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 };

    matches.forEach(m => {
      const gA = m.result?.teamAGoals ?? 0;
      const gB = m.result?.teamBGoals ?? 0;

      bellotti.goalsFor += gA;
      bellotti.goalsAgainst += gB;
      fluvito.goalsFor += gB;
      fluvito.goalsAgainst += gA;

      if (gA > gB) {
        bellotti.wins++;
        fluvito.losses++;
      } else if (gB > gA) {
        fluvito.wins++;
        bellotti.losses++;
      } else {
        bellotti.draws++;
        fluvito.draws++;
      }
    });

    return { 
      bellotti, 
      fluvito, 
      total: matches.length 
    };
  }, [matches]);

  const advancedPlayerStats = useMemo(() => {
    const chronologicalMatches = [...matches].reverse();
    
    return players.map(p => {
        let matchesPlayed = 0;
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goals = 0;
        let assists = 0;
        let reservationsCount = 0;
        
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        let currentUnbeatenStreak = 0;
        let maxUnbeatenStreak = 0;
        let currentAttendanceStreak = 0;
        
        chronologicalMatches.forEach(m => {
            const playedInMatch = m.teamA.players.some(x => x.id === p.id) || m.teamB.players.some(x => x.id === p.id);
            if (playedInMatch) {
                matchesPlayed++;
                let isWin = false;
                let isDraw = false;
                if (m.teamA.players.some(x => x.id === p.id)) {
                    if (m.result!.teamAGoals > m.result!.teamBGoals) isWin = true;
                    else if (m.result!.teamAGoals === m.result!.teamBGoals) isDraw = true;
                } else {
                    if (m.result!.teamBGoals > m.result!.teamAGoals) isWin = true;
                    else if (m.result!.teamAGoals === m.result!.teamBGoals) isDraw = true;
                }
                
                if (isWin) {
                    wins++;
                    currentWinStreak++;
                    currentUnbeatenStreak++;
                } else if (isDraw) {
                    draws++;
                    currentWinStreak = 0;
                    currentUnbeatenStreak++;
                } else {
                    losses++;
                    currentWinStreak = 0;
                    currentUnbeatenStreak = 0;
                }
                if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
                if (currentUnbeatenStreak > maxUnbeatenStreak) maxUnbeatenStreak = currentUnbeatenStreak;

                // Add goals/assists
                const ps = m.playerStats?.find(x => x.playerId === p.id);
                if (ps) {
                    goals += ps.goals || 0;
                    assists += ps.assists || 0;
                }
            }

            // Count reservations - Outside playedInMatch because they might reserve but not play
            const reservedBy = m.reservation?.reservedBy;
            if (reservedBy && (
                reservedBy === p.id || 
                reservedBy.toString().toLowerCase().trim() === p.name.toLowerCase().trim()
            )) {
                reservationsCount++;
            }
        });
        
        for (let m of matches) {
            const playedInMatch = m.teamA.players.some(x => x.id === p.id) || m.teamB.players.some(x => x.id === p.id);
            if (playedInMatch) currentAttendanceStreak++;
            else break;
        }
        
        const attendancePercent = matches.length > 0 ? (matchesPlayed / matches.length) * 100 : 0;
        const winPercent = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
        
        return {
            player: p,
            matchesPlayed,
            wins,
            draws,
            losses,
            maxWinStreak,
            currentWinStreak,
            maxUnbeatenStreak,
            attendancePercent,
            currentAttendanceStreak,
            winPercent,
            goals,
            assists,
            reservationsCount
        };
    }).filter(s => s.matchesPlayed > 0);
  }, [players, matches]);
  
  const MIN_MATCHES = 2;
  
  const sociedadOfensiva = useMemo(() => 
    calculateAllAssociations(matches, 'att')
      .filter(s => s.matchesPlayed >= MIN_MATCHES)
      .sort((a,b) => (b.goalsFor/b.matchesPlayed) - (a.goalsFor/a.matchesPlayed))
      .slice(0, 10), 
    [matches]
  );

  const sociedadDefensiva = useMemo(() => 
    calculateAllAssociations(matches, 'def')
      .filter(s => s.matchesPlayed >= MIN_MATCHES)
      .sort((a,b) => (a.goalsAgainst/a.matchesPlayed) - (b.goalsAgainst/b.matchesPlayed))
      .slice(0, 10), 
    [matches]
  );

  const asociacionExitosa = useMemo(() => 
    calculateAllAssociations(matches, 'med')
      .filter(s => s.matchesPlayed >= MIN_MATCHES)
      .sort((a,b) => {
        const winRateA = (a.wins/a.matchesPlayed);
        const winRateB = (b.wins/b.matchesPlayed);
        if (winRateB !== winRateA) return winRateB - winRateA;
        return (b.goalsFor - b.goalsAgainst) / b.matchesPlayed - (a.goalsFor - a.goalsAgainst) / a.matchesPlayed;
      })
      .slice(0, 10), 
    [matches]
  );

  const [activeTab, setActiveTab] = useState<'jugadores' | 'asociaciones' | 'partidos'>('jugadores');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#eaba3f] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando Estadísticas...</p>
      </div>
    );
  }

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-end gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-white font-display">Estadística</h2>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400 pl-0.5">
            <Activity size={16} className="text-[#eaba3f]" /> Rendimiento de equipos y jugadores
          </div>
        </div>
        
        {isAdmin && (
          <AnimatedButton
            onClick={() => {
              const csvData = advancedPlayerStats.map(s => ({
                ID: s.player.id,
                Jugador: s.player.name,
                Numero: s.player.number,
                Habilidad: s.player.skill,
                Velocidad: s.player.speed,
                Posicion1: s.player.primaryPos,
                Posicion2: s.player.secondaryPos,
                PJ: s.matchesPlayed,
                V: s.wins,
                E: s.draws,
                D: s.losses,
                Goles: s.goals,
                Asistencias: s.assists,
                'Win %': s.winPercent.toFixed(1) + '%',
                'Asistencia %': s.attendancePercent.toFixed(1) + '%',
                'Max Racha V': s.maxWinStreak,
                'Racha Actual V': s.currentWinStreak,
                Reservas: s.reservationsCount
              }));
              
              const csv = Papa.unparse(csvData);
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `estadisticas_matchday_${format(new Date(), 'yyyy-MM-dd')}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="secondary"
            className="hidden md:flex bg-white/5 border border-white/10 text-white font-bold gap-2 active:scale-95 transition-transform"
          >
            <Upload size={16} className="text-[#eaba3f]" />
            <span className="text-xs">Exportar Stats</span>
          </AnimatedButton>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-[-24px]">
         {/* Team Comparison Card */}
         <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                <Trophy size={18} className="text-[#eaba3f]" />
                <h3 className="font-bold text-lg tracking-tight text-white font-display">Dominio del juego</h3>
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex flex-col items-center">
                      <span className="font-bold text-sm text-white mb-2">Bellotti</span>
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-white shadow-sm">
                         {teamStats.bellotti.wins}
                      </div>
                   </div>

                   <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-gray-400 mb-1">Empates</span>
                      <span className="text-xl font-bold text-gray-500">{teamStats.bellotti.draws}</span>
                   </div>

                   <div className="flex flex-col items-center">
                      <span className="font-bold text-sm text-white mb-2">Fluvito</span>
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-[#eaba3f] shadow-sm">
                         {teamStats.fluvito.wins}
                      </div>
                   </div>
                </div>

                <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                   <div 
                     className="h-full bg-white" 
                     style={{ width: `${teamStats.total > 0 ? (teamStats.bellotti.wins / teamStats.total) * 100 : 50}%` }} 
                   />
                   <div 
                     className="h-full bg-white/20" 
                     style={{ width: `${teamStats.total > 0 ? (teamStats.bellotti.draws / teamStats.total) * 100 : 0}%` }} 
                   />
                   <div 
                     className="h-full bg-[#eaba3f]" 
                     style={{ width: `${teamStats.total > 0 ? (teamStats.fluvito.wins / teamStats.total) * 100 : 50}%` }} 
                   />
                </div>
            </div>
         </div>

         {/* General Stats summary */}
         <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-sm overflow-hidden mb-0">
            <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
                <Activity size={18} className="text-[#eaba3f]" />
                <h3 className="font-bold text-lg tracking-tight text-white font-display">Resumen general</h3>
            </div>
            
            <div className="overflow-x-auto text-white">
                <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="px-5 py-3">Equipo</th>
                            <th className="px-4 py-3 text-center">PJ</th>
                            <th className="px-4 py-3 text-center text-green-500">V</th>
                            <th className="px-4 py-3 text-center text-gray-500">E</th>
                            <th className="px-4 py-3 text-center text-red-500">D</th>
                            <th className="px-4 py-3 text-center text-green-500">GF</th>
                            <th className="px-5 py-3 text-center text-red-500">GC</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/5">
                            <td className="px-5 py-3 font-bold text-white">Bellotti FC</td>
                            <td className="px-4 py-3 text-center font-bold">{teamStats.total}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-500">{teamStats.bellotti.wins}</td>
                            <td className="px-4 py-3 text-center text-gray-400">{teamStats.bellotti.draws}</td>
                            <td className="px-4 py-3 text-center text-red-500">{teamStats.bellotti.losses}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-500">{teamStats.bellotti.goalsFor}</td>
                            <td className="px-5 py-3 text-center font-bold text-red-500">{teamStats.bellotti.goalsAgainst}</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                            <td className="px-5 py-3 font-bold text-white">Fluvito</td>
                            <td className="px-4 py-3 text-center font-bold">{teamStats.total}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-500">{teamStats.fluvito.wins}</td>
                            <td className="px-4 py-3 text-center text-gray-400">{teamStats.fluvito.draws}</td>
                            <td className="px-4 py-3 text-center text-red-500">{teamStats.fluvito.losses}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-500">{teamStats.fluvito.goalsFor}</td>
                            <td className="px-5 py-3 text-center font-bold text-red-500">{teamStats.fluvito.goalsAgainst}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
         </div>
      </div>

      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
         <div className="flex gap-8 min-w-max">
            <button 
               className={`pb-4 text-lg font-bold tracking-tight font-display transition-all relative ${activeTab === 'jugadores' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
               onClick={() => setActiveTab('jugadores')}
            >
               Jugadores
               {activeTab === 'jugadores' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#eaba3f]" />}
            </button>
            <button 
               className={`pb-4 text-lg font-bold tracking-tight font-display transition-all relative ${activeTab === 'asociaciones' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
               onClick={() => setActiveTab('asociaciones')}
            >
               Asociaciones
               {activeTab === 'asociaciones' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#eaba3f]" />}
            </button>
            <button 
               className={`pb-4 text-lg font-bold tracking-tight font-display transition-all relative ${activeTab === 'partidos' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
               onClick={() => setActiveTab('partidos')}
            >
               Historial
               {activeTab === 'partidos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#eaba3f]" />}
            </button>
         </div>
      </div>

      {activeTab === 'jugadores' && (
          <PlayerRankings advancedPlayerStats={advancedPlayerStats} />
      )}

      {activeTab === 'asociaciones' && (
          <AssociationRankings ofensiva={sociedadOfensiva} defensiva={sociedadDefensiva} exitosa={asociacionExitosa} players={players} allMatches={matches} />
      )}

      {activeTab === 'partidos' && (
          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5">
              <History size={16} className="text-[#eaba3f]" />
              <h3 className="text-lg font-bold tracking-tight text-white font-display">Historial de Partidos</h3>
            </div>
            <div className="overflow-x-auto text-white">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/20 text-gray-500 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-4 py-3">Evento</th>
                    <th className="px-4 py-3">Marcador</th>
                    <th className="px-4 py-3 text-center">Reserva</th>
                    <th className="px-4 py-3 text-center">Estadio</th>
                    <th className="px-4 py-3 text-center">Cancha</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedMatches.map((m, i) => {
                    const reserver = players.find(p => p.id === m.reservation?.reservedBy || p.name === m.reservation?.reservedBy);
                    const reserverName = reserver ? (reserver.name.split(' ').length > 1 ? reserver.name.split(' ').pop() : reserver.name) : '-';
                    
                    return (
                      <motion.tr 
                        key={m.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: i * 0.05 }}
                        className={`hover:bg-white/5 ${i === sortedMatches.length - 1 ? 'last:pb-5' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white uppercase">{format(new Date(m.date), 'EEEE dd', { locale: es })}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{format(new Date(m.date), 'MMMM yyyy', { locale: es })}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-gray-400 uppercase tracking-tighter">
                            {m.season && m.matchday ? `${m.season} • F${m.matchday}` : "Amistoso"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">Bellotti {m.result?.teamAGoals}</span>
                            <span className="text-gray-600">-</span>
                            <span className="font-bold text-white">{m.result?.teamBGoals} Fluvito</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-black text-[#eaba3f] uppercase truncate max-w-[80px] block mx-auto tracking-tighter">
                            {reserverName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-bold text-gray-400 uppercase">
                            {m.reservation?.field || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-bold text-gray-400">
                            {m.reservation?.playerCount ? `C${m.reservation.playerCount}` : '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/match/${m.id}`)}
                            className="bg-[#eaba3f]/10 text-[#eaba3f] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#eaba3f]/20 hover:bg-[#eaba3f] hover:text-black transition-all"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {isAdmin && (
        <div className="mt-20 py-10 border-t border-white/5 flex justify-center">
            <button 
              onClick={() => navigate('/audit')} 
              className="group flex flex-col items-center gap-3 transition-opacity opacity-40 hover:opacity-100"
            >
              <div className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-[#eaba3f] group-hover:scale-150 transition-all duration-300" />
              <span className="text-[8px] text-gray-700 group-hover:text-[#eaba3f] transition-colors uppercase tracking-[0.4em] font-black">
                Terminal de Auditoría Algorítmica (v2.1)
              </span>
            </button>
        </div>
      )}
    </div>
  );
}
