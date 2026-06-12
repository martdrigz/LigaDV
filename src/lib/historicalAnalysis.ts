import { Match, Association, Player } from '../types';

export const generateAssociationId = (playerIds: string[]): string => {
  return [...playerIds].sort().join('_');
};

export const calculateEquilibriumScore = (goalsFor: number, goalsAgainst: number): number => {
  const diff = Math.abs(goalsFor - goalsAgainst);
  return Math.max(0, 10 - diff * 2);
};

export const getPlayerZone = (p: Player, teamPlayers: Player[], formationStr: string = '2-3-2'): string => {
  if (p.primaryPos === 'POR' || p.id.includes('gk')) return 'gk';
  const outfield = teamPlayers.filter(x => x.primaryPos !== 'POR' && !x.id.includes('gk'));
  const idx = outfield.findIndex(x => x.id === p.id);
  if (idx === -1) return 'gk';
  const counts = formationStr.split('-').map(Number);
  if (idx < counts[0]) return 'def';
  if (idx < (counts[0] + (counts[1] || 0))) return 'med';
  return 'att';
};

export const calculateAllAssociations = (matches: Match[], zoneFilter?: 'def' | 'med' | 'att'): Association[] => {
  const associations: Map<string, Association> = new Map();
  
  matches.forEach(match => {
    if (match.status !== 'completed' || !match.result) return;
    const { teamAGoals, teamBGoals } = match.result;
    
    const processTeam = (players: Player[], goalsFor: number, goalsAgainst: number, formation?: string) => {
      const f = formation || '2-3-2';
      
      // Filter players by zone if requested
      const relevantPlayers = zoneFilter 
        ? players.filter(p => getPlayerZone(p, players, f) === zoneFilter)
        : players;

      if (relevantPlayers.length < 2) return;

      for (let i = 0; i < relevantPlayers.length; i++) {
        for (let j = i + 1; j < relevantPlayers.length; j++) {
          const pair = [relevantPlayers[i].id, relevantPlayers[j].id];
          const id = generateAssociationId(pair);
          
          let assoc = associations.get(id);
          if (!assoc) {
            assoc = {
              id,
              playerIds: pair,
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              equilibriumScore: 0,
              cleanSheets: 0,
              zone: zoneFilter
            };
            associations.set(id, assoc);
          }
          
          assoc.matchesPlayed++;
          if (goalsFor > goalsAgainst) assoc.wins++;
          else if (goalsFor < goalsAgainst) assoc.losses++;
          else assoc.draws++;
          
          if (goalsAgainst === 0) {
              assoc.cleanSheets = (assoc.cleanSheets || 0) + 1;
          }
          
          assoc.goalsFor += goalsFor;
          assoc.goalsAgainst += goalsAgainst;
          
          const newEqScore = calculateEquilibriumScore(goalsFor, goalsAgainst);
          assoc.equilibriumScore = (assoc.equilibriumScore * (assoc.matchesPlayed - 1) + newEqScore) / assoc.matchesPlayed;
        }
      }
    };
    
    processTeam(match.teamA.players, teamAGoals, teamBGoals, match.teamA.formation);
    processTeam(match.teamB.players, teamBGoals, teamAGoals, match.teamB.formation);
  });
  
  return Array.from(associations.values());
};
