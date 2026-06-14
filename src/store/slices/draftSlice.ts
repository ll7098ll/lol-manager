import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { DraftState } from '../../types';
import { selectSmartDraftPick } from '../../utils/draft';
import { simulateLoLMatch } from '../../utils/matchEngine';
import { buildAIRosterMap } from '../storeUtils';

export const createDraftSlice: StateCreator<
  GameStore,
  [],
  [],
  Pick<
    GameStore,
    | 'activeMatch'
    | 'draftState'
    | 'matchSimulationResult'
    | 'lastMatchResult'
    | 'startDraft'
    | 'selectBan'
    | 'selectPick'
    | 'autoDraftForOpponent'
  >
> = (set, get) => ({
  activeMatch: null,
  draftState: null,
  matchSimulationResult: null,
  lastMatchResult: null,

  startDraft: () => {
    const { activeMatch, playerTeamId } = get();
    if (!activeMatch) return;

    const draftState: DraftState = {
      blueTeamId: activeMatch.homeTeamId,
      redTeamId: activeMatch.awayTeamId,
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: [],
      currentTurn: 'BLUE_BAN_1'
    };

    set({
      gameState: 'DRAFT',
      draftState
    });

    setTimeout(() => {
      get().autoDraftForOpponent();
    }, 150);
  },

  selectBan: (champId, side) => {
    const { draftState } = get();
    if (!draftState) return;

    const stateUpdate = { ...draftState };
    if (side === 'BLUE') {
      stateUpdate.blueBans.push(champId);
    } else {
      stateUpdate.redBans.push(champId);
    }

    const turnOrder: DraftState['currentTurn'][] = [
      'BLUE_BAN_1', 'RED_BAN_1', 'BLUE_BAN_2', 'RED_BAN_2', 'BLUE_BAN_3', 'RED_BAN_3',
      'BLUE_PICK_1', 'RED_PICK_1', 'RED_PICK_2', 'BLUE_PICK_2', 'BLUE_PICK_3', 'RED_PICK_3',
      'BLUE_BAN_4', 'RED_BAN_4', 'BLUE_BAN_5', 'RED_BAN_5',
      'RED_PICK_4', 'BLUE_PICK_4', 'BLUE_PICK_5', 'RED_PICK_5', 'COMPLETE'
    ];

    const currentIdx = turnOrder.indexOf(stateUpdate.currentTurn);
    if (currentIdx !== -1 && currentIdx + 1 < turnOrder.length) {
      stateUpdate.currentTurn = turnOrder[currentIdx + 1];
    }

    set({ draftState: stateUpdate });

    setTimeout(() => {
      get().autoDraftForOpponent();
    }, 50);
  },

  selectPick: (champId, side) => {
    const { draftState } = get();
    if (!draftState) return;

    const stateUpdate = { ...draftState };
    if (side === 'BLUE') {
      stateUpdate.bluePicks.push(champId);
    } else {
      stateUpdate.redPicks.push(champId);
    }

    const turnOrder: DraftState['currentTurn'][] = [
      'BLUE_BAN_1', 'RED_BAN_1', 'BLUE_BAN_2', 'RED_BAN_2', 'BLUE_BAN_3', 'RED_BAN_3',
      'BLUE_PICK_1', 'RED_PICK_1', 'RED_PICK_2', 'BLUE_PICK_2', 'BLUE_PICK_3', 'RED_PICK_3',
      'BLUE_BAN_4', 'RED_BAN_4', 'BLUE_BAN_5', 'RED_BAN_5',
      'RED_PICK_4', 'BLUE_PICK_4', 'BLUE_PICK_5', 'RED_PICK_5', 'COMPLETE'
    ];

    const currentIdx = turnOrder.indexOf(stateUpdate.currentTurn);
    if (currentIdx !== -1 && currentIdx + 1 < turnOrder.length) {
      stateUpdate.currentTurn = turnOrder[currentIdx + 1];
    }

    set({ draftState: stateUpdate });

    setTimeout(() => {
      get().autoDraftForOpponent();
    }, 50);
  },

  autoDraftForOpponent: () => {
    const { draftState, playerTeamId, gameState, activeMatch, players, schedule, currentWeek, standings, seasonPhase } = get();

    if (gameState === 'OFFICE' && !activeMatch) {
      const currentWeekMatches = schedule.filter(m => m.week === currentWeek && !m.played);
      const updatedSchedule = [...schedule];
      const updatedStandings = [...standings];
      
      currentWeekMatches.forEach(match => {
        const hTeam = get().teams.find(t => t.id === match.homeTeamId)!;
        const aTeam = get().teams.find(t => t.id === match.awayTeamId)!;

        const hPlayers = players.filter(p => p.teamId === match.homeTeamId);
        const aPlayers = players.filter(p => p.teamId === match.awayTeamId);

        const homeRoster = buildAIRosterMap(match.homeTeamId, hPlayers, get().playerTeamId, get().startingLineup);
        const awayRoster = buildAIRosterMap(match.awayTeamId, aPlayers, get().playerTeamId, get().startingLineup);

        const simResult = simulateLoLMatch(hTeam, homeRoster, aTeam, awayRoster);

        const matchIdx = updatedSchedule.findIndex(s => s.id === match.id);
        if (matchIdx !== -1) {
          updatedSchedule[matchIdx] = {
            ...match,
            played: true,
            winnerId: simResult.winnerId,
            score: simResult.score,
            log: simResult.log,
            goldDiffHistory: simResult.goldDiffHistory,
            killHistory: simResult.killHistory,
            pogPlayerId: simResult.pogPlayerId,
            homeStats: simResult.homeStats,
            awayStats: simResult.awayStats
          };
        }

        const isHomeWinner = simResult.winnerId === match.homeTeamId;
        const homeStandIdx = updatedStandings.findIndex(st => st.teamId === match.homeTeamId);
        const awayStandIdx = updatedStandings.findIndex(st => st.teamId === match.awayTeamId);

        if (homeStandIdx !== -1 && awayStandIdx !== -1) {
          if (isHomeWinner) {
            updatedStandings[homeStandIdx].wins++;
            updatedStandings[awayStandIdx].losses++;
          } else {
            updatedStandings[awayStandIdx].wins++;
            updatedStandings[homeStandIdx].losses++;
          }
        }
      });

      const foreignTiers: Record<string, number> = { 
        blg: 0.85, tes: 0.70, wbg: 0.55, jdg: 0.82,
        g2: 0.75, fnc: 0.55, mdk: 0.60, kc: 0.50,
        tl: 0.68, c9: 0.55, fly: 0.65
      };
      Object.entries(foreignTiers).forEach(([teamId, winRate]) => {
        const sIdx = updatedStandings.findIndex(st => st.teamId === teamId);
        if (sIdx !== -1) {
          if (Math.random() < winRate) {
            updatedStandings[sIdx].wins++;
          } else {
            updatedStandings[sIdx].losses++;
          }
        }
      });

      const nextWeek = Math.min(18, currentWeek + 1);

      set({
        schedule: updatedSchedule,
        standings: updatedStandings,
        currentWeek: nextWeek
      });

      const allWeek18Played = updatedSchedule.filter(m => m.week === 18).every(m => m.played);
      if (allWeek18Played) {
        if (seasonPhase === 'SPRING_REGULAR') {
          set({
            seasonPhase: 'SPRING_PLAYOFFS',
            gameState: 'OFFICE',
            activeMatch: null,
            draftState: null,
            matchSimulationResult: null
          });
          get().buildPlayoffsBracket(updatedStandings);
        } else if (seasonPhase === 'SUMMER_REGULAR') {
          set({
            seasonPhase: 'SUMMER_PLAYOFFS',
            gameState: 'OFFICE',
            activeMatch: null,
            draftState: null,
            matchSimulationResult: null
          });
          get().buildPlayoffsBracket(updatedStandings);
        }
      }
      return;
    }

    if (!draftState || draftState.currentTurn === 'COMPLETE') return;

    const isBlueAI = draftState.blueTeamId !== playerTeamId;
    const isRedAI = draftState.redTeamId !== playerTeamId;
    const currentTurn = draftState.currentTurn;

    const isBlueTurn = currentTurn.startsWith('BLUE');
    const isRedTurn = currentTurn.startsWith('RED');

    if ((isBlueTurn && !isBlueAI) || (isRedTurn && !isRedAI)) {
      return;
    }

    const isBanTurn = currentTurn.includes('BAN');

    const usedChamps = [
      ...draftState.blueBans,
      ...draftState.redBans,
      ...draftState.bluePicks,
      ...draftState.redPicks
    ];

    const aiSide = isBlueTurn ? 'BLUE' : 'RED';
    const myPicks = isBlueTurn ? draftState.bluePicks : draftState.redPicks;
    const oppPicks = isBlueTurn ? draftState.redPicks : draftState.bluePicks;

    if (isBanTurn) {
      const nextBan = selectSmartDraftPick(myPicks, oppPicks, usedChamps, true);
      get().selectBan(nextBan, aiSide);
    } else {
      const nextPick = selectSmartDraftPick(myPicks, oppPicks, usedChamps, false);
      get().selectPick(nextPick, aiSide);
    }
  }
});
