import React, { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { AnimatedButton } from '../components/ui/animated-button';
import { Link, useNavigate } from 'react-router-dom';
import { getMatches, deleteMatch, getPlayers } from '../lib/storage';
import { Calendar, Users, Trophy, ChevronRight, Clock, MapPin, Shield, Plus, Edit2, Trash2, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { PinModal } from '../components/PinModal';
import { Match, Player } from '../types';
import { useFirebase } from '../components/FirebaseProvider';

export function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useFirebase();

  const sortedMatches = [...allMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const upcomingMatches = sortedMatches.filter(m => m.status === 'scheduled');
  const pastMatches = sortedMatches.filter(m => m.status === 'completed');
  
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'edit' | 'delete', matchId: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matches, players] = await Promise.all([getMatches(), getPlayers()]);
        setAllMatches(matches);
        setAllPlayers(players);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initiateEdit = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingAction({ type: 'edit', matchId: id });
    setPinModalOpen(true);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingAction({ type: 'delete', matchId: id });
    setPinModalOpen(true);
  };

  const handlePinSuccess = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'edit') {
      navigate(`/match/${pendingAction.matchId}`);
    } else if (pendingAction.type === 'delete') {
      await deleteMatch(pendingAction.matchId);
      setAllMatches(await getMatches());
    }
    setPendingAction(null);
  };

  useGSAP(() => {
    if (loading) return;
    
    const tl = gsap.timeline();
    tl.from('.hero-title', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power4.out',
      delay: 0.2
    })
    .from('.hero-subtitle', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.5')
    .from('.hero-buttons > *', {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'back.out(1.7)'
    }, '-=0.3');
  }, { scope: containerRef, dependencies: [loading] });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#eaba3f] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Iniciando MatchDay...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-10 pb-4">
      <PinModal 
        isOpen={pinModalOpen} 
        onClose={() => { setPinModalOpen(false); setPendingAction(null); }} 
        onSuccess={handlePinSuccess} 
      />
      
      {/* High-Impact Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 px-6 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 shadow-2xl">
        {/* Background Image with Gradient Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.65] sm:block hidden"
          style={{ 
            backgroundImage: 'url("https://demo.martinrod.com/images/pre-match-big.jpg")',
            backgroundSize: '150%',
            backgroundPosition: 'center 26%',
          }}
        />
        <div 
          className="absolute inset-0 z-0 opacity-[0.65] sm:hidden block"
          style={{ 
            backgroundImage: 'url("https://demo.martinrod.com/images/pre-match-big.jpg")',
            backgroundSize: '342%',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/40 to-transparent" />
        
        {/* Abstract Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#eaba3f]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="hero-title mb-1">
            <h1 className="text-6xl md:text-8xl font-extrabold italic tracking-tighter leading-none text-white font-display">
              MatchDay
            </h1>
          </div>
          
          <div className="hero-subtitle mb-30">
            <p className="text-lg md:text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2 drop-shadow-lg">
              Fluvito <span className="text-[#eaba3f] italic font-medium px-1">vs</span> Bellotti FC
            </p>
          </div>

          <div className="hero-buttons flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto px-4" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
            <Link 
              to="/setup" 
              id="hero-new-sorteo"
              className="flex-1 bg-[#eaba3f] text-black py-4 px-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#eaba3f]/20 active:scale-95 transition-transform whitespace-nowrap"
              style={{ paddingLeft: '12px', paddingRight: '12px', width: '238px' }}
            >
              <Plus size={20} strokeWidth={3} />
              <span className="text-sm">Nuevo Sorteo</span>
            </Link>
            <Link 
              to="/roster" 
              id="hero-jugadores"
              className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform whitespace-nowrap min-w-[140px]"
            >
              <Users size={20} className="text-gray-400" />
              <span className="text-sm">Jugadores</span>
            </Link>
            {isAdmin && (
              <AnimatedButton
                onClick={() => {
                  const csvData = allMatches.flatMap(m => [
                    {
                      MatchID: m.id,
                      Fecha: format(new Date(m.date), 'yyyy-MM-dd'),
                      Hora: format(new Date(m.date), 'HH:mm'),
                      Lugar: m.reservation?.field || m.location || 'Local',
                      Temporada: m.season || '-',
                      FechaNro: m.matchday || '-',
                      Equipo: 'Bellotti FC',
                      Goles: m.result?.teamAGoals ?? '-',
                      Jugadores: m.teamA.players.map(p => `${p.name} (#${p.number})`).join(';'),
                      PlayerIDs: m.teamA.players.map(p => p.id).join(';'),
                      Resultado: (m.result?.teamAGoals ?? 0) > (m.result?.teamBGoals ?? 0) ? 'Victoria' : (m.result?.teamAGoals ?? 0) < (m.result?.teamBGoals ?? 0) ? 'Derrota' : 'Empate'
                    },
                    {
                      MatchID: m.id,
                      Fecha: format(new Date(m.date), 'yyyy-MM-dd'),
                      Hora: format(new Date(m.date), 'HH:mm'),
                      Lugar: m.reservation?.field || m.location || 'Local',
                      Temporada: m.season || '-',
                      FechaNro: m.matchday || '-',
                      Equipo: 'Fluvito',
                      Goles: m.result?.teamBGoals ?? '-',
                      Jugadores: m.teamB.players.map(p => `${p.name} (#${p.number})`).join(';'),
                      PlayerIDs: m.teamB.players.map(p => p.id).join(';'),
                      Resultado: (m.result?.teamBGoals ?? 0) > (m.result?.teamAGoals ?? 0) ? 'Victoria' : (m.result?.teamBGoals ?? 0) < (m.result?.teamAGoals ?? 0) ? 'Derrota' : 'Empate'
                    }
                  ]);
                  
                  const csv = Papa.unparse(csvData);
                  // Add BOM for Excel UTF-8 support
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `historial_matchday_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                variant="secondary"
                className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform whitespace-nowrap min-w-[180px]"
              >
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm">Exportar Historial</span>
              </AnimatedButton>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="text-lg font-bold tracking-tight text-white font-display">Próximos Partidos</h3>
          </div>
          <div className="space-y-4">
            {upcomingMatches.map(match => (
              <div 
                key={match.id}
                onClick={() => navigate(`/match/${match.id}`)}
                className="block bg-[#111111] rounded-2xl border border-white/5 overflow-hidden active:scale-[0.98] transition-transform shadow-sm cursor-pointer"
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#151515]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#eaba3f]"></span>
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {match.season && match.matchday ? `${match.season} • Fecha ${match.matchday}` : "Jornada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => initiateEdit(e, match.id)}
                      className="p-1.5 text-gray-500 hover:text-white bg-white/5 rounded-full transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => initiateDelete(e, match.id)}
                      className="p-1.5 text-gray-500 hover:text-red-500 bg-white/5 rounded-full transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                      <div className="mb-2 w-24 sm:w-32 md:w-40">
                        <img 
                          src="https://demo.martinrod.com/images/Escudo-BELLOTTI-FC.png" 
                          alt="Bellotti FC" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-bold text-sm tracking-tight text-white">Bellotti FC</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white tracking-tight">VS</span>
                  </div>
                  
                  <div className="flex flex-col items-center flex-1">
                      <div className="mb-2 w-24 sm:w-32 md:w-40">
                          <img 
                          src="https://demo.martinrod.com/images/Escudo-FLU-DV.png" 
                          alt="Fluvito" 
                          className="w-full h-full object-contain opacity-90"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-bold text-sm tracking-tight text-white">Fluvito</span>
                  </div>
                </div>
                <div className="p-4 bg-[#151515]/50 border-t border-white/5 flex items-center justify-center gap-6 text-xs font-semibold text-gray-400">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {format(new Date(match.date), 'dd MMM', { locale: es })}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {format(new Date(match.date), 'HH:mm')}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {match.location || 'Local'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Results */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1 mt-8">
           <h3 className="text-lg font-bold tracking-tight text-white font-display">Últimos Resultados</h3>
           <Link to="/stats" className="text-xs font-semibold text-[#eaba3f] flex items-center gap-1">Ver Estadística <ChevronRight size={14}/></Link>
        </div>
        
        <div className="space-y-2">
          {pastMatches.length === 0 ? (
            <div className="p-8 bg-[#111111] rounded-2xl border border-white/5 text-center text-sm font-medium text-gray-500">
              No hay historial disponible
            </div>
          ) : (
            pastMatches.map(match => (
               <div 
                  key={match.id}
                  onClick={() => navigate(`/match/${match.id}`)}
                  className="flex items-center justify-between p-4 bg-[#111111] rounded-2xl border border-white/5 active:scale-[0.98] transition-transform shadow-sm cursor-pointer group"
                >
                  <div className="w-16 text-center shrink-0">
                    <span className="text-base font-semibold text-[#eaba3f] uppercase block mb-0.5 whitespace-nowrap">
                      {match.season && match.matchday ? `T${match.season.toString().replace(/\D/g, '').slice(-2)} F${match.matchday}` : match.matchday ? `F${match.matchday}` : "AM"}
                    </span>
                    <span className="text-sm font-semibold text-gray-500 uppercase block">{format(new Date(match.date), 'dd MMM', { locale: es })}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2 border-l border-white/5 pl-4 overflow-hidden" style={{ margin: '0 16px' }}>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate mr-2">
                           <img 
                              src="https://demo.martinrod.com/images/Escudo-BELLOTTI-FC.png" 
                              alt="" 
                              className="w-10 h-10 object-contain"
                              referrerPolicy="no-referrer"
                           />
                           <span className="text-base font-bold text-white truncate">Bellotti FC</span>
                        </div>
                        <span className={`text-xl font-black ${(match.result?.teamAGoals ?? 0) > (match.result?.teamBGoals ?? 0) ? 'text-[#eaba3f]' : 'text-gray-500'}`}>
                          {match.result?.teamAGoals ?? '-'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate mr-2">
                           <img 
                              src="https://demo.martinrod.com/images/Escudo-FLU-DV.png" 
                              alt="" 
                              className="w-10 h-10 object-contain"
                              referrerPolicy="no-referrer"
                           />
                           <span className="text-base font-bold text-white truncate">Fluvito</span>
                        </div>
                        <span className={`text-xl font-black ${(match.result?.teamBGoals ?? 0) > (match.result?.teamAGoals ?? 0) ? 'text-[#eaba3f]' : 'text-gray-500'}`}>
                          {match.result?.teamBGoals ?? '-'}
                        </span>
                     </div>
                  </div>

                  {isAdmin && (
                    <div className="pl-4 ml-4 border-l border-white/5 flex flex-col items-center gap-2 shrink-0">
                      <button 
                        onClick={(e) => initiateEdit(e, match.id)}
                        className="p-1.5 text-gray-500 hover:text-white bg-white/5 rounded-full transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => initiateDelete(e, match.id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 bg-white/5 rounded-full transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
               </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
