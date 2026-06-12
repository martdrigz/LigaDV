import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, Player, Team, Position } from '../types';
import { matchSchema } from '../schemas';
import { getMatches, saveMatch, deleteMatch, getPlayers } from '../lib/storage';
import { MapPin, Calendar, Clock, Loader2, ChevronDown, Users, User, BarChart2, Trophy, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { DragDropProvider, useDrag } from '../components/DragDropProvider';
import { PinModal } from '../components/PinModal';
import { AnimatedButton } from '../components/ui/animated-button';
import { useFirebase } from '../components/FirebaseProvider';
import { motion, AnimatePresence } from 'framer-motion';

const FORMATIONS_BY_COUNT: Record<number, { default: string, options: string[] }> = {
  5: { default: '2-2-1', options: ['2-2-1', '1-3-1', '2-1-2', '3-1-1', '1-2-2'] },
  6: { default: '2-2-2', options: ['2-3-1', '3-2-1', '2-2-2', '1-3-2', '1-2-3'] },
  7: { default: '2-3-2', options: ['3-3-1', '3-2-2', '2-3-2', '2-4-1', '4-2-1'] }
};

function CustomDropdown({ value, onChange, options, placeholder = "Seleccionar" }: { value: string, onChange: (v: string) => void, options: { value: string, label: string }[], placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 flex items-center justify-between group hover:border-[#eaba3f]/40 hover:bg-black/60 transition-all outline-none"
      >
        <span className={cn("text-xs font-bold truncate", selected ? "text-white" : "text-gray-500")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={18} className={cn("text-gray-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 z-[101] bg-[#151515] border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-[300px] overflow-y-auto no-scrollbar scroll-smooth"
            >
              <div className="p-1">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-bold rounded-lg transition-all",
                      value === opt.value ? "bg-[#eaba3f] text-black shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MatchView() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formationA, setFormationA] = useState('2-3-2');
  const [formationB, setFormationB] = useState('2-3-2');
  const [movedPlayerId, setMovedPlayerId] = useState<string | null>(null);

  // Expose state for animations
  useEffect(() => {
    (window as any).__matchViewState = { movedPlayerId };
  }, [movedPlayerId]);
  const { isAdmin } = useFirebase();
  
  const [goalsA, setGoalsA] = useState<number | ''>('');
  const [goalsB, setGoalsB] = useState<number | ''>('');

  const [reservedBy, setReservedBy] = useState<string>('');
  const [field, setField] = useState<string>('OPEN GALLO');
  const [playerCount, setPlayerCount] = useState<number>(5);
  const [playerStats, setPlayerStats] = useState<Record<string, { goals: number, assists: number }>>({});
  
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);

  const fetchData = async () => {
    try {
      const matches = await getMatches();
      const m = matches.find(m => m.id === matchId);
      if (m) {
        setMatch(m);
        setGoalsA(m.result?.teamAGoals ?? '');
        setGoalsB(m.result?.teamBGoals ?? '');
        
        setReservedBy(m.reservation?.reservedBy ?? '');
        setField(m.reservation?.field ?? 'OPEN GALLO');
        setPlayerCount(m.reservation?.playerCount ?? 5);

        const statsMap: Record<string, { goals: number, assists: number }> = {};
        m.playerStats?.forEach(s => {
          statsMap[s.playerId] = { goals: s.goals, assists: s.assists };
        });
        setPlayerStats(statsMap);
        
        // Set default formations based on outfield player count if not already set
        const countA = m.teamA.players.filter(p => p.primaryPos !== 'POR').length;
        const countB = m.teamB.players.filter(p => p.primaryPos !== 'POR').length;
        
        if (!m.teamA.formation && FORMATIONS_BY_COUNT[countA]) setFormationA(FORMATIONS_BY_COUNT[countA].default);
        else if (m.teamA.formation) setFormationA(m.teamA.formation);
        
        if (!m.teamB.formation && FORMATIONS_BY_COUNT[countB]) setFormationB(FORMATIONS_BY_COUNT[countB].default);
        else if (m.teamB.formation) setFormationB(m.teamB.formation);
      }
      setAllPlayers(await getPlayers());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [matchId]);

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#eaba3f] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando Partido...</p>
      </div>
    );
  }

  const executeSaveResult = async () => {
    if (goalsA === '' || goalsB === '') return;
    
    const resultValidation = matchSchema.shape.result.safeParse({
      teamAGoals: Number(goalsA),
      teamBGoals: Number(goalsB)
    });

    if (!resultValidation.success) {
      alert("Goles inválidos: " + resultValidation.error.issues[0].message);
      return;
    }

    const updated: Match = {
      ...match,
      status: 'completed',
      result: resultValidation.data,
      reservation: {
        reservedBy,
        field,
        playerCount
      },
      playerStats: Object.entries(playerStats).map(([playerId, stats]) => ({
        playerId,
        goals: (stats as any).goals,
        assists: (stats as any).assists
      }))
    };
    setLoading(true);
    try {
      await saveMatch(updated);
      setMatch(updated);
      alert('Datos actualizados correctamente');
    } catch (e) {
      console.error(e);
      alert('Error al guardar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = () => {
    if (isAdmin) {
      executeSaveResult();
    } else {
      setPendingAction('save');
      setPinModalOpen(true);
    }
  };

  const handleSwapTeams = async () => {
    if (!match || !isAdmin) return;
    
    setLoading(true);
    const updatedMatch: Match = {
      ...match,
      teamA: { ...match.teamB },
      teamB: { ...match.teamA }
    };
    
    // Also swap formations
    const tempForm = formationA;
    setFormationA(formationB);
    setFormationB(tempForm);
    
    try {
      await saveMatch(updatedMatch);
      setMatch(updatedMatch);
    } catch (e) {
      console.error(e);
      alert('Error al permutar equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async ({ id: activeId, targetItemId, targetZone: overId }: { id: string; targetItemId: string | null; targetZone: string | null }) => {
    if ((!overId && !targetItemId) || !match) return;

    const findTeam = (id: string) => {
        if (id.startsWith('teamA')) return 'teamA';
        if (id.startsWith('teamB')) return 'teamB';
        if (match.teamA.players.find(p => p.id === id)) return 'teamA';
        if (match.teamB.players.find(p => p.id === id)) return 'teamB';
        return null;
    };

    const sourceTeamKey = findTeam(activeId) as 'teamA' | 'teamB';
    const targetTeamKey = (overId?.startsWith('teamA') || targetItemId?.startsWith('teamA')) ? 'teamA' : 
                         ((overId?.startsWith('teamB') || targetItemId?.startsWith('teamB')) ? 'teamB' : 
                         (targetItemId ? findTeam(targetItemId) : null)) as 'teamA' | 'teamB' | null;

    let targetZoneType: 'gk' | 'def' | 'med' | 'att' | null = null;

    const getZoneOfPlayer = (p: Player, team: Team, formationStr: string) => {
        if (p.primaryPos === 'POR' || p.id.includes('gk')) return 'gk';
        const outfield = team.players.filter(x => x.primaryPos !== 'POR' && !x.id.includes('gk'));
        const idx = outfield.findIndex(x => x.id === p.id);
        if (idx === -1) return 'gk'; 
        const counts = formationStr.split('-').map(Number).filter(n => !isNaN(n));
        while (counts.length < 3) counts.push(0);
        if (idx < counts[0]) return 'def';
        if (idx < (counts[0] + counts[1])) return 'med';
        return 'att';
    };

    if (overId) {
        if (overId.includes('-gk')) targetZoneType = 'gk';
        else if (overId.includes('-def')) targetZoneType = 'def';
        else if (overId.includes('-med')) targetZoneType = 'med';
        else if (overId.includes('-att')) targetZoneType = 'att';
    } else if (targetItemId) {
        const tTeam = targetTeamKey ? match[targetTeamKey] : null;
        if (tTeam) {
            const formation = tTeam.formation || (targetTeamKey === 'teamA' ? formationA : formationB);
            const player = tTeam.players.find(p => p.id === targetItemId);
            if (player) {
                targetZoneType = getZoneOfPlayer(player, tTeam, formation);
            }
        }
    }

    if (!sourceTeamKey || !targetTeamKey || !targetZoneType) return;

    let updatedMatch: Match = JSON.parse(JSON.stringify(match));
    const sTeam = updatedMatch[sourceTeamKey];
    const tTeam = updatedMatch[targetTeamKey];
    
    const playerIdx = sTeam.players.findIndex(p => p.id === activeId);
    const player = sTeam.players[playerIdx];
    if (!player) return;

    const sFormation = sTeam.formation || (sourceTeamKey === 'teamA' ? formationA : formationB);
    const sourceZone = getZoneOfPlayer(player, sTeam, sFormation);

    const updateFormationStr = (team: Team, zoneFrom: 'gk' | 'def' | 'med' | 'att', zoneTo: 'gk' | 'def' | 'med' | 'att') => {
        const formationStr = team.formation || (team === updatedMatch.teamA ? formationA : (updatedMatch.teamB ? formationB : ''));
        if (!formationStr) return;
        const counts = formationStr.split('-').map(Number).filter(n => !isNaN(n));
        
        while (counts.length < 3) counts.push(0);
        if (counts.length > 3) counts.splice(3);

        const getIdx = (z: string) => z === 'def' ? 0 : (z === 'med' ? 1 : 2);
        
        if (zoneFrom !== 'gk') {
            const fIdx = getIdx(zoneFrom);
            if (counts[fIdx] > 0) counts[fIdx]--;
        }
        
        if (zoneTo !== 'gk') {
            const tIdx = getIdx(zoneTo);
            counts[tIdx]++;
        }
        
        team.formation = counts.join('-');
        if (team === updatedMatch.teamA) setFormationA(team.formation);
        else setFormationB(team.formation);
    };

    // Move player logic (remove from source, insert at target)
    sTeam.players.splice(playerIdx, 1);
    const gksCount = tTeam.players.filter(x => x.primaryPos === 'POR' || x.id.includes('gk')).length;
    const tCounts = (tTeam.formation || (targetTeamKey === 'teamA' ? formationA : formationB)).split('-').map(Number);
    while (tCounts.length < 3) tCounts.push(0);
    
    let insertIdx = 0;
    if (targetZoneType === 'gk') insertIdx = 0;
    else if (targetZoneType === 'def') insertIdx = gksCount;
    else if (targetZoneType === 'med') insertIdx = gksCount + tCounts[0];
    else if (targetZoneType === 'att') insertIdx = gksCount + tCounts[0] + tCounts[1];

    if (targetItemId && sourceTeamKey === targetTeamKey) {
        const overIdxAfterSplice = tTeam.players.findIndex(p => p.id === targetItemId);
        if (overIdxAfterSplice !== -1) insertIdx = overIdxAfterSplice;
    }

    const movedPlayer = { ...player };
    if (targetZoneType === 'gk') movedPlayer.primaryPos = 'POR';
    else if (movedPlayer.primaryPos === 'POR') movedPlayer.primaryPos = 'DEF';

    tTeam.players.splice(insertIdx, 0, movedPlayer);

    // Update formation strings
    if (sourceTeamKey === targetTeamKey) {
        if (sourceZone !== targetZoneType) {
            updateFormationStr(sTeam, sourceZone, targetZoneType);
        }
    } else {
        updateFormationStr(sTeam, sourceZone, 'gk'); // Decrement source
        updateFormationStr(tTeam, 'gk', targetZoneType); // Increment target
    }


    setMatch(updatedMatch);
    setMovedPlayerId(activeId);
    setTimeout(() => setMovedPlayerId(null), 600);
    
    try {
        await saveMatch(updatedMatch);
    } catch (e) {
        fetchData();
    }
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      await deleteMatch(match.id);
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Error al eliminar partido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setPendingAction('delete');
    setPinModalOpen(true);
  }

  const handlePinSuccess = async () => {
    if (pendingAction === 'save') await executeSaveResult();
    if (pendingAction === 'delete') await executeDelete();
    setPendingAction(null);
  };

  const playingIds = new Set([...match.teamA.players.map(p => p.id), ...match.teamB.players.map(p => p.id)]);
  const notPlaying = allPlayers.filter(p => !playingIds.has(p.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-5xl mx-auto space-y-8 pb-24"
    >
      {/* Match Header Hero */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
        className="block bg-[#111111] rounded-2xl border border-white/5 overflow-hidden shadow-2xl mb-0"
      >
         <div className="p-4 border-b border-white/5 flex justify-center items-center bg-[#151515]">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#eaba3f]"></span>
               <span className="text-xs font-semibold text-gray-400 uppercase">
                 {match.season && match.matchday ? `${match.season} • Fecha ${match.matchday}` : "Amistoso"}
               </span>
            </div>
         </div>
         
         <div className="p-6 relative flex items-center justify-between">
            <div className="absolute inset-0 bg-[#eaba3f]/[0.02] pointer-events-none" />
            
            <div className="flex flex-col items-center flex-1">
               <div className="w-24 sm:w-32 md:w-44 aspect-square flex items-center justify-center drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                 <img 
                   src="https://demo.martinrod.com/images/Escudo-BELLOTTI-FC.png" 
                   alt="Bellotti FC" 
                   className="w-full h-full object-contain"
                   referrerPolicy="no-referrer"
                 />
              </div>
              <span className="font-bold text-sm tracking-tight text-white mt-4">Bellotti FC</span>
            </div>
            
            <div className="flex flex-col items-center justify-center mx-4 md:mx-10 shrink-0">
               <div className="flex items-center gap-3 md:gap-5">
                  <span className={cn("text-3xl md:text-5xl font-black tracking-tighter", match.status === 'completed' && match.result?.teamAGoals! > match.result?.teamBGoals! ? "text-[#eaba3f]" : "text-white/90")}>
                    {match.status === 'completed' ? match.result?.teamAGoals : Number(goalsA) || 0}
                  </span>
                  <span className="text-xl md:text-2xl font-black text-white/10">-</span>
                  <span className={cn("text-3xl md:text-5xl font-black tracking-tighter", match.status === 'completed' && match.result?.teamBGoals! > match.result?.teamAGoals! ? "text-[#eaba3f]" : "text-white/90")}>
                    {match.status === 'completed' ? match.result?.teamBGoals : Number(goalsB) || 0}
                  </span>
               </div>
            </div>
            
            <div className="flex flex-col items-center flex-1">
               <div className="w-24 sm:w-32 md:w-44 aspect-square flex items-center justify-center drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                   <img 
                    src="https://demo.martinrod.com/images/Escudo-FLU-DV.png" 
                    alt="Fluvito" 
                    className="w-full h-full object-contain opacity-95"
                    referrerPolicy="no-referrer"
                  />
               </div>
               <span className="font-bold text-sm tracking-tight text-white mt-4">Fluvito</span>
            </div>
         </div>

         <div className="p-4 bg-[#151515]/50 border-t border-white/5 flex items-center justify-center gap-6 text-xs font-semibold text-gray-400">
            <span className="flex items-center gap-1.5 lowercase"><Calendar size={14} /> {format(new Date(match.date), 'dd MMM', { locale: es }).replace('.', '')}</span>
            <span className="flex items-center gap-1.5 lowercase"><Clock size={14} /> {format(new Date(match.date), 'HH:mm')}</span>
            <span className="flex items-center gap-1.5 uppercase"><MapPin size={14} /> {match.location || 'OPEN GALLO'}</span>
         </div>
      </motion.div>

      {/* Field Strategy */}
      <section>
         <div className="flex justify-between items-center mb-4 mt-[16px]">
          <h3 className="text-lg font-bold tracking-tight text-white font-display">
              Formación Táctica
          </h3>
          {isAdmin && (
            <button 
              onClick={handleSwapTeams}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#eaba3f]/20 border border-white/10 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
            >
              <ArrowLeftRight size={14} className="text-[#eaba3f]" />
              Permutar Equipos
            </button>
          )}
         </div>
         <div className="relative min-h-[500px] md:min-h-[650px] bg-[#0c1a12] rounded-[1.5rem] border-4 border-[#1a3a2a] overflow-hidden shadow-2xl">
            {/* Field Texture & Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay pointer-events-none z-0" />
            
            {/* Field Stripes - Horizontal on mobile, Vertical on desktop */}
            <div className="absolute inset-0 flex flex-col md:flex-row pointer-events-none z-0">
               {[...Array(12)].map((_, i) => (
                  <div 
                     key={i} 
                     className={cn(
                        "flex-1", 
                        i % 2 === 0 ? "bg-[#0a180f]" : "bg-[#0f2e1f]/30"
                     )} 
                  />
               ))}
            </div>

            {/* Pitch Markings Container */}
            <div className="absolute inset-0 p-2 md:p-4 pointer-events-none z-0">
               <div className="w-full h-full border-[1.5px] border-white/10 relative">
                  {/* Center Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/10 md:top-0 md:bottom-0 md:left-1/2 md:w-[1.5px] md:h-full -translate-y-1/2 md:-translate-y-0 md:-translate-x-1/2" />
                  
                  {/* Center Circle */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-36 md:h-36 border-[1.5px] border-white/10 rounded-full flex items-center justify-center">
                     <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                  </div>

                  {/* Areas (Top/Bottom for mobile) - SHARP CORNERS */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-18 border-b-[1.5px] border-x-[1.5px] border-white/10 md:hidden" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-b-[1.5px] border-x-[1.5px] border-white/10 md:hidden" />
                  
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-18 border-t-[1.5px] border-x-[1.5px] border-white/10 md:hidden" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 border-t-[1.5px] border-x-[1.5px] border-white/10 md:hidden" />

                  {/* Areas (Left/Right for desktop) - SHARP CORNERS */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-28 h-64 border-y-[1.5px] border-r-[1.5px] border-white/10 hidden md:block" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-10 h-32 border-y-[1.5px] border-r-[1.5px] border-white/10 hidden md:block" />
                  
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 w-28 h-64 border-y-[1.5px] border-l-[1.5px] border-white/10 hidden md:block" />
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-32 border-y-[1.5px] border-l-[1.5px] border-white/10 hidden md:block" />

                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-white/10" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-l-[1.5px] border-b-[1.5px] border-white/10" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-r-[1.5px] border-t-[1.5px] border-white/10" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-l-[1.5px] border-t-[1.5px] border-white/10" />
               </div>
            </div>
            
            {/* Teams Sides */}
            <div className="absolute inset-0 flex flex-col md:flex-row z-10">
               <PitchSide team={match.teamA} isTop={true} theme="dark" formation={formationA} className="flex-1" />
               <PitchSide team={match.teamB} isTop={false} theme="light" formation={formationB} className="flex-1" />
            </div>
         </div>
      </section>

      {/* Team Setup Configuration */}
      <section>
         <DragDropProvider onDrop={handleDrop}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamConfigSection id="teamA" name="Bellotti FC" players={match.teamA.players} theme="dark" formation={formationA} setFormation={setFormationA} isAdmin={isAdmin} />
              <TeamConfigSection id="teamB" name="Fluvito" players={match.teamB.players} theme="light" formation={formationB} setFormation={setFormationB} isAdmin={isAdmin} />
           </div>
         </DragDropProvider>
      </section>

      {/* Result Entry & Absents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <section className="bg-[#111111] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="p-[16px_20px] border-b border-white/5 flex items-center gap-2 bg-white/5" style={{ marginBottom: '20px' }}>
                <Trophy size={18} className="text-[#eaba3f]" />
                <h3 className="font-bold text-lg tracking-tight text-white font-display">Carga de Resultados</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center">
               <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
                  <input 
                    type="number" value={goalsA} onChange={e => setGoalsA(e.target.value === '' ? '' : Number(e.target.value))}
                    readOnly={!isAdmin}
                    className="w-20 h-28 bg-black/60 border border-white/10 rounded-3xl text-center text-4xl font-display font-black focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f]/50 outline-none text-white shadow-inner transition-all placeholder:text-white/10 disabled:opacity-50"
                    placeholder="0"
                  />
                  <span className="text-3xl font-black text-white/10">-</span>
                  <input 
                    type="number" value={goalsB} onChange={e => setGoalsB(e.target.value === '' ? '' : Number(e.target.value))}
                    readOnly={!isAdmin}
                    className="w-20 h-28 bg-black/60 border border-white/10 rounded-3xl text-center text-4xl font-display font-black focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f]/50 outline-none text-white shadow-inner transition-all placeholder:text-white/10 disabled:opacity-50"
                    placeholder="0"
                  />
               </div>

              {/* Reservation Info Inputs */}
              <div className="grid grid-cols-1 gap-4 mb-10 px-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Quién Reservó</label>
                  <CustomDropdown
                    value={reservedBy}
                    onChange={(val) => isAdmin && setReservedBy(val)}
                    options={allPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(p => ({
                      value: p.id,
                      label: p.name
                    }))}
                    placeholder="Seleccionar Jugador"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Cancha (C)</label>
                    <input 
                      type="text" 
                      value={field} 
                      readOnly={!isAdmin}
                      onChange={e => setField(e.target.value.toUpperCase())}
                      placeholder="OPEN GALLO"
                      className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-sm font-bold text-white focus:border-[#eaba3f] border-[#eaba3f]/20 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Jugadores (J)</label>
                    <CustomDropdown
                      value={playerCount.toString()}
                      onChange={(val) => isAdmin && setPlayerCount(Number(val))}
                      options={[5, 6, 7, 8, 9, 11].map(n => ({
                        value: n.toString(),
                        label: `Cancha de ${n}`
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 w-full px-4">
                {isAdmin && (
                  <>
                    <AnimatedButton
                      onClick={handleSaveResult}
                      disabled={
                        match.status === 'completed' && 
                        match.result?.teamAGoals === (goalsA === '' ? 0 : goalsA) && 
                        match.result?.teamBGoals === (goalsB === '' ? 0 : goalsB) &&
                        (match.reservation?.reservedBy ?? '') === reservedBy &&
                        (match.reservation?.field ?? 'OPEN GALLO') === field &&
                        (match.reservation?.playerCount ?? 5) === playerCount &&
                        JSON.stringify(match.playerStats || []) === JSON.stringify(Object.entries(playerStats).map(([playerId, stats]) => ({
                          playerId,
                          goals: (stats as any).goals,
                          assists: (stats as any).assists
                        })))
                      }
                      loading={loading}
                      variant="primary"
                      className="w-full h-14 text-sm font-black tracking-widest uppercase rounded-xl"
                    >
                      {match.status === 'completed' ? 'Actualizar Datos' : 'Guardar Resultado'}
                    </AnimatedButton>
                    <AnimatedButton onClick={handleDelete} variant="ghost" className="w-full text-[10px] hover:text-red-500 text-gray-500 font-bold tracking-widest uppercase">
                      Eliminar Partido
                    </AnimatedButton>
                  </>
                )}
              </div>
           </div>
        </section>

        <section className="bg-[#111111] rounded-2xl border border-white/5 shadow-xl flex flex-col">
           <div className="p-[16px_20px] border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-[#eaba3f]" />
                <h3 className="font-bold text-lg tracking-tight text-white font-display" style={{ lineHeight: '20px' }}>Estadísticas Individuales</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                <span className="text-xs font-black text-[#eaba3f]">{match.teamA.players.length + match.teamB.players.length}</span>
                <Users size={14} className="text-gray-500" />
              </div>
           </div>
           
            <div className="p-1 md:p-8 flex-1 flex flex-col" style={{ paddingTop: '16px' }}>
              <div className="space-y-2 md:space-y-3 overflow-y-auto max-h-[600px] pr-2 no-scrollbar mb-6" style={{ marginBottom: '6px' }}>
                 {[...match.teamA.players, ...match.teamB.players].map((p) => (
                   <div key={p.id} className="flex items-center justify-between p-2.5 md:p-3.5 bg-black/40 border border-white/5 rounded-2xl group hover:border-[#eaba3f]/30 transition-all">
                     <div className="flex items-center gap-3 md:gap-4">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] md:text-xs font-black text-white group-hover:border-[#eaba3f]/50 transition-colors">
                         {p.number}
                       </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white tracking-tight">{p.name}</span>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          {match.teamA.players.find(x => x.id === p.id) ? 'Bellotti FC' : 'Fluvito'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">GOL</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            disabled={!isAdmin}
                            onClick={() => {
                              const current = playerStats[p.id]?.goals || 0;
                              setPlayerStats({ ...playerStats, [p.id]: { ...playerStats[p.id], goals: Math.max(0, current - 1), assists: playerStats[p.id]?.assists || 0 } });
                            }}
                            className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          >-</button>
                          <span className="w-4 text-center text-xs font-bold text-white">{playerStats[p.id]?.goals || 0}</span>
                          <button 
                            disabled={!isAdmin}
                            onClick={() => {
                              const current = playerStats[p.id]?.goals || 0;
                              setPlayerStats({ ...playerStats, [p.id]: { ...playerStats[p.id], goals: current + 1, assists: playerStats[p.id]?.assists || 0 } });
                            }}
                            className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[#eaba3f] hover:bg-[#eaba3f]/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >+</button>
                        </div>
                      </div>

                      <div className="w-px h-6 bg-white/5" />

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">AST</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            disabled={!isAdmin}
                            onClick={() => {
                              const current = playerStats[p.id]?.assists || 0;
                              setPlayerStats({ ...playerStats, [p.id]: { ...playerStats[p.id], assists: Math.max(0, current - 1), goals: playerStats[p.id]?.goals || 0 } });
                            }}
                            className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          >-</button>
                          <span className="w-4 text-center text-xs font-bold text-white">{playerStats[p.id]?.assists || 0}</span>
                          <button 
                            disabled={!isAdmin}
                            onClick={() => {
                              const current = playerStats[p.id]?.assists || 0;
                              setPlayerStats({ ...playerStats, [p.id]: { ...playerStats[p.id], assists: current + 1, goals: playerStats[p.id]?.goals || 0 } });
                            }}
                            className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-blue-400 hover:bg-blue-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             {isAdmin && (
                <AnimatedButton 
                  onClick={handleSaveResult}
                  loading={loading}
                  variant="primary"
                  className="w-full h-14 text-sm font-black tracking-widest uppercase rounded-xl"
                >
                  Actualizar Estadísticas
                </AnimatedButton>
             )}
           </div>
        </section>
      </div>

      <PinModal 
        isOpen={pinModalOpen} 
        onClose={() => { setPinModalOpen(false); setPendingAction(null); }} 
        onSuccess={handlePinSuccess} 
      />
    </motion.div>
  );
}

function PitchSide({ team, isTop, theme, className, formation }: { team: Team; isTop: boolean; theme: 'dark' | 'light'; className?: string; formation: string }) {
    const outfield = team.players.filter((p: Player) => p.primaryPos !== 'POR');
    const gks = team.players.filter((p: Player) => p.primaryPos === 'POR');

    const effectiveFormation = team.formation || formation;
    const counts = effectiveFormation.split('-').map(Number);
    
    // Check if the counts sum up to the outfield length, if not, adjust the last count
    const totalFormationCount = counts.reduce((a, b) => a + b, 0);
    if (totalFormationCount !== outfield.length && counts.length > 0) {
        counts[counts.length - 1] = Math.max(0, counts[counts.length - 1] + (outfield.length - totalFormationCount));
    }

    const rows: any[][] = [];
    let idx = 0;
    counts.forEach(c => {
        if (c > 0) {
            rows.push(outfield.slice(idx, idx + c));
            idx += c;
        }
    });

    return (
        <div className={cn(
            "h-full flex items-center justify-center px-[30px] py-1.5 md:p-8 relative",
            isTop ? "flex-col md:flex-row" : "flex-col-reverse md:flex-row-reverse",
            className
        )}>
            {/* Goalkeepers */}
            <div className="flex-none flex flex-row-reverse md:flex-col justify-center gap-2 md:gap-10 pb-1.5 md:pb-0 md:px-8 z-20">
                {gks.map((p: Player) => <PlayerBubble key={p.id} player={p} theme={theme} />)}
            </div>
            
            {/* Outfield Rows */}
            <div className={cn(
                "flex-1 flex items-center justify-evenly w-full h-full z-20",
                isTop ? "flex-col md:flex-row" : "flex-col-reverse md:flex-row-reverse",
                "gap-1 md:gap-10"
            )}>
                {rows.map((row, ri) => (
                    <div key={ri} className="flex flex-row-reverse md:flex-col items-center justify-center gap-3 md:gap-10 min-w-[50px] md:min-h-[100px]">
                        {row.map((p: Player) => (
                            <PlayerBubble key={p.id} player={p} theme={theme} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function PlayerBubble({ player, theme }: { player: Player; theme: 'dark' | 'light'; key?: string }) {
   const [first, ...rest] = player.name.split(' ');
   const isLight = theme === 'light';

   return (
      <div className="flex flex-col items-center group relative z-10 transition-all hover:scale-110">
         <div className="relative flex items-center justify-center">
            <div className={cn(
              "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-[13px] md:text-lg font-black shadow-lg border-2 md:border-[3px] border-[#eaba3f] transition-transform duration-300 group-hover:shadow-[0_0_12px_rgba(234,186,63,0.4)]",
              isLight ? "bg-white text-[#0f2e1f]" : "bg-[#111111] text-white"
            )}>
               {player.number}
            </div>
         </div>
         <div className="mt-0.5 md:mt-2 text-center pointer-events-none">
            <span className="text-[11px] md:text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap bg-black/50 px-1.5 md:px-2 py-0.5 rounded backdrop-blur-sm">
               {first.charAt(0)}. {rest.join(' ') || first}
            </span>
         </div>
      </div>
   );
}

function TeamConfigSection({ id, name, players, theme, formation, setFormation, isAdmin }: { id: string, name: string, players: Player[], theme: 'dark' | 'light', formation: string, setFormation: (f: string) => void, isAdmin: boolean }) {
  const isLight = theme === 'light';
  
  // Partition players
  const gks = players.filter(p => p.primaryPos === 'POR' || p.id.includes('gk'));
  const outfield = players.filter(p => p.primaryPos !== 'POR' && !p.id.includes('gk'));
  const counts = formation.split('-').map(Number).filter(n => !isNaN(n));
  while (counts.length < 3) counts.push(0);
  
  const defs = outfield.slice(0, counts[0]);
  const meds = outfield.slice(counts[0], counts[0] + counts[1]);
  const atts = outfield.slice(counts[0] + counts[1]);

  return (
    <div className={cn(
        "bg-[#111111] rounded-[2rem] border transition-all duration-300 min-h-[400px] shadow-2xl flex flex-col overflow-hidden",
        "border-white/5"
    )}>
       <div className="p-[16px_20px] border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#eaba3f]" />
            <div className="flex flex-col">
              <h3 className="font-bold text-lg tracking-tight text-white font-display">Alineación {name}</h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Formación {formation}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
            <span className="text-xs font-black text-[#eaba3f]">{players.length}</span>
            <Users size={14} className="text-gray-500" />
          </div>
       </div>
       
       <div className="p-6 md:p-8 flex flex-col relative z-10">
          <TeamRow 
            id={`${id}-att`} 
            label="Ataque" 
            players={atts} 
            zone="att" 
            isAdmin={isAdmin} 
          />
          <TeamRow id={`${id}-med`} label="Medio" players={meds} zone="med" isAdmin={isAdmin} />
          <TeamRow id={`${id}-def`} label="Defensa" players={defs} zone="def" isAdmin={isAdmin} />
          <TeamRow id={`${id}-gk`} label="Arquero" players={gks} zone="gk" isAdmin={isAdmin} />
       </div>
    </div>
  );
}

function TeamRow({ id, label, players, zone, isAdmin, listStyle }: { id: string; label: string; players: Player[]; zone: 'def' | 'med' | 'att' | 'gk'; isAdmin: boolean; listStyle?: React.CSSProperties; key?: string }) {
  const labelColors = {
    def: "text-blue-400/60",
    med: "text-green-400/60",
    att: "text-red-400/60",
    gk: "text-amber-400/60"
  };

  return (
    <div 
      data-droppable={id} 
      className={cn(
        "flex flex-col gap-2 transition-all duration-300 py-2"
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className={cn("text-[10px] font-black uppercase tracking-[0.2em]", labelColors[zone])}>
            {label}
          </div>
          {players.length > 0 && <span className="text-sm font-black text-white/40">{players.length}</span>}
        </div>
        <div className="h-px bg-white/5 w-full" />
      </div>
      <div className="flex flex-wrap gap-2.5 min-h-[40px] pt-1" style={listStyle}>
        {players.map(p => <SortablePlayer key={p.id} player={p} zone={zone} isAdmin={isAdmin} />)}
      </div>
    </div>
  );
}

function SortablePlayer({ player, zone, isAdmin }: { player: Player; zone: 'def' | 'med' | 'att' | 'gk'; isAdmin: boolean; key?: string }) {
  const { startDrag } = useDrag();
  const { movedPlayerId } = (window as any).__matchViewState || { movedPlayerId: null };
  const isJustMoved = movedPlayerId === player.id;
  
  const colors = {
    def: "blue",
    med: "green",
    att: "red",
    gk: "amber"
  };

  const boxColors = {
    def: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    med: "bg-green-500/10 text-green-400 border-green-500/30",
    att: "bg-red-500/10 text-red-400 border-red-500/30",
    gk: "bg-amber-500/10 text-amber-400 border-amber-500/30"
  };

  return (
    <div 
      data-item-id={player.id}
      onPointerDown={(e) => isAdmin && startDrag(e, player.id)}
      className={cn(
        "h-10 px-3 pl-2 flex items-center gap-3 rounded-xl border text-[11.5px] font-bold transition-all select-none touch-none",
        isAdmin ? "cursor-grab active:cursor-grabbing hover:bg-white/[0.08] hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5" : "cursor-default opacity-80",
        "bg-white/[0.04] text-gray-100 border-white/5",
        isJustMoved && "just-moved"
      )}
      style={{ '--c': `var(--${colors[zone]})` } as any}
    >
      <div className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border shrink-0", boxColors[zone])}>
        {player.number}
      </div>
      <span className="truncate max-w-[140px] tracking-tight">{player.name}</span>
    </div>
  );
}
