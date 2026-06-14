import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { DraftState } from '../../types';
import { selectSmartDraftPick } from '../../utils/draft';
import { simulateLoLMatch, simulateLoLSeries, generateAITactics } from '../../utils/matchEngine';
import { buildAIRosterMap } from '../storeUtils';

const updateStandingsWithSeriesResult = (
  standings: any[],
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
): any[] => {
  const isHomeWinner = homeScore > awayScore;
  const gameDiffVal = homeScore - awayScore;

  return standings.map(st => {
    if (st.teamId === homeTeamId) {
      return {
        ...st,
        wins: isHomeWinner ? st.wins + 1 : st.wins,
        losses: isHomeWinner ? st.losses : st.losses + 1,
        gameDiff: st.gameDiff + gameDiffVal
      };
    }
    if (st.teamId === awayTeamId) {
      return {
        ...st,
        wins: isHomeWinner ? st.wins : st.wins + 1,
        losses: isHomeWinner ? st.losses + 1 : st.losses,
        gameDiff: st.gameDiff - gameDiffVal
      };
    }
    return st;
  });
};

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
    const { activeMatch, playerTeamId, seriesState } = get();
    if (!activeMatch) return;

    // Helper to determine BO series format and required wins
    const determineBoFormatAndMaxWins = (match: any): { boFormat: 'BO1' | 'BO2' | 'BO3' | 'BO5'; maxWins: number } => {
      const mType = match.matchType;
      const mId = match.id;

      if (match.boFormat) {
        const maxWins = match.boFormat === 'BO5' ? 3 : match.boFormat === 'BO3' ? 2 : match.boFormat === 'BO2' ? 2 : 1;
        return { boFormat: match.boFormat, maxWins };
      }

      // Worlds formats
      if (mType === 'WORLDS') {
        if (mId.includes('worlds_qf') || mId.includes('worlds_sf') || mId === 'worlds_f') {
          return { boFormat: 'BO5', maxWins: 3 };
        }
        // Swiss round decider matches are BO3
        if (mId.startsWith('worlds_swiss_r3_m1') || mId.startsWith('worlds_swiss_r3_m2') ||
            mId.startsWith('worlds_swiss_r3_m7') || mId.startsWith('worlds_swiss_r3_m8') ||
            mId.startsWith('worlds_swiss_r4_') ||
            mId.startsWith('worlds_swiss_r5_')) {
          return { boFormat: 'BO3', maxWins: 2 };
        }
        return { boFormat: 'BO1', maxWins: 1 };
      }

      // Playoffs formats
      if (mType === 'SPRING_PLAYOFFS' || mType === 'SUMMER_PLAYOFFS') {
        return { boFormat: 'BO5', maxWins: 3 };
      }

      // MSI formats
      if (mType === 'MSI') {
        if (mId === 'msi_f' || mId === 'msi_lbf' || mId === 'msi_ubf' || mId.startsWith('msi_ubsf') || mId.startsWith('msi_lbr2') || mId.startsWith('msi_lbr3')) {
          return { boFormat: 'BO5', maxWins: 3 };
        }
        return { boFormat: 'BO3', maxWins: 2 };
      }

      // LCK Regular Season standard BO3
      if (mType === 'SPRING_REGULAR' || mType === 'SUMMER_REGULAR') {
        return { boFormat: 'BO3', maxWins: 2 };
      }

      return { boFormat: 'BO1', maxWins: 1 };
    };

    let nextSeriesState = seriesState;
    if (!seriesState || seriesState.matchId !== activeMatch.id) {
      const { boFormat, maxWins } = determineBoFormatAndMaxWins(activeMatch);
      nextSeriesState = {
        matchId: activeMatch.id,
        currentSet: 1,
        homeWins: 0,
        awayWins: 0,
        maxWins,
        boFormat,
        playedSets: [],
        fearlessPickedChampions: []
      };
    }

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
      draftState,
      seriesState: nextSeriesState
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
      let updatedStandings = [...standings];
      
      currentWeekMatches.forEach(match => {
        const hTeam = get().teams.find(t => t.id === match.homeTeamId)!;
        const aTeam = get().teams.find(t => t.id === match.awayTeamId)!;

        const hPlayers = players.filter(p => p.teamId === match.homeTeamId);
        const aPlayers = players.filter(p => p.teamId === match.awayTeamId);

        const homeRoster = buildAIRosterMap(match.homeTeamId, hPlayers, get().playerTeamId, get().startingLineup);
        const awayRoster = buildAIRosterMap(match.awayTeamId, aPlayers, get().playerTeamId, get().startingLineup);

        const hTactics = generateAITactics(homeRoster);
        const aTactics = generateAITactics(awayRoster);

        const simResult = simulateLoLSeries(
          hTeam, homeRoster, aTeam, awayRoster,
          hTactics, aTactics, 0, 0, false, false, true
        );

        const matchIdx = updatedSchedule.findIndex(s => s.id === match.id);
        if (matchIdx !== -1) {
          updatedSchedule[matchIdx] = {
            ...match,
            played: true,
            winnerId: simResult.winnerId,
            score: simResult.score,
            log: simResult.log,
            pogPlayerId: simResult.pogPlayerId,
            homeStats: simResult.homeStats,
            awayStats: simResult.awayStats
          };
        }

        updatedStandings = updateStandingsWithSeriesResult(
          updatedStandings, match.homeTeamId, match.awayTeamId,
          simResult.score.home, simResult.score.away
        );
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

    const seriesState = get().seriesState;
    const usedChamps = [
      ...draftState.blueBans,
      ...draftState.redBans,
      ...draftState.bluePicks,
      ...draftState.redPicks,
      ...(seriesState?.fearlessPickedChampions || [])
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
