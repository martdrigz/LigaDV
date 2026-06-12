export type Position = 'POR' | 'DEF' | 'MED' | 'DEL';

export interface Player {
  id: string;
  name: string;
  number: number;
  skill: number;        // 1-10 (si juega bien)
  speed: number;        // 1-10 (si corre)
  primaryPos: Position; // 1st position
  secondaryPos: Position; // 2nd position
  imageUrl?: string;
}

export interface PlayerStats {
  playerId: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
}

export interface Association {
  id: string; // Hash of sorted player IDs
  playerIds: string[];
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  equilibriumScore: number;
  cleanSheets?: number;
  zone?: 'def' | 'med' | 'att';
}

export interface Team {
  name: string;
  players: Player[];
  teamSkill: number;
  teamSpeed: number;
  formation?: string;
}

export interface MatchPlayerStat {
  playerId: string;
  goals: number;
  assists: number;
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
  reservation?: {
    reservedBy?: string; // Player ID
    field?: string;      // e.g. "Open Gallo"
    playerCount?: number; // e.g. 5, 7
  };
  playerStats?: MatchPlayerStat[];
  status: 'scheduled' | 'completed';
}
