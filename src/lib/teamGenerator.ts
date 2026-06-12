import { Player, Team, Position, Match, Association } from '../types';
import { calculateAllAssociations } from './historicalAnalysis';

interface WeightedPlayer extends Player {
  calculatedScore: number;
  winRate: number;
}

export const generateBalancedTeams = (selectedPlayers: Player[], allMatches: Match[]): { teamA: Team, teamB: Team, balanceScore: number } => {
  // 1. Calculate Historical Performance (Win Rate)
  const playerStats: Record<string, { played: number, wins: number }> = {};
  allMatches.filter(m => m.status === 'completed').forEach(m => {
    const goalsA = m.result?.teamAGoals ?? 0;
    const goalsB = m.result?.teamBGoals ?? 0;
    
    m.teamA.players.forEach(p => {
      if (!playerStats[p.id]) playerStats[p.id] = { played: 0, wins: 0 };
      playerStats[p.id].played++;
      if (goalsA > goalsB) playerStats[p.id].wins++;
    });
    
    m.teamB.players.forEach(p => {
      if (!playerStats[p.id]) playerStats[p.id] = { played: 0, wins: 0 };
      playerStats[p.id].played++;
      if (goalsB > goalsA) playerStats[p.id].wins++;
    });
  });

  // 2. Map players to WeightedPlayers with a single "Audit Score"
  // Weights (Audit Standard): Habilidad 40% (x4), Velocidad 20% (x2), Posición 15% (x1.5), Rendimiento 25% (x2.5)
  // Normalized to 1-10 scale
  const weightedPlayers: WeightedPlayer[] = selectedPlayers.map(p => {
    const stats = playerStats[p.id] || { played: 0, wins: 0 };
    const winRate = stats.played > 0 ? stats.wins / stats.played : 0.5; // Average if new
    
    // Position score (Primary 10, Secondary handled during distribution)
    const skillScore = p.skill * 4;         // 40%
    const speedScore = p.speed * 2;         // 20%
    const perfScore = (winRate * 10) * 2.5; // 25%
    const posScore = 10 * 1.5;              // 15% (constant here, used for sorting)
    
    return {
      ...p,
      calculatedScore: (skillScore + speedScore + perfScore + posScore) / 10,
      winRate
    };
  });

  // 3. Historical Associations
  const allAssociations = calculateAllAssociations(allMatches);
  const associationsMap = new Map(allAssociations.map(a => [a.id, a]));

  const calculateTeamStats = (players: Player[]) => {
    const skill = players.reduce((sum, p) => sum + p.skill, 0);
    const speed = players.reduce((sum, p) => sum + p.speed, 0);
    
    // Association Bonus
    let assocBonus = 0;
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const pairId = [players[i].id, players[j].id].sort().join('_');
            const assoc = associationsMap.get(pairId);
            if (assoc && assoc.matchesPlayed >= 2) {
                // Dominance detection: If pair has high win rate, they add "Strength" to the team score
                // Logic: (WinRate - 0.5) * ConfidenceFactor
                // Confidence factor increases with matches played
                const winRate = assoc.wins / assoc.matchesPlayed;
                const confidence = Math.min(assoc.matchesPlayed / 5, 2); // Cap at 5 matches for max confidence weight
                assocBonus += (winRate - 0.5) * confidence;
            }
        }
    }

    return { skill, speed, assocBonus };
  };

  // 4. Team Generation via Multiple Shuffles (Monte Carlo approach)
  // We perform 1000 shuffles and pick the one with the lowest total variance
  let bestAttempt: { teamA: Player[], teamB: Player[], score: number } | null = null;

  for (let attempt = 0; attempt < 500; attempt++) {
    // Separate by primary positions
    const byPos: Record<Position, WeightedPlayer[]> = {
        POR: [], DEF: [], MED: [], DEL: []
    };
    weightedPlayers.forEach(p => byPos[p.primaryPos].push(p));
    
    const teamA: WeightedPlayer[] = [];
    const teamB: WeightedPlayer[] = [];

    // Distribute randomly but balanced
    Object.keys(byPos).forEach(pos => {
        const players = [...byPos[pos as Position]].sort(() => Math.random() - 0.5);
        players.forEach(p => {
            // Priority: keep lengths even, then balance scores
            const scoreA = teamA.reduce((sum, x) => sum + x.calculatedScore, 0);
            const scoreB = teamB.reduce((sum, x) => sum + x.calculatedScore, 0);
            
            if (teamA.length < teamB.length) {
                teamA.push(p);
            } else if (teamB.length < teamA.length) {
                teamB.push(p);
            } else {
                if (scoreA <= scoreB) teamA.push(p);
                else teamB.push(p);
            }
        });
    });

    const statsA = calculateTeamStats(teamA);
    const statsB = calculateTeamStats(teamB);
    
    const scoreA = teamA.reduce((sum, x) => sum + x.calculatedScore, 0) + statsA.assocBonus;
    const scoreB = teamB.reduce((sum, x) => sum + x.calculatedScore, 0) + statsB.assocBonus;
    
    const variance = Math.abs(scoreA - scoreB);
    
    if (!bestAttempt || variance < bestAttempt.score) {
        bestAttempt = { teamA, teamB, score: variance };
    }
  }

  const resultA = bestAttempt!.teamA;
  const resultB = bestAttempt!.teamB;
  const finalStatsA = calculateTeamStats(resultA);
  const finalStatsB = calculateTeamStats(resultB);

  return {
    teamA: {
      name: "Bellotti FC",
      players: resultA,
      teamSkill: finalStatsA.skill,
      teamSpeed: finalStatsA.speed
    },
    teamB: {
      name: "Fluvito",
      players: resultB,
      teamSkill: finalStatsB.skill,
      teamSpeed: finalStatsB.speed
    },
    balanceScore: 10 - Math.min(10, bestAttempt!.score) // 10 is perfect balance
  };
};

