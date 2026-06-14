import { CHAMPIONS } from '../data/initialData';
import { Champion } from '../types';

const ROLES: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

// Generate all permutations of indices 0..4
const PERMUTATIONS_5_INDEX: number[][] = [];
function generatePermutations(arr: number[], memo: number[] = []) {
  if (arr.length === 0) {
    PERMUTATIONS_5_INDEX.push(memo);
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const cur = arr.slice();
    const next = cur.splice(i, 1);
    generatePermutations(cur.slice(), memo.concat(next));
  }
}
generatePermutations([0, 1, 2, 3, 4]);

/**
 * Roster Role Solver:
 * Solves the mathematically optimal 1-to-1 matching of a list of champions
 * to the 5 official eSports positions.
 */
export function solveOptimalRoles(championIds: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!championIds || championIds.length === 0) return result;

  const actualChamps = championIds
    .map(id => CHAMPIONS.find(c => c.id === id))
    .filter(Boolean) as Champion[];

  // If we have fewer than 5 champions, assign them sequentially to unused roles they like
  if (actualChamps.length < 5) {
    const remainingRoles = [...ROLES];
    actualChamps.forEach(champ => {
      const preferredRole = champ.lane.find(l => remainingRoles.includes(l));
      if (preferredRole) {
        result[preferredRole] = champ.id;
        const idx = remainingRoles.indexOf(preferredRole);
        remainingRoles.splice(idx, 1);
      } else {
        const fallbackRole = remainingRoles.shift();
        if (fallbackRole) {
          result[fallbackRole] = champ.id;
        }
      }
    });
    return result;
  }

  // Exactly 5 champions: solve using the 120-permutation brute force optimizer
  let bestPerm = [0, 1, 2, 3, 4];
  let maxScore = -999999;

  for (const perm of PERMUTATIONS_5_INDEX) {
    let score = 0;
    for (let rIdx = 0; rIdx < 5; rIdx++) {
      const role = ROLES[rIdx];
      const champ = actualChamps[perm[rIdx]];
      if (!champ) continue;

      if (champ.lane.includes(role)) {
        score += 30; // High match bonus
        if (champ.lane[0] === role) {
          score += 10; // Extra primary lane match bonus
        }
      } else {
        score -= 200; // Drastic out-of-position penalty
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestPerm = perm;
    }
  }

  for (let rIdx = 0; rIdx < 5; rIdx++) {
    const role = ROLES[rIdx];
    const champ = actualChamps[bestPerm[rIdx]];
    if (champ) {
      result[role] = champ.id;
    }
  }

  return result;
}

/**
 * Computes a weighted score for each available champion and selects the best.
 * This simulates a professional LCK Coach considering Tiers, Vacant lanes,
 * Synergy with already picked allies, and Counter-picks against opponents.
 */
export function selectSmartDraftPick(
  myPicks: string[],
  oppPicks: string[],
  usedChamps: string[],
  isBan: boolean
): string {
  const availableChamps = CHAMPIONS.filter(c => !usedChamps.includes(c.id));
  if (availableChamps.length === 0) return 'lulu'; // Ultimate safety fallback

  if (isBan) {
    // BAN PHASE logic:
    // We ban high-tier champions, focusing on opponent's key pools or meta picks
    const candidates = availableChamps.map(champ => {
      let score = 0;
      // High tier is high priority to ban
      if (champ.tier === 1) score += 50;
      if (champ.tier === 2) score += 20;

      // Ban opponent's synergy champions if opponent has some picks already
      oppPicks.forEach(oppId => {
        const oppChamp = CHAMPIONS.find(c => c.id === oppId);
        if (oppChamp && oppChamp.synergyIds.includes(champ.id)) {
          score += 15;
        }
      });

      // Added small random noise to keep bans highly dynamic
      const noise = Math.random() * 10;
      return { id: champ.id, rScore: score + noise };
    });

    candidates.sort((a, b) => b.rScore - a.rScore);
    return candidates[0]?.id || 'lulu';
  } else {
    // PICK PHASE logic:
    // 1. Identify which roles are already filled in my roster
    const filledStructure = solveOptimalRoles(myPicks);
    const filledRoles = Object.keys(filledStructure) as ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[];
    const vacantRoles = ROLES.filter(r => !filledRoles.includes(r));

    // 2. Score each candidate champion
    const candidates = availableChamps.map(champ => {
      let score = 0;

      // Role compatibility: Does the champion play one of our vacant roles?
      const fitsVacantRole = champ.lane.some(l => vacantRoles.includes(l));
      if (fitsVacantRole) {
        score += 80; // Massive push to fill vacant positions!
      } else {
        score -= 40; // Penalty, we want to prioritize filling vacant slots
      }

      // Base Strength (Tiers)
      if (champ.tier === 1) score += 40;
      if (champ.tier === 2) score += 20;
      if (champ.tier === 3) score += 5;

      // Synergy Profile (with already picked champions on our team)
      myPicks.forEach(myId => {
        const myChamp = CHAMPIONS.find(c => c.id === myId);
        // Direct synergy
        if (champ.synergyIds.includes(myId)) score += 15;
        if (myChamp && myChamp.synergyIds.includes(champ.id)) score += 15;

        // Mutual playstyle bonus
        if (champ.style === myChamp?.style) score += 5;
      });

      // Counter Profile (against opponents already picked champions)
      oppPicks.forEach(oppId => {
        const oppChamp = CHAMPIONS.find(c => c.id === oppId);
        // Direct counter
        if (champ.counterIds.includes(oppId)) score += 25; // Counter is very strong
        if (oppChamp && oppChamp.counterIds.includes(champ.id)) score -= 15; // Opponent counters us - avoid!
      });

      // Small randomized variance (so AI draft is fresh each game)
      const noise = Math.random() * 15;
      return { id: champ.id, rScore: score + noise };
    });

    candidates.sort((a, b) => b.rScore - a.rScore);
    return candidates[0]?.id || 'lulu';
  }
}
