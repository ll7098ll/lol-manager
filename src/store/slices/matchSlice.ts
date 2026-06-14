import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { Standing, Match, Player, Email } from '../../types';
import { simulateLoLMatch, simulateLoLSeries, generateAITactics } from '../../utils/matchEngine';
import { ALL_TEAMS, buildAIRosterMap } from '../storeUtils';
import { formatCurrency } from '../../utils/format';

export const createMatchSlice: StateCreator<
  GameStore,
  [],
  [],
  Pick<
    GameStore,
    | 'simulateBracketMatchDirectly'
    | 'buildPlayoffsBracket'
    | 'buildMsiBracket'
    | 'buildWorldsBracket'
    | 'updatePlayoffsBracketTree'
    | 'updateMsiBracketTree'
    | 'updateWorldsBracketTree'
    | 'completeMatch'
    | 'resetToOffice'
  >
> = (set, get) => ({
  buildPlayoffsBracket: (lckStandings: Standing[]) => {
    const lckTeams = ALL_TEAMS.filter(t => t.region === 'LCK');
    const sortedLck = lckStandings
      .filter(s => lckTeams.some(t => t.id === s.teamId))
      .sort((a, b) => b.wins - a.wins || b.gameDiff - a.gameDiff);

    const s1 = sortedLck[0]?.teamId || 't1';
    const s2 = sortedLck[1]?.teamId || 'geng';
    const s3 = sortedLck[2]?.teamId || 'hle';
    const s4 = sortedLck[3]?.teamId || 'dk';
    const s5 = sortedLck[4]?.teamId || 'kt';
    const s6 = sortedLck[5]?.teamId || 'kdf';

    const matches: Match[] = [
      { id: 'po_r1_m1', week: 19, homeTeamId: s3, awayTeamId: s6, played: false, matchType: get().seasonPhase as any },
      { id: 'po_r1_m2', week: 19, homeTeamId: s4, awayTeamId: s5, played: false, matchType: get().seasonPhase as any },
      { id: 'po_r2_m1', week: 20, homeTeamId: s1, awayTeamId: 'TBD', played: false, matchType: get().seasonPhase as any },
      { id: 'po_r2_m2', week: 20, homeTeamId: s2, awayTeamId: 'TBD', played: false, matchType: get().seasonPhase as any },
      { id: 'po_ub_f', week: 21, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: get().seasonPhase as any },
      { id: 'po_lb_sf', week: 21, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: get().seasonPhase as any },
      { id: 'po_lb_f', week: 22, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: get().seasonPhase as any },
      { id: 'po_f', week: 23, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: get().seasonPhase as any }
    ];
    set({ playoffsMatches: matches });
  },

  buildMsiBracket: () => {
    const sortedLck = get().standings
      .filter(s => ALL_TEAMS.find(t => t.id === s.teamId)?.region === 'LCK')
      .sort((a,b) => b.wins - a.wins || b.gameDiff - a.gameDiff);
    const lck1 = sortedLck[0]?.teamId || 't1';
    const lck2 = sortedLck[1]?.teamId || 'geng';

    const matches: Match[] = [
      { id: 'msi_qf1', week: 20, homeTeamId: lck1, awayTeamId: 'fly', played: false, matchType: 'MSI' },
      { id: 'msi_qf2', week: 20, homeTeamId: 'tes', awayTeamId: 'g2', played: false, matchType: 'MSI' },
      { id: 'msi_qf3', week: 20, homeTeamId: 'blg', awayTeamId: 'fnc', played: false, matchType: 'MSI' },
      { id: 'msi_qf4', week: 20, homeTeamId: lck2, awayTeamId: 'tl', played: false, matchType: 'MSI' },
      { id: 'msi_ubsf1', week: 21, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_ubsf2', week: 21, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_lbr1_1', week: 21, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_lbr1_2', week: 21, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_ubf', week: 22, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_lbr2_1', week: 22, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_lbr2_2', week: 22, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_lbr3', week: 22, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_lbf', week: 23, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' },
      { id: 'msi_f', week: 23, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'MSI' }
    ];
    set({ msiMatches: matches });
  },

  buildWorldsBracket: () => {
    const sortedLck = get().standings
      .filter(s => ALL_TEAMS.find(t => t.id === s.teamId)?.region === 'LCK')
      .sort((a,b) => b.wins - a.wins || b.gameDiff - a.gameDiff);
    const lckSeeds = sortedLck.slice(0, 5).map(s => s.teamId);
    while (lckSeeds.length < 5) lckSeeds.push('t1');

    const swissTeams = [
      lckSeeds[0], lckSeeds[1], lckSeeds[2], lckSeeds[3], lckSeeds[4],
      'blg', 'tes', 'wbg', 'jdg',
      'g2', 'fnc', 'kc', 'mdk',
      'tl', 'fly', 'c9'
    ];

    const matches: Match[] = [
      { id: 'worlds_swiss_r1_m1', week: 24, homeTeamId: swissTeams[0], awayTeamId: 'fnc', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m2', week: 24, homeTeamId: swissTeams[1], awayTeamId: 'fly', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m3', week: 24, homeTeamId: swissTeams[2], awayTeamId: 'kc', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m4', week: 24, homeTeamId: swissTeams[3], awayTeamId: 'mdk', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m5', week: 24, homeTeamId: 'blg', awayTeamId: 'c9', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m6', week: 24, homeTeamId: 'tes', awayTeamId: 'tl', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m7', week: 24, homeTeamId: 'wbg', awayTeamId: 'g2', played: false, matchType: 'WORLDS' },
      { id: 'worlds_swiss_r1_m8', week: 24, homeTeamId: 'jdg', awayTeamId: swissTeams[4], played: false, matchType: 'WORLDS' }
    ];
    set({ worldsMatches: matches });
  },

  updatePlayoffsBracketTree: (matches: Match[]) => {
    const nextMatches = [...matches];
    let changed = false;

    const r1m1 = nextMatches.find(m => m.id === 'po_r1_m1')!;
    const r1m2 = nextMatches.find(m => m.id === 'po_r1_m2')!;
    const r2m1 = nextMatches.find(m => m.id === 'po_r2_m1')!;
    const r2m2 = nextMatches.find(m => m.id === 'po_r2_m2')!;

    if (r1m1.played && r1m2.played && r2m1.awayTeamId === 'TBD' && r2m2.awayTeamId === 'TBD') {
      const r1m1W = r1m1.winnerId!;
      const r1m2W = r1m2.winnerId!;
      
      const { standings } = get();
      const getRank = (tid: string) => standings.findIndex(s => s.teamId === tid);

      let lowestW = r1m1W;
      let highestW = r1m2W;
      if (getRank(r1m1W) > getRank(r1m2W)) {
        lowestW = r1m1W;
        highestW = r1m2W;
      } else {
        lowestW = r1m2W;
        highestW = r1m1W;
      }

      r2m1.awayTeamId = lowestW;
      r2m2.awayTeamId = highestW;
      changed = true;
    }

    const ubf = nextMatches.find(m => m.id === 'po_ub_f')!;
    const lbsf = nextMatches.find(m => m.id === 'po_lb_sf')!;
    if (r2m1.played && r2m2.played && ubf.homeTeamId === 'TBD') {
      ubf.homeTeamId = r2m1.winnerId!;
      ubf.awayTeamId = r2m2.winnerId!;

      lbsf.homeTeamId = r2m1.winnerId === r2m1.homeTeamId ? r2m1.awayTeamId : r2m1.homeTeamId;
      lbsf.awayTeamId = r2m2.winnerId === r2m2.homeTeamId ? r2m2.awayTeamId : r2m2.homeTeamId;
      changed = true;
    }

    const lbf = nextMatches.find(m => m.id === 'po_lb_f')!;
    if (ubf.played && lbsf.played && lbf.homeTeamId === 'TBD') {
      lbf.homeTeamId = ubf.winnerId === ubf.homeTeamId ? ubf.awayTeamId : ubf.homeTeamId;
      lbf.awayTeamId = lbsf.winnerId!;
      changed = true;
    }

    const pof = nextMatches.find(m => m.id === 'po_f')!;
    if (ubf.played && lbf.played && pof.homeTeamId === 'TBD') {
      pof.homeTeamId = ubf.winnerId!;
      pof.awayTeamId = lbf.winnerId!;
      changed = true;
    }

    if (changed) set({ playoffsMatches: nextMatches });
  },

  updateMsiBracketTree: (matches: Match[]) => {
    const nextMatches = [...matches];
    let changed = false;

    const findM = (id: string) => nextMatches.find(m => m.id === id)!;

    const qf1 = findM('msi_qf1');
    const qf2 = findM('msi_qf2');
    const qf3 = findM('msi_qf3');
    const qf4 = findM('msi_qf4');

    const ubsf1 = findM('msi_ubsf1');
    const ubsf2 = findM('msi_ubsf2');
    const lbr1_1 = findM('msi_lbr1_1');
    const lbr1_2 = findM('msi_lbr1_2');

    const lbr2_1 = findM('msi_lbr2_1');
    const lbr2_2 = findM('msi_lbr2_2');
    const ubf = findM('msi_ubf');

    const lbr3 = findM('msi_lbr3');
    const lbf = findM('msi_lbf');
    const f = findM('msi_f');

    if (qf1.played && qf2.played && ubsf1.homeTeamId === 'TBD') {
      ubsf1.homeTeamId = qf1.winnerId!;
      ubsf1.awayTeamId = qf2.winnerId!;
      lbr1_1.homeTeamId = qf1.winnerId === qf1.homeTeamId ? qf1.awayTeamId : qf1.homeTeamId;
      lbr1_1.awayTeamId = qf2.winnerId === qf2.homeTeamId ? qf2.awayTeamId : qf2.homeTeamId;
      changed = true;
    }
    if (qf3.played && qf4.played && ubsf2.homeTeamId === 'TBD') {
      ubsf2.homeTeamId = qf3.winnerId!;
      ubsf2.awayTeamId = qf4.winnerId!;
      lbr1_2.homeTeamId = qf3.winnerId === qf3.homeTeamId ? qf3.awayTeamId : qf3.homeTeamId;
      lbr1_2.awayTeamId = qf4.winnerId === qf4.homeTeamId ? qf4.awayTeamId : qf4.homeTeamId;
      changed = true;
    }

    if (ubsf1.played && lbr1_1.played && lbr2_1.homeTeamId === 'TBD') {
      lbr2_1.homeTeamId = ubsf1.winnerId === ubsf1.homeTeamId ? ubsf1.awayTeamId : ubsf1.homeTeamId;
      lbr2_1.awayTeamId = lbr1_1.winnerId!;
      changed = true;
    }
    if (ubsf2.played && lbr1_2.played && lbr2_2.homeTeamId === 'TBD') {
      lbr2_2.homeTeamId = ubsf2.winnerId === ubsf2.homeTeamId ? ubsf2.awayTeamId : ubsf2.homeTeamId;
      lbr2_2.awayTeamId = lbr1_2.winnerId!;
      changed = true;
    }
    if (ubsf1.played && ubsf2.played && ubf.homeTeamId === 'TBD') {
      ubf.homeTeamId = ubsf1.winnerId!;
      ubf.awayTeamId = ubsf2.winnerId!;
      changed = true;
    }

    if (lbr2_1.played && lbr2_2.played && lbr3.homeTeamId === 'TBD') {
      lbr3.homeTeamId = lbr2_1.winnerId!;
      lbr3.awayTeamId = lbr2_2.winnerId!;
      changed = true;
    }

    if (ubf.played && lbr3.played && lbf.homeTeamId === 'TBD') {
      lbf.homeTeamId = ubf.winnerId === ubf.homeTeamId ? ubf.awayTeamId : ubf.homeTeamId;
      lbf.awayTeamId = lbr3.winnerId!;
      changed = true;
    }

    if (ubf.played && lbf.played && f.homeTeamId === 'TBD') {
      f.homeTeamId = ubf.winnerId!;
      f.awayTeamId = lbf.winnerId!;
      changed = true;
    }

    if (changed) set({ msiMatches: nextMatches });
  },

  updateWorldsBracketTree: (matches: Match[]) => {
    const swissMatches = matches.filter(m => m.id.startsWith('worlds_swiss_'));
    const playedSwiss = swissMatches.filter(m => m.played);

    const knockRoot = matches.find(m => m.id === 'worlds_qf1');
    if (swissMatches.length > 0 && playedSwiss.length === swissMatches.length && playedSwiss.length >= 33 && !knockRoot) {
      const teamRecords: Record<string, { wins: number; losses: number }> = {};
      const allSwissTeamsSet = new Set<string>();
      
      swissMatches.forEach(m => {
        allSwissTeamsSet.add(m.homeTeamId);
        allSwissTeamsSet.add(m.awayTeamId);
      });

      allSwissTeamsSet.forEach(tid => {
        teamRecords[tid] = { wins: 0, losses: 0 };
      });

      swissMatches.forEach(m => {
        if (m.played && m.winnerId) {
          const loserId = m.winnerId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
          if (teamRecords[m.winnerId]) teamRecords[m.winnerId].wins++;
          if (teamRecords[loserId]) teamRecords[loserId].losses++;
        }
      });

      const advancingTeams = Object.keys(teamRecords)
        .filter(tid => teamRecords[tid].wins >= 3)
        .sort((a, b) => teamRecords[b].wins - teamRecords[a].wins);

      const qf1 = advancingTeams[0] || 't1';
      const qf2 = advancingTeams[1] || 'geng';
      const qf3 = advancingTeams[2] || 'hle';
      const qf4 = advancingTeams[3] || 'blg';
      const qf5 = advancingTeams[4] || 'tes';
      const qf6 = advancingTeams[5] || 'g2';
      const qf7 = advancingTeams[6] || 'tl';
      const qf8 = advancingTeams[7] || 'c9';

      const nextMatches: Match[] = [
        ...matches,
        { id: 'worlds_qf1', week: 25, homeTeamId: qf1, awayTeamId: qf8, played: false, matchType: 'WORLDS' },
        { id: 'worlds_qf2', week: 25, homeTeamId: qf2, awayTeamId: qf7, played: false, matchType: 'WORLDS' },
        { id: 'worlds_qf3', week: 25, homeTeamId: qf3, awayTeamId: qf6, played: false, matchType: 'WORLDS' },
        { id: 'worlds_qf4', week: 25, homeTeamId: qf4, awayTeamId: qf5, played: false, matchType: 'WORLDS' },
        { id: 'worlds_sf1', week: 26, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'WORLDS' },
        { id: 'worlds_sf2', week: 26, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'WORLDS' },
        { id: 'worlds_f', week: 27, homeTeamId: 'TBD', awayTeamId: 'TBD', played: false, matchType: 'WORLDS' }
      ];

      set({ worldsMatches: nextMatches });
      return;
    }

    const isRoundDone = (round: number, matchCount: number) => {
      const rdMatches = swissMatches.filter(m => m.id.startsWith(`worlds_swiss_r${round}_`));
      return rdMatches.length === matchCount && rdMatches.every(m => m.played);
    };

    const hasNextRoundInitialized = (round: number) => {
      return swissMatches.some(m => m.id.startsWith(`worlds_swiss_r${round}_`));
    };

    let nextMatchesStore = [...matches];
    let changed = false;

    const getRecordsAndStatus = () => {
       const teamRecords: Record<string, { wins: number; losses: number }> = {};
       const allSwissTeamsSet = new Set<string>();
       
       swissMatches.forEach(m => {
         allSwissTeamsSet.add(m.homeTeamId);
         allSwissTeamsSet.add(m.awayTeamId);
       });

       allSwissTeamsSet.forEach(tid => {
         teamRecords[tid] = { wins: 0, losses: 0 };
       });

       swissMatches.forEach(m => {
         if (m.played && m.winnerId) {
           const loserId = m.winnerId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
           if (teamRecords[m.winnerId]) teamRecords[m.winnerId].wins++;
           if (teamRecords[loserId]) teamRecords[loserId].losses++;
         }
       });

       return teamRecords;
    };

    if (isRoundDone(1, 8) && !hasNextRoundInitialized(2)) {
      const records = getRecordsAndStatus();
      const pool1_0 = Object.keys(records).filter(tid => records[tid].wins === 1);
      const pool0_1 = Object.keys(records).filter(tid => records[tid].losses === 1);

      const newR2Matches: Match[] = [];
      for (let i = 0; i < 4; i++) {
        newR2Matches.push({
          id: `worlds_swiss_r2_m${i+1}`,
          week: 24,
          homeTeamId: pool1_0[i*2],
          awayTeamId: pool1_0[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }
      for (let i = 0; i < 4; i++) {
        newR2Matches.push({
          id: `worlds_swiss_r2_m${i+5}`,
          week: 24,
          homeTeamId: pool0_1[i*2],
          awayTeamId: pool0_1[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }

      nextMatchesStore = [...matches, ...newR2Matches];
      changed = true;
    }
    else if (isRoundDone(2, 8) && !hasNextRoundInitialized(3)) {
      const records = getRecordsAndStatus();
      const pool2_0 = Object.keys(records).filter(tid => records[tid].wins === 2);
      const pool1_1 = Object.keys(records).filter(tid => records[tid].wins === 1 && records[tid].losses === 1);
      const pool0_2 = Object.keys(records).filter(tid => records[tid].losses === 2);

      const newR3Matches: Match[] = [];
      for (let i = 0; i < 2; i++) {
        newR3Matches.push({
          id: `worlds_swiss_r3_m${i+1}`,
          week: 24,
          homeTeamId: pool2_0[i*2],
          awayTeamId: pool2_0[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }
      for (let i = 0; i < 4; i++) {
        newR3Matches.push({
          id: `worlds_swiss_r3_m${i+3}`,
          week: 24,
          homeTeamId: pool1_1[i*2],
          awayTeamId: pool1_1[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }
      for (let i = 0; i < 2; i++) {
        newR3Matches.push({
          id: `worlds_swiss_r3_m${i+7}`,
          week: 24,
          homeTeamId: pool0_2[i*2],
          awayTeamId: pool0_2[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }

      nextMatchesStore = [...matches, ...newR3Matches];
      changed = true;
    }
    else if (isRoundDone(3, 8) && !hasNextRoundInitialized(4)) {
      const records = getRecordsAndStatus();
      const pool2_1 = Object.keys(records).filter(tid => records[tid].wins === 2 && records[tid].losses === 1);
      const pool1_2 = Object.keys(records).filter(tid => records[tid].wins === 1 && records[tid].losses === 2);

      const newR4Matches: Match[] = [];
      for (let i = 0; i < 3; i++) {
        newR4Matches.push({
          id: `worlds_swiss_r4_m${i+1}`,
          week: 24,
          homeTeamId: pool2_1[i*2],
          awayTeamId: pool2_1[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }
      for (let i = 0; i < 3; i++) {
        newR4Matches.push({
          id: `worlds_swiss_r4_m${i+4}`,
          week: 24,
          homeTeamId: pool1_2[i*2],
          awayTeamId: pool1_2[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }

      nextMatchesStore = [...matches, ...newR4Matches];
      changed = true;
    }
    else if (isRoundDone(4, 6) && !hasNextRoundInitialized(5)) {
      const records = getRecordsAndStatus();
      const pool2_2 = Object.keys(records).filter(tid => records[tid].wins === 2 && records[tid].losses === 2);

      const newR5Matches: Match[] = [];
      for (let i = 0; i < 3; i++) {
        newR5Matches.push({
          id: `worlds_swiss_r5_m${i+1}`,
          week: 24,
          homeTeamId: pool2_2[i*2],
          awayTeamId: pool2_2[i*2 + 1],
          played: false,
          matchType: 'WORLDS'
        });
      }

      nextMatchesStore = [...matches, ...newR5Matches];
      changed = true;
    }

    const w_q1 = nextMatchesStore.find(m => m.id === 'worlds_qf1');
    const w_q2 = nextMatchesStore.find(m => m.id === 'worlds_qf2');
    const w_q3 = nextMatchesStore.find(m => m.id === 'worlds_qf3');
    const w_q4 = nextMatchesStore.find(m => m.id === 'worlds_qf4');

    const w_sf1 = nextMatchesStore.find(m => m.id === 'worlds_sf1');
    const w_sf2 = nextMatchesStore.find(m => m.id === 'worlds_sf2');
    const w_f = nextMatchesStore.find(m => m.id === 'worlds_f');

    if (w_q1 && w_q2 && w_q1.played && w_q2.played && w_sf1 && w_sf1.homeTeamId === 'TBD') {
      w_sf1.homeTeamId = w_q1.winnerId!;
      w_sf1.awayTeamId = w_q2.winnerId!;
      changed = true;
    }
    if (w_q3 && w_q4 && w_q3.played && w_q4.played && w_sf2 && w_sf2.homeTeamId === 'TBD') {
      w_sf2.homeTeamId = w_q3.winnerId!;
      w_sf2.awayTeamId = w_q4.winnerId!;
      changed = true;
    }
    if (w_sf1 && w_sf2 && w_sf1.played && w_sf2.played && w_f && w_f.homeTeamId === 'TBD') {
      w_f.homeTeamId = w_sf1.winnerId!;
      w_f.awayTeamId = w_sf2.winnerId!;
      changed = true;
    }

    if (changed) set({ worldsMatches: nextMatchesStore });
  },

  simulateBracketMatchDirectly: (matchId: string) => {
    const { playoffsMatches, msiMatches, worldsMatches, players, seasonPhase } = get();
    let matchToSim: Match | undefined;
    let category: 'PLAYOFFS' | 'MSI' | 'WORLDS' = 'PLAYOFFS';

    if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
       matchToSim = playoffsMatches.find(m => m.id === matchId);
       category = 'PLAYOFFS';
    } else if (seasonPhase === 'MSI') {
       matchToSim = msiMatches.find(m => m.id === matchId);
       category = 'MSI';
    } else if (seasonPhase === 'WORLDS') {
       matchToSim = worldsMatches.find(m => m.id === matchId);
       category = 'WORLDS';
    }

    if (!matchToSim || matchToSim.played) return;

    const homeTeam = get().teams.find(t => t.id === matchToSim!.homeTeamId)!;
    const awayTeam = get().teams.find(t => t.id === matchToSim!.awayTeamId)!;
    const homeTeamPlayers = players.filter(p => p.teamId === matchToSim!.homeTeamId);
    const awayTeamPlayers = players.filter(p => p.teamId === matchToSim!.awayTeamId);
    const homeRoster = buildAIRosterMap(matchToSim!.homeTeamId, homeTeamPlayers, get().playerTeamId, get().startingLineup);
    const awayRoster = buildAIRosterMap(matchToSim!.awayTeamId, awayTeamPlayers, get().playerTeamId, get().startingLineup);

    const homeTactics = matchToSim!.homeTeamId === get().playerTeamId ? get().tactics : generateAITactics(homeRoster);
    const awayTactics = matchToSim!.awayTeamId === get().playerTeamId ? get().tactics : generateAITactics(awayRoster);
    
    const hCoachId = get().activeStaff.TACTICAL_COACH;
    const hCoach = get().coachingStaff.find(s => s.id === hCoachId);
    const homeCoachSkill = (matchToSim!.homeTeamId === get().playerTeamId && hCoach) ? hCoach.tacticalSkill : 0;
    
    const aCoachId = get().activeStaff.TACTICAL_COACH;
    const aCoach = get().coachingStaff.find(s => s.id === aCoachId);
    const awayCoachSkill = (matchToSim!.awayTeamId === get().playerTeamId && aCoach) ? aCoach.tacticalSkill : 0;

    const isPlayerHome = matchToSim!.homeTeamId === get().playerTeamId;
    const isPlayerAway = matchToSim!.awayTeamId === get().playerTeamId;

    const isFinal = matchId.endsWith('_f') || matchId.includes('final');
    const isBo3 = !isFinal;

    const result = simulateLoLSeries(
      homeTeam,
      homeRoster,
      awayTeam,
      awayRoster,
      homeTactics,
      awayTactics,
      homeCoachSkill,
      awayCoachSkill,
      isPlayerHome,
      isPlayerAway,
      isBo3
    );

    const updatedMatch: Match = {
      ...matchToSim,
      played: true,
      winnerId: result.winnerId,
      score: result.score,
      log: result.log,
      goldDiffHistory: result.goldDiffHistory,
      killHistory: result.killHistory,
      pogPlayerId: result.pogPlayerId,
      homeStats: result.homeStats,
      awayStats: result.awayStats
    };

    if (category === 'PLAYOFFS') {
      const nextPlayoffs = playoffsMatches.map(m => m.id === matchId ? updatedMatch : m);
      set({ playoffsMatches: nextPlayoffs });
      get().updatePlayoffsBracketTree(nextPlayoffs);
    } else if (category === 'MSI') {
      const nextMsi = msiMatches.map(m => m.id === matchId ? updatedMatch : m);
      set({ msiMatches: nextMsi });
      get().updateMsiBracketTree(nextMsi);
    } else if (category === 'WORLDS') {
      const nextWorlds = worldsMatches.map(m => m.id === matchId ? updatedMatch : m);
      set({ worldsMatches: nextWorlds });
      get().updateWorldsBracketTree(nextWorlds);
    }
  },

  completeMatch: (result) => {
    const { activeMatch, standings, schedule, players, startingLineup, playerTeamId, currentWeek, seasonPhase, playoffsMatches, msiMatches, worldsMatches } = get();
    if (!activeMatch) return;

    const myStarterIds = Object.values(startingLineup);
    const oppTeamId = activeMatch.homeTeamId === playerTeamId ? activeMatch.awayTeamId : activeMatch.homeTeamId;
    const oppPlayers = players.filter(p => p.teamId === oppTeamId);
    const opponentRoles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
    const oppStarterIds = opponentRoles.map(r => {
      const p = oppPlayers.find(pl => pl.role === r);
      return p ? p.id : '';
    }).filter(id => id !== '');

    const activeStartersIds = new Set([...myStarterIds, ...oppStarterIds]);
    const nextPlayers = players.map(p => {
      if (activeStartersIds.has(p.id)) {
        const curE = p.energy !== undefined ? p.energy : 100;
        return {
          ...p,
          energy: Math.max(0, curE - 25)
        };
      }
      return p;
    });

    const isRegular = seasonPhase === 'SPRING_REGULAR' || seasonPhase === 'SUMMER_REGULAR';

    let updatedMatch: Match;

    if (isRegular) {
      updatedMatch = {
        ...activeMatch,
        played: true,
        winnerId: result.winnerId,
        score: result.score,
        log: result.log,
        goldDiffHistory: result.goldDiffHistory,
        killHistory: result.killHistory,
        pogPlayerId: result.pogPlayerId,
        homeStats: result.homeStats,
        awayStats: result.awayStats
      };
    } else {
      const isFinal = activeMatch.id.endsWith('_f') || activeMatch.id.includes('final');
      const isBo3 = !isFinal;

      const hTeam = get().teams.find(t => t.id === activeMatch.homeTeamId)!;
      const aTeam = get().teams.find(t => t.id === activeMatch.awayTeamId)!;
      const hPlayers = players.filter(p => p.teamId === activeMatch.homeTeamId);
      const aPlayers = players.filter(p => p.teamId === activeMatch.awayTeamId);

      const homeRoster = buildAIRosterMap(activeMatch.homeTeamId, hPlayers, playerTeamId, startingLineup);
      const awayRoster = buildAIRosterMap(activeMatch.awayTeamId, aPlayers, playerTeamId, startingLineup);

      const homeTactics = activeMatch.homeTeamId === playerTeamId ? get().tactics : generateAITactics(homeRoster);
      const awayTactics = activeMatch.awayTeamId === playerTeamId ? get().tactics : generateAITactics(awayRoster);
      
      const hCoachId = get().activeStaff.TACTICAL_COACH;
      const hCoach = get().coachingStaff.find(s => s.id === hCoachId);
      const homeCoachSkill = (activeMatch.homeTeamId === playerTeamId && hCoach) ? hCoach.tacticalSkill : 0;
      
      const aCoachId = get().activeStaff.TACTICAL_COACH;
      const aCoach = get().coachingStaff.find(s => s.id === aCoachId);
      const awayCoachSkill = (activeMatch.awayTeamId === playerTeamId && aCoach) ? aCoach.tacticalSkill : 0;

      const isPlayerHome = activeMatch.homeTeamId === playerTeamId;
      const isPlayerAway = activeMatch.awayTeamId === playerTeamId;

      const seriesResult = simulateLoLSeries(
        hTeam,
        homeRoster,
        aTeam,
        awayRoster,
        homeTactics,
        awayTactics,
        homeCoachSkill,
        awayCoachSkill,
        isPlayerHome,
        isPlayerAway,
        isBo3
      );

      updatedMatch = {
        ...activeMatch,
        played: true,
        winnerId: seriesResult.winnerId,
        score: seriesResult.score,
        log: seriesResult.log,
        goldDiffHistory: seriesResult.goldDiffHistory,
        killHistory: seriesResult.killHistory,
        pogPlayerId: seriesResult.pogPlayerId,
        homeStats: seriesResult.homeStats,
        awayStats: seriesResult.awayStats
      };
    }

    let finalSchedule = [...schedule];
    let finalStandings = [...standings];
    let nextPlayoffs = [...playoffsMatches];
    let nextMsi = [...msiMatches];
    let nextWorlds = [...worldsMatches];

    if (isRegular) {
      finalSchedule = schedule.map(match => match.id === activeMatch.id ? updatedMatch : match);
      
      const isHomeWinner = result.winnerId === activeMatch.homeTeamId;
      finalStandings = standings.map(st => {
        if (st.teamId === activeMatch.homeTeamId) {
          return { ...st, wins: isHomeWinner ? st.wins + 1 : st.wins, losses: isHomeWinner ? st.losses : st.losses + 1 };
        }
        if (st.teamId === activeMatch.awayTeamId) {
          return { ...st, wins: isHomeWinner ? st.wins : st.wins + 1, losses: isHomeWinner ? st.losses + 1 : st.losses };
        }
        return st;
      });

      const currentWeekMatches = schedule.filter(m => m.week === currentWeek && m.id !== activeMatch.id && !m.played);
      currentWeekMatches.forEach(bgMatch => {
        const hTeam = get().teams.find(t => t.id === bgMatch.homeTeamId)!;
        const aTeam = get().teams.find(t => t.id === bgMatch.awayTeamId)!;
        const hPlayers = get().players.filter(p => p.teamId === bgMatch.homeTeamId);
        const aPlayers = get().players.filter(p => p.teamId === bgMatch.awayTeamId);

        const hRoster = buildAIRosterMap(bgMatch.homeTeamId, hPlayers, playerTeamId, startingLineup);
        const aRoster = buildAIRosterMap(bgMatch.awayTeamId, aPlayers, playerTeamId, startingLineup);
        const hTactics = generateAITactics(hRoster);
        const aTactics = generateAITactics(aRoster);
        const simResult = simulateLoLMatch(hTeam, hRoster, aTeam, aRoster, hTactics, aTactics);

        const matchIdx = finalSchedule.findIndex(s => s.id === bgMatch.id);
        if (matchIdx !== -1) {
          finalSchedule[matchIdx] = {
            ...bgMatch,
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

        const isHomeWin = simResult.winnerId === bgMatch.homeTeamId;
        const hStIdx = finalStandings.findIndex(st => st.teamId === bgMatch.homeTeamId);
        const aStIdx = finalStandings.findIndex(st => st.teamId === bgMatch.awayTeamId);

        if (hStIdx !== -1 && aStIdx !== -1) {
          if (isHomeWin) {
            finalStandings[hStIdx].wins++;
            finalStandings[aStIdx].losses++;
          } else {
            finalStandings[aStIdx].wins++;
            finalStandings[hStIdx].losses++;
          }
        }
      });

      const foreignTiers: Record<string, number> = { blg: 0.85, tes: 0.70, wbg: 0.55, g2: 0.75, fnc: 0.55, tl: 0.68, c9: 0.55 };
      Object.entries(foreignTiers).forEach(([teamId, winRate]) => {
        const sIdx = finalStandings.findIndex(st => st.teamId === teamId);
        if (sIdx !== -1) {
          if (Math.random() < winRate) {
            finalStandings[sIdx].wins++;
          } else {
            finalStandings[sIdx].losses++;
          }
        }
      });

    } else {
      if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
        nextPlayoffs = playoffsMatches.map(m => m.id === activeMatch.id ? updatedMatch : m);
      } else if (seasonPhase === 'MSI') {
        nextMsi = msiMatches.map(m => m.id === activeMatch.id ? updatedMatch : m);
      } else if (seasonPhase === 'WORLDS') {
        nextWorlds = worldsMatches.map(m => m.id === activeMatch.id ? updatedMatch : m);
      }
    }

    const nextWeek = Math.min(27, currentWeek + 1);

    const weeklyWinners = new Set<string>();
    const weeklyLosers = new Set<string>();

    const playerWon = result.winnerId === playerTeamId;

    if (playerWon) {
      weeklyWinners.add(playerTeamId);
      weeklyLosers.add(oppTeamId);
    } else {
      weeklyWinners.add(oppTeamId);
      weeklyLosers.add(playerTeamId);
    }

    if (isRegular) {
      const currentWeekMatches = schedule.filter(m => m.week === currentWeek && m.id !== activeMatch.id && !m.played);
      currentWeekMatches.forEach(bgMatch => {
        const matchEntry = finalSchedule.find(s => s.id === bgMatch.id);
        if (matchEntry && matchEntry.winnerId) {
          const bgWinner = matchEntry.winnerId;
          const bgLoser = bgMatch.homeTeamId === bgWinner ? bgMatch.awayTeamId : bgMatch.homeTeamId;
          weeklyWinners.add(bgWinner);
          weeklyLosers.add(bgLoser);
        }
      });
    }

    const getTeamStreak = (teamId: string, currentSchedule: Match[]) => {
      const playedMatches = currentSchedule
        .filter(m => m.played && (m.homeTeamId === teamId || m.awayTeamId === teamId))
        .sort((a, b) => a.week - b.week);
      
      if (playedMatches.length === 0) return { type: 'N/A', count: 0 };
      
      const lastMatch = playedMatches[playedMatches.length - 1];
      const isWin = lastMatch.winnerId === teamId;
      const type = isWin ? 'W' : 'L';
      let count = 1;
      
      for (let i = playedMatches.length - 2; i >= 0; i--) {
        const match = playedMatches[i];
        const matchWin = match.winnerId === teamId;
        if ((type === 'W' && matchWin) || (type === 'L' && !matchWin)) {
          count++;
        } else {
          break;
        }
      }
      return { type, count };
    };

    const nextTeams = get().teams.map(t => {
      let matchPrize = 0;
      let fanChange = 0;

      if (weeklyWinners.has(t.id)) {
        matchPrize = isRegular ? 9000 : 25000;
        fanChange = isRegular ? 45000 : 120000;
      } else if (weeklyLosers.has(t.id)) {
        matchPrize = isRegular ? 2500 : 6000;
        fanChange = isRegular ? -15000 : -35000;
      }

      const ticketRevenue = t.region === 'LCK' ? Math.floor(t.fans * 0.01) : 3000;

      const teamPlayers = nextPlayers.filter(p => p.teamId === t.id);
      const salaryExpense = teamPlayers.reduce((sum, p) => sum + Math.floor(p.salary / 10), 0);

      const streak = getTeamStreak(t.id, finalSchedule);
      let sponsorBonus = 0;
      let sponsorPenalty = 0;
      if (streak.type === 'W') {
        sponsorBonus = streak.count * 1500;
      } else if (streak.type === 'L') {
        sponsorPenalty = streak.count * 1000;
      }
      const sponsorNet = sponsorBonus - sponsorPenalty;

      let staffSalaryExpense = 0;
      if (t.id === playerTeamId) {
        const activeIds = Object.values(get().activeStaff).filter(Boolean);
        const activeList = get().coachingStaff.filter(s => activeIds.includes(s.id));
        staffSalaryExpense = activeList.reduce((sum, s) => sum + Math.floor(s.salary * 0.1), 0);
      }

      const totalSal = teamPlayers.reduce((sum, p) => sum + p.salary, 0);
      let luxuryTax = 0;
      if (totalSal > 350000) {
        luxuryTax = Math.floor(((totalSal - 350000) / 10) * 1.5);
      }

      const totalOutflow = salaryExpense + staffSalaryExpense + luxuryTax;
      const netIncome = matchPrize + ticketRevenue + sponsorNet - totalOutflow;
      
      return {
        ...t,
        budget: Math.max(0, t.budget + netIncome),
        fans: Math.max(10000, t.fans + fanChange)
      };
    });

    const playerTeamObj = get().teams.find(t => t.id === playerTeamId)!;
    const pMatchPrize = playerWon ? (isRegular ? 9000 : 25000) : (isRegular ? 2500 : 6000);
    const pTicketRevenue = Math.floor(playerTeamObj.fans * 0.01);
    const teamPlay = nextPlayers.filter(p => p.teamId === playerTeamId);
    const pWeeklySalaries = teamPlay.reduce((sum, p) => sum + Math.floor(p.salary / 10), 0);

    const pSponsorStreak = getTeamStreak(playerTeamId, finalSchedule);
    const pSponsorBonus = pSponsorStreak.type === 'W' ? pSponsorStreak.count * 1500 : 0;
    const pSponsorPenalty = pSponsorStreak.type === 'L' ? pSponsorStreak.count * 1000 : 0;
    const pSponsorNet = pSponsorBonus - pSponsorPenalty;

    const pActiveIds = Object.values(get().activeStaff).filter(Boolean);
    const pActiveList = get().coachingStaff.filter(s => pActiveIds.includes(s.id));
    const pStaffWage = pActiveList.reduce((sum, s) => sum + Math.floor(s.salary * 0.1), 0);

    const pTotalSal = teamPlay.reduce((sum, p) => sum + p.salary, 0);
    let pLuxuryTax = 0;
    if (pTotalSal > 350000) {
      pLuxuryTax = Math.floor(((pTotalSal - 350000) / 10) * 1.5);
    }

    const pTotalOutflows = pWeeklySalaries + pStaffWage + pLuxuryTax;
    const pNetIncome = pMatchPrize + pTicketRevenue + pSponsorNet - pTotalOutflows;

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;

    const streakMsg = pSponsorStreak.type === 'W' 
      ? `📈 구단 연승 가속화 스폰서 보너스: +${formatCurrency(pSponsorBonus)} (연승 지속: ${pSponsorStreak.count}W)`
      : pSponsorStreak.type === 'L'
        ? `📉 장기 연패 위약 메커니즘 차감: -${formatCurrency(pSponsorPenalty)} (연패 상태: ${pSponsorStreak.count}L)`
        : `⚙️ 연승/연패 스폰서 변동액: N/A`;

    const luxuryTaxMsg = pLuxuryTax > 0
      ? `🚨 [사치세 부과] 샐러리 캡(35억) 초과분 벌금 주 정산: -${formatCurrency(pLuxuryTax)}\n`
      : '';

    const contentTemplate = `감독님! 한 주간 노고가 많으셨습니다. 프런트 오피스에서 실시간 재정 실태 및 연봉 정산 결산서를 전달합니다.\n\n[이번 주간 재정 실시간 정산 보고]\n💰 경기 참가·승리 상금: +${formatCurrency(pMatchPrize)}\n🎟️ 티켓 및 굿즈 매출: +${formatCurrency(pTicketRevenue)}\n${streakMsg}\n\n💸 선수단 주간 총 급여지출: -${formatCurrency(pWeeklySalaries)}\n🕴️ 코칭스태프 계약직 주간 급배: -${formatCurrency(pStaffWage)}\n${luxuryTaxMsg}📈 최종 순수익: ${pNetIncome < 0 ? `-${formatCurrency(Math.abs(pNetIncome))}` : `+${formatCurrency(pNetIncome)}`}\n\n성공적으로 주간 재정 정산이 집행 완료되었습니다. 다음 경기 승리를 위해 감독님의 탁월한 지도를 기대합니다!`;

    const resultMail: Email = {
      id: `mail_result_${Date.now()}`,
      sender: '팬 연합회 및 프런트 사무국',
      title: playerWon ? `[재정 보고] 눈부신 격전의 대형 승리 및 주간 결산 완료!` : `[재정 보고] 이번 경기 실패의 고배 극복 및 주간 결산 완료.`,
      content: contentTemplate,
      date: textDate,
      read: false,
      type: playerWon ? 'CONGRATS' as const : 'SYSTEM' as const
    };

    set({
      gameState: 'SUMMARY',
      matchSimulationResult: result,
      lastMatchResult: result,
      schedule: finalSchedule,
      standings: finalStandings,
      playoffsMatches: nextPlayoffs,
      msiMatches: nextMsi,
      worldsMatches: nextWorlds,
      currentWeek: nextWeek,
      teams: nextTeams,
      players: nextPlayers,
      emails: [resultMail, ...get().emails]
    });

    if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
      get().updatePlayoffsBracketTree(nextPlayoffs);
    } else if (seasonPhase === 'MSI') {
      get().updateMsiBracketTree(nextMsi);
    } else if (seasonPhase === 'WORLDS') {
      get().updateWorldsBracketTree(nextWorlds);
    }
  },

  resetToOffice: () => {
    const { schedule, seasonPhase, playoffsMatches, msiMatches, worldsMatches, standings, players } = get();
    
    if (seasonPhase === 'SPRING_REGULAR') {
      const allWeek18Played = schedule.filter(m => m.week === 18).every(m => m.played);
      if (allWeek18Played) {
        set({
          seasonPhase: 'SPRING_PLAYOFFS',
          gameState: 'OFFICE',
          activeMatch: null,
          draftState: null,
          matchSimulationResult: null
        });
        get().buildPlayoffsBracket(standings);
      } else {
        set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
      }
    } else if (seasonPhase === 'SPRING_PLAYOFFS') {
      const poFinal = playoffsMatches.find(m => m.id === 'po_f');
      if (poFinal && poFinal.played) {
        const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
        const winnerName = ALL_TEAMS.find(t => t.id === poFinal.winnerId)?.name || 'unknown';

        get().emails.push({
          id: `email_msi_invite_${Date.now()}`,
          sender: 'e스포츠 국제위원회',
          title: `[초청장] LCK 스프링 결선 완료 & MSI 국제전 개막!`,
          content: `축하드립니다! 뜨거웠던 LCK 스프링 플레이오프 결승 승자는 [${winnerName}] 팀으로 확정되었습니다! 이에 따라 전 세계 각 지역 최강 구단들이 한자리에 모여 격돌하는 Mid-Season Invitational (MSI) 국제대회 대진이 정식 형성되었습니다. 국제 무대 무대를 완벽 접수해주시기 바랍니다!`,
          date: textDate,
          read: false,
          type: 'CONGRATS'
        });

        set({
          seasonPhase: 'MSI',
          gameState: 'OFFICE',
          activeMatch: null,
          draftState: null,
          matchSimulationResult: null
        });
        get().buildMsiBracket();
      } else {
        set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
      }
    } else if (seasonPhase === 'MSI') {
      const msiFinal = msiMatches.find(m => m.id === 'msi_f');
      if (msiFinal && msiFinal.played) {
        const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
        const winnerName = ALL_TEAMS.find(t => t.id === msiFinal.winnerId)?.name || 'unknown';

        get().emails.push({
          id: `email_summer_start_${Date.now()}`,
          sender: 'LCK 운영위원회',
          title: `[공지] MSI 폐막 및 LCK 서머 시즌 개막 안내`,
          content: `경이로운 화력전 끝에 MSI 월드 챔피언 타이틀은 [${winnerName}] 구단에게 돌아갔습니다! 이제 다시 왕좌를 향한 치열한 여정인 LCK 서머 스플릿이 개막합니다. 모든 정규시즌 전적이 초기화 고쳐 정착하였으니 월즈 티켓 수령을 위해 분투해 주십시오!`,
          date: textDate,
          read: false,
          type: 'NEWS'
        });

        const resettedStandings = standings.map(st => ({ ...st, wins: 0, losses: 0, gameDiff: 0 }));
        const resettedSchedule = schedule.map(m => ({ ...m, played: false, winnerId: undefined, score: undefined, log: undefined, goldDiffHistory: undefined, killHistory: undefined, pogPlayerId: undefined, matchType: 'SUMMER_REGULAR' as const }));

        set({
          seasonPhase: 'SUMMER_REGULAR',
          currentWeek: 1,
          schedule: resettedSchedule,
          standings: resettedStandings,
          gameState: 'OFFICE',
          activeMatch: null,
          draftState: null,
          matchSimulationResult: null
        });
      } else {
        set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
      }
    } else if (seasonPhase === 'SUMMER_REGULAR') {
      const allWeek18Played = schedule.filter(m => m.week === 18).every(m => m.played);
      if (allWeek18Played) {
        set({
          seasonPhase: 'SUMMER_PLAYOFFS',
          gameState: 'OFFICE',
          activeMatch: null,
          draftState: null,
          matchSimulationResult: null
        });
        get().buildPlayoffsBracket(standings);
      } else {
        set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
      }
    } else if (seasonPhase === 'SUMMER_PLAYOFFS') {
      const poFinal = playoffsMatches.find(m => m.id === 'po_f');
      if (poFinal && poFinal.played) {
        const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
        const winnerName = ALL_TEAMS.find(t => t.id === poFinal.winnerId)?.name || 'unknown';

        get().emails.push({
          id: `email_worlds_invite_${Date.now()}`,
          sender: '리그 오브 레전드 사옥',
          title: `[격돌] 최고 존엄의 무대: 월드 챔피언십(월즈) 개막!`,
          content: `LCK 서머 우승컵은 [${winnerName}] 품으로 고귀히 장착되었습니다. 이와 함께 세계 최강들이 모이는 월드 챔피언십 (Worlds) 격전의 날이 왔습니다. 명문과 위엄의 길을 걸어 승리하십시오!`,
          date: textDate,
          read: false,
          type: 'CONGRATS'
        });

        set({
          seasonPhase: 'WORLDS',
          gameState: 'OFFICE',
          activeMatch: null,
          draftState: null,
          matchSimulationResult: null
        });
        get().buildWorldsBracket();
      } else {
        set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
      }
    } else if (seasonPhase === 'WORLDS') {
      const worldsFinal = worldsMatches.find(m => m.id === 'worlds_f');
      if (worldsFinal && worldsFinal.played) {
        const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
        const winnerName = ALL_TEAMS.find(t => t.id === worldsFinal.winnerId)?.name || 'unknown';

        get().emails.push({
          id: `email_stove_commenced_${Date.now()}`,
          sender: '스토브 리그 알림판',
          title: `[종합] 시즌 최종 폐막 및 스토브 리그 정식 이적 시장 개장!`,
          content: `엄청났던 올 해의 LoL 월드 챔피언십 우승팀은 결국 [${winnerName}]으로 확정났습니다! 길었던 정규 시즌이 완전히 끝마쳐지고, 드디어 피의 스토브 리그(Stove League) 전면 FA 이적 계약 창구가 문을 활짝 엽니다. 로스터를 리구성하여 다가올 새로운 해를 공표하십시오!`,
          date: textDate,
          read: false,
          type: 'NEWS'
        });

        set({
          seasonPhase: 'STOVE_LEAGUE',
          gameState: 'STOVE_LEAGUE',
          activeMatch: null,
          draftState: null,
          matchSimulationResult: null
        });
      } else {
        set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
      }
    } else {
      set({ gameState: 'OFFICE', activeMatch: null, draftState: null, matchSimulationResult: null });
    }
  }
});
