import { collection, getDocs, setDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Player, Match, PlayerStats } from '../types';
import { handleFirestoreError, OperationType } from '../components/FirebaseProvider';

const PLAYERS_COLLECTION = 'players';
const MATCHES_COLLECTION = 'matches';

export const getPlayers = async (): Promise<Player[]> => {
  try {
    const playersSnapshot = await getDocs(query(collection(db, PLAYERS_COLLECTION), orderBy('name', 'asc')));
    return playersSnapshot.docs.map(doc => doc.data() as Player);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, PLAYERS_COLLECTION);
    return [];
  }
};

export const savePlayers = async (players: Player[]) => {
  try {
    const promises = players.map(player => 
      setDoc(doc(db, PLAYERS_COLLECTION, player.id), player)
    );
    await Promise.all(promises);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, PLAYERS_COLLECTION);
  }
};

export const savePlayer = async (player: Player) => {
  try {
    await setDoc(doc(db, PLAYERS_COLLECTION, player.id), player);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${PLAYERS_COLLECTION}/${player.id}`);
  }
};

export const deletePlayer = async (id: string) => {
  try {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${PLAYERS_COLLECTION}/${id}`);
  }
};

export const getMatches = async (): Promise<Match[]> => {
  try {
    const matchesSnapshot = await getDocs(query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc')));
    return matchesSnapshot.docs.map(doc => doc.data() as Match);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, MATCHES_COLLECTION);
    return [];
  }
};

export const saveMatches = async (matches: Match[]) => {
  try {
    const promises = matches.map(match => 
      setDoc(doc(db, MATCHES_COLLECTION, match.id), match)
    );
    await Promise.all(promises);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, MATCHES_COLLECTION);
  }
};

export const saveMatch = async (match: Match) => {
  try {
    await setDoc(doc(db, MATCHES_COLLECTION, match.id), match);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${MATCHES_COLLECTION}/${match.id}`);
  }
};

export const deleteMatch = async (id: string) => {
  try {
    await deleteDoc(doc(db, MATCHES_COLLECTION, id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${MATCHES_COLLECTION}/${id}`);
  }
};

// Compute stats based on completed matches
export const getPlayerStats = async (): Promise<PlayerStats[]> => {
  const players = await getPlayers();
  const matches = (await getMatches()).filter(m => m.status === 'completed');
  
  const statsMap: Record<string, PlayerStats> = {};
  
  players.forEach(p => {
    statsMap[p.id] = {
      playerId: p.id,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0
    };
  });
  
  matches.forEach(m => {
    const aGoals = m.result?.teamAGoals ?? 0;
    const bGoals = m.result?.teamBGoals ?? 0;
    
    // Check if player in Team A
    m.teamA.players.forEach(p => {
      if (!statsMap[p.id]) return;
      statsMap[p.id].matchesPlayed++;
      if (aGoals > bGoals) statsMap[p.id].wins++;
      else if (aGoals < bGoals) statsMap[p.id].losses++;
      else statsMap[p.id].draws++;
    });
    
    // Check if player in Team B
    m.teamB.players.forEach(p => {
      if (!statsMap[p.id]) return;
      statsMap[p.id].matchesPlayed++;
      if (bGoals > aGoals) statsMap[p.id].wins++;
      else if (bGoals < aGoals) statsMap[p.id].losses++;
      else statsMap[p.id].draws++;
    });
  });
  
  return Object.values(statsMap);
};
