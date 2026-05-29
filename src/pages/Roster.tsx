import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Player, Position, PlayerStats } from '../types';
import { playerSchema } from '../schemas';
import { getPlayers, savePlayers, savePlayer as saveSinglePlayer, deletePlayer as deleteSinglePlayer, getPlayerStats } from '../lib/storage';
import { Upload, Users, Search, Trash2, UserPlus, Pencil, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { PinModal } from '../components/PinModal';
import { AnimatedModal } from '../components/ui/animated-modal';
import { AnimatedButton } from '../components/ui/animated-button';
import { useFirebase } from '../components/FirebaseProvider';

export function Roster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<{ type: 'reset' | 'append' | 'edit' | 'delete', player?: Player }>({ type: 'reset' });
  const [importMode, setImportMode] = useState<'append' | 'reset'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await getPlayers();
      // Apply the specific fix if needed
      let needsSave = false;
      const updated = list.map(p => {
        if (p.name.toLowerCase().includes('piuquén manzoni') && p.number !== 0) {
          needsSave = true;
          return { ...p, number: 0 };
        }
        return p;
      });
      
      if (needsSave) {
        await savePlayers(updated);
        setPlayers(updated);
      } else {
        setPlayers(list);
      }

      const statsArray = await getPlayerStats();
      const statsMap = statsArray.reduce((acc, stat) => {
        acc[stat.playerId] = stat;
        return acc;
      }, {} as Record<string, PlayerStats>);
      setPlayerStats(statsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerImport = (mode: 'append' | 'reset') => {
    setImportMode(mode);
    setPinAction({ type: mode });
    setIsPinModalOpen(true);
  };

  const performImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const skillMap: Record<string, number> = {
          'excelente': 9, 'muy buena': 8, 'buena': 7, 'regular': 5, 'mala': 3, 's/d': 4
        };
        
        const posMap: Record<string, Position> = {
          'defensor': 'DEF', 'defensores': 'DEF', 'defensa': 'DEF', 
          'mediocampo': 'MED', 'mediocampista': 'MED', 'volante': 'MED',
          'delantero': 'DEL', 'ataque': 'DEL', 'punta': 'DEL',
          'arquero': 'POR', 'portero': 'POR', 'goalkeeper': 'POR'
        };

        const importedPlayers: Player[] = results.data.map((row: any) => {
          const findVal = (terms: string[]) => {
            const key = Object.keys(row).find(k => 
              terms.some(t => k.toLowerCase().trim().includes(t.toLowerCase()))
            );
            return key ? row[key] : null;
          };

          const rawName = findVal(['player', 'nombre', 'jugador']) || 'Desconocido';
          const rawNum = findVal(['numero', 'number', '#']) || '0';
          const rawSkill = findVal(['habil', 'skill', 'puntaje']) || 'Regular';
          const rawSpeed = findVal(['veloc', 'speed', 'correr']) || 'Regular';
          const rawPos1 = findVal(['posic', 'puesto 1', 'primary']) || 'MED';
          
          const rawPos2Key = Object.keys(row).find(k => 
             k.toLowerCase().includes('posic') && k.toLowerCase().includes('2')
          );
          const finalPos2 = rawPos2Key ? row[rawPos2Key] : findVal(['posic 2', 'secondary']) || 'MED';

          const mapStat = (val: any) => {
            if (!val) return 5;
            const clean = val.toString().toLowerCase().trim();
            if (!isNaN(Number(clean)) && clean !== '') return Number(clean);
            return skillMap[clean] || 5;
          };

          const mapPos = (val: any): Position => {
            if (!val) return 'MED';
            const clean = val.toString().toLowerCase().trim();
            for (const [key, maped] of Object.entries(posMap)) {
              if (clean.includes(key)) return maped;
            }
            return 'MED';
          };

          return {
            id: Math.random().toString(36).substr(2, 9),
            name: rawName.toString().trim(),
            number: parseInt(rawNum.toString().replace(/[^0-9]/g, '') || '0', 10),
            skill: mapStat(rawSkill),
            speed: mapStat(rawSpeed),
            primaryPos: mapPos(rawPos1),
            secondaryPos: mapPos(finalPos2),
          };
        });
        
        setLoading(true);
        setIsSaving(true);
        try {
          if (importMode === 'reset') {
            await savePlayers(importedPlayers);
          } else {
            await savePlayers(importedPlayers);
          }
          await fetchData();
          alert(`${importedPlayers.length} jugadores importados con éxito.`);
        } catch (error) {
          console.error(error);
          alert('Error al importar jugadores');
        } finally {
          setIsSaving(false);
          setLoading(false);
        }
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('Error al procesar el archivo CSV: ' + error.message);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deletePlayerAction = (id: string, player: Player) => {
    setPinAction({ type: 'delete', player });
    setIsPinModalOpen(true);
  };

  const performDeletePlayer = async (id: string) => {
    setIsSaving(true);
    setLoading(true);
    try {
      await deleteSinglePlayer(id);
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  const handleSavePlayer = async (playerData: Omit<Player, 'id'>) => {
    setIsSaving(true);
    try {
      if (selectedPlayer) {
        await saveSinglePlayer({ ...playerData, id: selectedPlayer.id });
      } else {
        const newPlayer: Player = {
          ...playerData,
          id: Math.random().toString(36).substr(2, 9),
        };
        await saveSinglePlayer(newPlayer);
      }
      await fetchData();
      setIsModalOpen(false);
      setSelectedPlayer(undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setSelectedPlayer(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setPinAction({ type: 'edit', player });
    setIsPinModalOpen(true);
  };

  const performEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const { user } = useFirebase();

  if (loading && players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#eaba3f] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando Roster...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <PlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePlayer}
        player={selectedPlayer}
        loading={isSaving}
      />
      
      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pinAction.type === 'reset' || pinAction.type === 'append') {
            performImport();
          } else if (pinAction.type === 'edit' && pinAction.player) {
            performEditPlayer(pinAction.player);
          } else if (pinAction.type === 'delete' && pinAction.player) {
            performDeletePlayer(pinAction.player.id);
          }
        }} 
      />

      {user && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-white font-display">Jugadores</h2>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-400 pl-0.5">
              <Users size={16} className="text-[#eaba3f]" /> Gestión de jugadores y fichajes
            </div>
          </div>
          
          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2">
            <AnimatedButton
              onClick={openAddModal}
              variant="primary"
              loading={isSaving}
              className="flex-1 md:flex-none justify-center"
            >
              <UserPlus size={14} /> <span>AGREGAR</span><span className="hidden md:inline"> JUGADOR</span>
            </AnimatedButton>

            <AnimatedButton
              onClick={() => triggerImport('append')}
              variant="secondary"
              loading={isSaving}
              className="flex-1 md:flex-none justify-center"
            >
              <Upload size={14} /> <span>IMPORTAR</span><span className="hidden md:inline"> LISTA CSV</span>
            </AnimatedButton>

            <AnimatedButton
              onClick={() => {
                setPinAction({ type: 'reset' });
                setIsPinModalOpen(true);
              }}
              variant="secondary"
              loading={isSaving}
              className="flex-1 md:flex-none justify-center hover:border-red-500/30 group"
            >
              <Trash2 size={14} className="text-red-500 group-hover:scale-110 transition-transform" /> <span>RESETEAR</span>
            </AnimatedButton>
            
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      )}

      {!user && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-white font-display">Jugadores</h2>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-400 pl-0.5">
              <Users size={16} className="text-[#eaba3f]" /> Roster oficial del Torneo
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Buscar jugador..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-[#eaba3f] transition-all text-white placeholder:text-gray-600 shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-[#111111] border border-white/5 rounded-2xl">
            <Users size={40} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest text-center">No se encontraron jugadores</p>
          </div>
        ) : (
          filteredPlayers.sort((a,b) => (a.number || 0) - (b.number || 0)).map(p => (
            <div key={p.id} className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-[#eaba3f]/30 transition-all hover:bg-white/[0.02] group relative">
              <div className="w-12 h-12 flex-none rounded-xl bg-black border border-white/10 flex items-center justify-center text-xl font-bold text-[#eaba3f] shadow-inner">
                {p.number === 0 ? "00" : p.number || '-'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  <span className="font-bold text-white truncate cursor-default leading-tight">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                        p.primaryPos === 'DEF' && "bg-blue-500/10 text-blue-400",
                        p.primaryPos === 'MED' && "bg-emerald-500/10 text-emerald-400",
                        p.primaryPos === 'DEL' && "bg-red-500/10 text-red-400",
                        p.primaryPos === 'POR' && "bg-yellow-500/10 text-yellow-500",
                      )}>
                        {p.primaryPos}
                      </span>
                      {p.secondaryPos && p.secondaryPos !== p.primaryPos && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-white/5 text-gray-400 border border-white/5">
                          {p.secondaryPos}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-400 uppercase ml-1">
                      <span>PJ {playerStats[p.id]?.matchesPlayed || 0}</span>
                      <span className="text-gray-700">•</span>
                      <span>V {playerStats[p.id]?.wins || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(p)}
                  className="p-1.5 text-gray-500 hover:text-[#eaba3f] transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => deletePlayerAction(p.id, p)}
                  className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PlayerModal({ isOpen, onClose, onSave, player, loading }: { isOpen: boolean; onClose: () => void; onSave: (p: Omit<Player, 'id'>) => void; player?: Player; loading?: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    skill: '7',
    speed: '7',
    primaryPos: 'MED' as Position,
    secondaryPos: 'MED' as Position,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
    if (player) {
      setFormData({
        name: player.name,
        number: player.number.toString(),
        skill: player.skill.toString(),
        speed: player.speed.toString(),
        primaryPos: player.primaryPos,
        secondaryPos: player.secondaryPos,
      });
    } else {
      setFormData({ name: '', number: '', skill: '7', speed: '7', primaryPos: 'MED', secondaryPos: 'MED' });
    }
  }, [player, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = playerSchema.omit({ id: true }).safeParse({
      name: formData.name,
      number: formData.number,
      skill: formData.skill,
      speed: formData.speed,
      primaryPos: formData.primaryPos,
      secondaryPos: formData.secondaryPos,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      name: result.data.name,
      number: result.data.number,
      skill: result.data.skill,
      speed: result.data.speed,
      primaryPos: result.data.primaryPos,
      secondaryPos: result.data.secondaryPos,
    });
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md"
      title={player ? "Editar Jugador" : "Nuevo Jugador"}
      description={player ? "Actualiza los datos del jugador" : "Completa los datos del fichaje"}
      icon={player ? <Pencil className="text-[#eaba3f]" size={24} /> : <UserPlus className="text-[#eaba3f]" size={24} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                "w-full bg-black/50 border rounded-xl p-3 text-white outline-none focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f]/50 transition-all shadow-inner",
                errors.name ? "border-red-500/50" : "border-white/10"
              )}
              placeholder="Ej. Leo Messi"
            />
            {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.name}</p>}
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Número</label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className={cn(
                "w-full bg-black/50 border rounded-xl p-3 text-white outline-none focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f]/50 transition-all shadow-inner",
                errors.number ? "border-red-500/50" : "border-white/10"
              )}
              placeholder="Ej. 10"
            />
            {errors.number && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.number}</p>}
          </div>

          <div>
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1 flex justify-between">
               <span>Habilidad</span> <span>{formData.skill}</span>
             </label>
             <input
               type="range" min="1" max="10"
               value={formData.skill}
               onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
               className="w-full h-2 rounded-full cursor-pointer appearance-none bg-white/10 accent-[#eaba3f]"
             />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1 flex justify-between">
               <span>Velocidad</span> <span>{formData.speed}</span>
             </label>
            <input
              type="range" min="1" max="10"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
              className="w-full h-2 rounded-full cursor-pointer appearance-none bg-white/10 accent-[#eaba3f]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Posición Principal</label>
               <select 
                  value={formData.primaryPos}
                  onChange={(e) => setFormData({...formData, primaryPos: e.target.value as Position})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none appearance-none font-medium"
               >
                  <option value="POR">POR (Arquero)</option>
                  <option value="DEF">DEF (Defensor)</option>
                  <option value="MED">MED (Medio)</option>
                  <option value="DEL">DEL (Delantero)</option>
               </select>
            </div>

            <div>
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Posición Secundaria</label>
               <select 
                  value={formData.secondaryPos}
                  onChange={(e) => setFormData({...formData, secondaryPos: e.target.value as Position})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none appearance-none font-medium"
               >
                  <option value="DEF">DEF (Defensor)</option>
                  <option value="MED">MED (Medio)</option>
                  <option value="DEL">DEL (Delantero)</option>
               </select>
            </div>
          </div>
        </div>

        <AnimatedButton
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full mt-6 text-sm tracking-widest uppercase font-black"
        >
          {player ? "Confirmar Edición" : "Confirmar Fichaje"}
        </AnimatedButton>
      </form>
    </AnimatedModal>
  );
}
