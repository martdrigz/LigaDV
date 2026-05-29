import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, Player } from '../types';
import { matchSchema } from '../schemas';
import { getMatches, saveMatch, deleteMatch, getPlayers } from '../lib/storage';
import { MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useDraggable, useDroppable, DndContext, DragEndEvent } from '@dnd-kit/core';
import { PinModal } from '../components/PinModal';
import { AnimatedButton } from '../components/ui/animated-button';
import { motion } from 'framer-motion';

export function MatchView() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [goalsA, setGoalsA] = useState<number | ''>('');
  const [goalsB, setGoalsB] = useState<number | ''>('');
  
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
      result: resultValidation.data
    };
    setLoading(true);
    try {
      await saveMatch(updated);
      setMatch(updated);
    } catch (e) {
      console.error(e);
      alert('Error al guardar resultado');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = () => {
    setPendingAction('save');
    setPinModalOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !match) return;

    const playerId = active.id as string;
    const targetTeamId = over.id as string;

    const inA = match.teamA.players.find(p => p.id === playerId);
    const inB = match.teamB.players.find(p => p.id === playerId);

    let updatedMatch: Match | null = null;

    if (inA && targetTeamId === 'teamB') {
      const player = inA;
      updatedMatch = {
        ...match,
        teamA: { ...match.teamA, players: match.teamA.players.filter(p => p.id !== playerId) },
        teamB: { ...match.teamB, players: [...match.teamB.players, player] }
      };
    } else if (inB && targetTeamId === 'teamA') {
      const player = inB;
      updatedMatch = {
        ...match,
        teamB: { ...match.teamB, players: match.teamB.players.filter(p => p.id !== playerId) },
        teamA: { ...match.teamA, players: [...match.teamA.players, player] }
      };
    }

    if (updatedMatch) {
      setMatch(updatedMatch);
      try {
        await saveMatch(updatedMatch);
      } catch (e) {
        console.error(e);
        // Revert UI if failed
        fetchData();
      }
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
      <PinModal 
        isOpen={pinModalOpen} 
        onClose={() => { setPinModalOpen(false); setPendingAction(null); }} 
        onSuccess={handlePinSuccess} 
      />

      {/* Match Header Hero - Card Style like Home */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
        className="block bg-[#111111] rounded-2xl border border-white/5 overflow-hidden shadow-2xl"
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
              {match.status === 'completed' ? (
                 <div className="flex items-center gap-3 md:gap-5">
                    <span className={cn("text-3xl md:text-5xl font-black tracking-tighter", match.result?.teamAGoals! > match.result?.teamBGoals! ? "text-[#eaba3f]" : "text-white/90")}>
                      {match.result?.teamAGoals}
                    </span>
                    <span className="text-xl md:text-2xl font-black text-white/10">-</span>
                    <span className={cn("text-3xl md:text-5xl font-black tracking-tighter", match.result?.teamBGoals! > match.result?.teamAGoals! ? "text-[#eaba3f]" : "text-white/90")}>
                      {match.result?.teamBGoals}
                    </span>
                 </div>
              ) : (
                <span className="text-2xl md:text-5xl font-black text-white tracking-tight italic opacity-20">
                  VS
                </span>
              )}
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

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Field Strategy - Full Width */}
        <section>
           <h3 className="text-lg font-bold tracking-tight text-white font-display mb-4">
              Formación Táctica
           </h3>
           <div className="relative min-h-[500px] md:min-h-[600px] bg-[#0c1a12] rounded-[2rem] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl">
              {/* Field Texture Setup */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25] mix-blend-overlay pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0c1a12] via-[#0f2e1f] to-[#0c1a12] opacity-80" />
              
              {/* Pitch Markings */}
              <div className="absolute inset-4 border-2 border-white/10 rounded-2xl pointer-events-none" />
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 md:hidden pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/10 hidden md:block pointer-events-none" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border-2 border-white/10 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 bg-white/20 rounded-full" />
              </div>
              
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-48 md:w-24 border-2 border-white/10 rounded-r-xl border-l-0 pointer-events-none hidden md:block" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-48 md:w-24 border-2 border-white/10 rounded-l-xl border-r-0 pointer-events-none hidden md:block" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-16 w-48 border-2 border-white/10 rounded-b-xl border-t-0 pointer-events-none md:hidden" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 w-48 border-2 border-white/10 rounded-t-xl border-b-0 pointer-events-none md:hidden" />

              {/* Teams Layout container */}
              <div className="absolute inset-0 flex flex-col md:flex-row">
                 {/* Team Bellotti Side */}
                 <div className="flex-1 relative flex flex-col justify-center">
                    <PitchSide team={match.teamA} isTop={true} theme="dark" className="mb-[34px] p-0 m-0" />
                 </div>

                 {/* Team Fluvito Side */}
                 <div className="flex-1 relative flex flex-col justify-center">
                    <PitchSide team={match.teamB} isTop={false} theme="light" className="mb-[18px]" />
                 </div>
              </div>
           </div>
        </section>

        {/* Configuration Section */}
        <section>
           <h3 className="text-lg font-bold tracking-tight text-white font-display px-1 mb-4">
              Configuración de Equipos
           </h3>
           <DndContext onDragEnd={handleDragEnd}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DroppableTeam id="teamA" name="Bellotti FC" players={match.teamA.players} theme="dark" />
                <DroppableTeam id="teamB" name="Fluvito" players={match.teamB.players} theme="light" />
             </div>
           </DndContext>
        </section>

        {/* Bottom Sections: Result & Absents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Score Control Section */}
          <section className="bg-[#111111] rounded-2xl border border-white/5 p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#eaba3f]/5 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
             <h3 className="text-lg font-bold tracking-tight text-white font-display text-center mb-10">
                Cargar Resultado
             </h3>
             <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-center gap-6 md:gap-10 mb-10">
                   <input 
                     type="number" value={goalsA} onChange={e => setGoalsA(e.target.value === '' ? '' : Number(e.target.value))}
                     className="w-20 h-28 bg-black/60 border border-white/10 rounded-3xl text-center text-4xl font-display font-black focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f]/50 outline-none text-white shadow-inner transition-all placeholder:text-white/10"
                     placeholder="0"
                   />
                   <span className="text-3xl font-black text-white/10">-</span>
                   <input 
                     type="number" value={goalsB} onChange={e => setGoalsB(e.target.value === '' ? '' : Number(e.target.value))}
                     className="w-20 h-28 bg-black/60 border border-white/10 rounded-3xl text-center text-4xl font-display font-black focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f]/50 outline-none text-white shadow-inner transition-all placeholder:text-white/10"
                     placeholder="0"
                   />
                </div>
                
                <div className="flex flex-col gap-4 w-full">
                  <AnimatedButton
                     onClick={handleSaveResult}
                     disabled={match.status === 'completed' && match.result?.teamAGoals === goalsA && match.result?.teamBGoals === goalsB}
                     loading={loading}
                     variant={match.status === 'completed' && match.result?.teamAGoals === goalsA && match.result?.teamBGoals === goalsB ? "secondary" : "primary"}
                     className="w-full h-14 text-sm font-black tracking-widest uppercase rounded-xl"
                  >
                     {match.status === 'completed' && match.result?.teamAGoals === goalsA && match.result?.teamBGoals === goalsB ? 'Resultado Guardado' : 'Guardar Resultado'}
                  </AnimatedButton>
                  <AnimatedButton
                     onClick={handleDelete}
                     variant="ghost"
                     className="w-full text-[10px] hover:text-red-500 text-gray-500 font-bold tracking-widest uppercase transition-colors"
                  >
                     Eliminar Partido
                  </AnimatedButton>
                </div>
             </div>
          </section>
  
          {/* Absents Section */}
          <section className="bg-[#111111] rounded-2xl border border-white/5 p-6 md:p-10 shadow-xl flex flex-col">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-bold tracking-tight text-white font-display">
                  Ausentes
                </h3>
                <span className="bg-white/5 text-gray-500 text-xs px-3 py-1 rounded-full font-bold border border-white/5">{notPlaying.length}</span>
             </div>
             <div className="flex-1 flex flex-wrap gap-2.5 content-start">
                {notPlaying.length === 0 ? (
                   <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center text-gray-700 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Ningún ausente</p>
                   </div>
                ) : (
                   notPlaying.map((p, i) => (
                      <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2 active:scale-95 transition-transform cursor-default hover:bg-white/10 hover:border-white/10"
                      >
                         <div className="w-1.5 h-1.5 rounded-full bg-red-500/20" />
                         <span className="font-semibold text-[11px] tracking-tight text-gray-500">{p.name}</span>
                      </motion.div>
                   ))
                )}
             </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function PitchSide({ team, isTop, theme, className }: { team: any; isTop: boolean; theme: 'dark' | 'light'; className?: string }) {
   const goalkeepers = team.players.filter((p: any) => p.primaryPos === 'POR');
   const outfieldPlayers = team.players.filter((p: any) => p.primaryPos !== 'POR');

   const positionOrder: any = { 'DEF': 1, 'MED': 2, 'DEL': 3 };
   outfieldPlayers.sort((a: any, b: any) => (positionOrder[a.primaryPos] || 9) - (positionOrder[b.primaryPos] || 9));

   const rows = [];
   for (let i = 0; i < outfieldPlayers.length; i += 3) {
     rows.push(outfieldPlayers.slice(i, i + 3));
   }

   const containerVariants = {
      hidden: { opacity: 0 },
      show: {
         opacity: 1,
         transition: { staggerChildren: 0.1 }
      }
   };
   
   return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn(
        "h-full flex items-center justify-center gap-8 md:gap-16 w-full opacity-90",
        isTop ? "flex-col md:flex-row" : "flex-col-reverse md:flex-row-reverse",
        className
      )}>
         <div className="flex flex-row md:flex-col justify-center gap-10 md:gap-14 w-full md:h-full md:w-auto">
            {goalkeepers.map((p: any, i: number) => <PlayerBubble key={p.id} player={p} theme={theme} index={i} />)}
         </div>
         {rows.map((row, rowIndex) => (
             <div key={rowIndex} className="flex flex-row md:flex-col justify-center gap-10 md:gap-14 w-full md:h-full md:w-auto">
                {row.map((p: any, i: number) => <PlayerBubble key={p.id} player={p} theme={theme} index={rowIndex * 3 + i + 1} />)}
             </div>
         ))}
      </motion.div>
   );
}

