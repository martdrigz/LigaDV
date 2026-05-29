import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '../types';
import { matchSchema } from '../schemas';
import { getPlayers, saveMatch, getMatches } from '../lib/storage';
import { generateBalancedTeams } from '../lib/teamGenerator';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedButton } from '../components/ui/animated-button';

export function MatchSetup() {
  const navigate = useNavigate();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('17:00');
  const [location, setLocation] = useState('OPEN GALLO');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const players = await getPlayers();
        setAllPlayers(players);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const togglePlayer = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleGenerate = async () => {
    if (selectedIds.size < 10) {
      alert("Selecciona al menos 10 jugadores.");
      return;
    }

    const validation = matchSchema.pick({ date: true, location: true }).safeParse({
      date: new Date(`${date}T${time}`).toISOString(),
      location: location,
    });

    if (!validation.success) {
      alert("Configuración inválida: " + validation.error.issues[0].message);
      return;
    }

    const playing = allPlayers.filter(p => selectedIds.has(p.id));
    const { teamA, teamB } = generateBalancedTeams(playing);
    
    const matchDate = new Date(`${date}T${time}`);
    const matchYear = matchDate.getFullYear();
    const seasonName = `Torneo ${matchYear}`;
    
    setLoading(true);
    try {
      // Calculate matchday for this season
      const existingMatches = await getMatches();
      const matchesInSeason = existingMatches.filter(m => {
        if (m.season) return m.season === seasonName;
        return new Date(m.date).getFullYear() === matchYear;
      });
      const matchday = matchesInSeason.length + 1;

      const newMatch = {
        id: Math.random().toString(36).substr(2, 9),
        date: matchDate.toISOString(),
        location: location,
        season: seasonName,
        matchday: matchday,
        teamA: teamA,
        teamB: teamB,
        status: 'scheduled' as const
      };

      await saveMatch(newMatch);
      navigate(`/match/${newMatch.id}`);
    } catch (e) {
      console.error(e);
      alert('Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = allPlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold tracking-tight text-white font-display">Sorteo de equipos</h2>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 pl-0.5">
          <MapPin size={16} className="text-[#eaba3f]" /> Configuración de equipos y estadio
        </div>
      </div>

      <div className="flex flex-col gap-8 items-start">
        {/* Top Section: Details */}
        <div className="w-full space-y-6">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-tight text-gray-400 font-display">Detalles del partido</h3>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#eaba3f] uppercase tracking-wider">Fecha / Hora</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-black border border-white/10 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#eaba3f] transition-colors text-white"
                    />
                    <input 
                      type="time" 
                      value={time} 
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-black border border-white/10 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#eaba3f] transition-colors text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold tracking-tight text-gray-400 font-display">Ubicación y estadio</h3>
              <div className="space-y-2">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Estadio / Campo..."
                    className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm font-medium outline-none focus:border-[#eaba3f] transition-colors text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Convocatoria */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <span className="text-base font-bold tracking-tight text-white font-display">Convocatoria</span>
               <div className="bg-[#eaba3f] text-black text-[10px] font-bold px-3 py-1 rounded-full">
                  {selectedIds.size} jugadores
               </div>
            </div>
            
            <div className="relative w-48 hidden sm:block">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
               <input 
                  type="text" 
                  placeholder="FILTRAR..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-lg pl-9 pr-2 py-1.5 text-[10px] font-bold outline-none text-white tracking-widest placeholder:text-gray-700"
               />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-[480px] overflow-y-auto pr-2 custom-scrollbar content-start">
             {allPlayers.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-600 h-full border border-white/5 rounded-2xl bg-[#111111]">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sin jugadores</p>
                </div>
             ) : (
                filteredPlayers.map(p => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      key={p.id} 
                      onClick={() => togglePlayer(p.id)}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'bg-[#eaba3f]/10 border-[#eaba3f]/40' 
                          : 'bg-[#111111] border-white/5 hover:border-white/10'
                      }`}
                    >
                       <div className={`w-10 h-10 flex-none rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${
                          isSelected 
                            ? 'bg-[#eaba3f] border-[#eaba3f] text-black' 
                            : 'bg-black border-white/10 text-gray-400'
                       }`}>
                         {p.number}
                       </div>
                       <div className="flex flex-col min-w-0">
                         <span className={`font-bold text-sm tracking-tight truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                           {p.name}
                         </span>
                         <div className="flex items-center gap-2 text-[9px] font-semibold text-gray-500 uppercase mt-0.5">
                           <span>{p.primaryPos}</span>
                           <span className="text-gray-700">•</span>
                           <span>HB {p.skill}</span>
                         </div>
                       </div>
                    </motion.button>
                  );
                })
             )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-[70px] md:bottom-8 left-0 right-0 px-4 md:px-0 md:max-w-7xl md:mx-auto z-10 pointer-events-none flex justify-center">
        <AnimatedButton
          onClick={handleGenerate}
          disabled={selectedIds.size < 10}
          loading={loading}
          size="lg"
          className="pointer-events-auto w-full max-w-sm h-14"
        >
          Realizar sorteo
        </AnimatedButton>
      </div>
    </div>
  );
}
