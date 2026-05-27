export type Position = 'POR' | 'DEF' | 'MED' | 'DEL';

export interface Player {
  id: string;
  name: string;
  number: number;
  skill: number;        // 1-10 (si juega bien)
  speed: number;        // 1-10 (si corre)
  primaryPos: Position; // 1st position
  secondaryPos: Position; // 2nd position
}

export interface PlayerStats {
  playerId: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goals?: number; // Optional placeholder for future
}

export interface Team {
  name: string;
  players: Player[];
  teamSkill: number;
  teamSpeed: number;
}

export interface Match {
  id: string;
  date: string;
  location: string;
  season?: string; // e.g. "Torneo 2026"
  matchday?: number; // e.g. 1, 2, ...
  teamA: Team; // Bellotti FC
  teamB: Team; // Fluvito
  result?: {
    teamAGoals: number;
    teamBGoals: number;
  };
  status: 'scheduled' | 'completed';
}