interface PlayerBubbleProps {
   key?: any;
   player: any;
   theme: 'dark' | 'light';
   index: number;
}

function PlayerBubble({ player, theme, index }: PlayerBubbleProps) {
   const [first, ...rest] = player.name.split(' ');
   const last = rest.join(' ');
   const isLight = theme === 'light';

   const itemVariants = {
      hidden: { opacity: 0, scale: 0 },
      show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } }
   };

   return (
      <motion.div 
        variants={itemVariants}
        className="flex flex-col items-center group cursor-pointer relative z-10 w-16 md:w-20"
      >
         <div className={cn(
           "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm md:text-base font-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-[3px] border-[#eaba3f] transition-transform group-hover:scale-110",
           isLight ? "bg-white text-[#0f2e1f]" : "bg-[#111111] text-white"
         )}>
            {player.number}
         </div>
         <div className="absolute top-full mt-2 flex flex-col items-center w-max">
            <span className="text-sm md:text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap text-center tracking-tight">
               {first.charAt(0)}. {last || first}
            </span>
         </div>
      </motion.div>
   );
}

function DroppableTeam({ id, name, players, theme }: { id: string, name: string, players: Player[], theme: 'dark' | 'light' }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isLight = theme === 'light';

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "bg-[#111111] p-5 rounded-2xl border transition-all duration-300 min-h-[160px] shadow-sm flex flex-col",
        isOver ? "border-[#eaba3f] bg-[#eaba3f]/5" : "border-white/5"
      )}
    >
       <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
          <span className={cn("text-xs font-black uppercase tracking-widest", isLight ? 'text-white' : 'text-[#eaba3f]')}>
            {name}
          </span>
          <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">{players.length}</span>
       </div>
       <div className="flex flex-wrap gap-2.5 flex-1 content-start">
          {players.map(p => <DraggablePlayer key={p.id} player={p} />)}
       </div>
    </div>
  );
}

function DraggablePlayer({ player }: { player: Player; key?: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.05)`,
    zIndex: 50,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={cn(
        "px-3 py-1.5 rounded-lg border text-xs font-bold cursor-grab active:cursor-grabbing transition-colors relative",
        isDragging ? "bg-[#eaba3f] text-black border-[#eaba3f] shadow-[0_0_20px_rgba(234,186,63,0.3)] shadow-[#eaba3f]" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-sm"
      )}
    >
      {player.name}
    </div>
  );
}
