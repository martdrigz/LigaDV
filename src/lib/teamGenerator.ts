import { Player, Team, Position } from '../types';

export const generateBalancedTeams = (selectedPlayers: Player[]): { teamA: Team, teamB: Team } => {
  const teamA: Player[] = [];
  const teamB: Player[] = [];
  
  let statsA = { skill: 0, speed: 0 };
  let statsB = { skill: 0, speed: 0 };

  const positions: Position[] = ['POR', 'DEF', 'MED', 'DEL'];
  
  // Balance position by position
  positions.forEach(pos => {
    const playersInPos = selectedPlayers
      .filter(p => p.primaryPos === pos)
      .sort((a, b) => (b.skill + b.speed) - (a.skill + a.speed));

    playersInPos.forEach(player => {
      // Logic: assign to the team that is currently "weaker" in the combined metric 
      // or has fewer players in this specific round to keep counts even
      const scoreA = statsA.skill * 1.2 + statsA.speed;
      const scoreB = statsB.skill * 1.2 + statsB.speed;

      const shouldGoToA = teamA.length <= teamB.length && (scoreA <= scoreB);

      if (shouldGoToA) {
        teamA.push(player);
        statsA.skill += player.skill;
        statsA.speed += player.speed;
      } else {
        teamB.push(player);
        statsB.skill += player.skill;
        statsB.speed += player.speed;
      }
    });
  });

  return {
    teamA: {
      name: "Bellotti FC",
      players: teamA,
      teamSkill: statsA.skill,
      teamSpeed: statsA.speed
    },
    teamB: {
      name: "Fluvito",
      players: teamB,
      teamSkill: statsB.skill,
      teamSpeed: statsB.speed
    }
  };
};
