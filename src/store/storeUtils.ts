import { Player, Team, Match, Email, Staff } from '../types';
import { INITIAL_TEAMS, INITIAL_PLAYERS } from '../data/initialData';
import { selectSmartDraftPick } from '../utils/draft';

// Dynamic LCK double round-robin generator for 10 teams
export const generateLckSchedule = (teams: Team[]): Omit<Match, 'log' | 'id'>[] => {
  const lckTeams = teams.filter(t => t.region === 'LCK');
  if (lckTeams.length < 2) return [];

  const numTeams = lckTeams.length;
  const rounds = numTeams - 1; // 9 rounds of single round-robin
  const matchesPerRound = numTeams / 2; // 5 matches per round

  const list = [...lckTeams];
  const schedule: Omit<Match, 'log' | 'id'>[] = [];

  // Round robin scheduling algorithm (Circle method)
  // Part 1: First Round Robin (Weeks 1 to 9)
  for (let r = 0; r < rounds; r++) {
    const week = r + 1;
    for (let m = 0; m < matchesPerRound; m++) {
      const homeIdx = (r + m) % (numTeams - 1);
      let awayIdx = (r + numTeams - 1 - m) % (numTeams - 1);

      if (m === 0) {
        awayIdx = numTeams - 1;
      }

      const homeTeam = list[homeIdx];
      const awayTeam = list[awayIdx];

      schedule.push({
        week,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        played: false
      });
    }
  }

  // Part 2: Second Round Robin (Weeks 10 to 18) with flipped home/away
  for (let r = 0; r < rounds; r++) {
    const week = r + 1 + rounds;
    for (let m = 0; m < matchesPerRound; m++) {
      const homeIdx = (r + m) % (numTeams - 1);
      let awayIdx = (r + numTeams - 1 - m) % (numTeams - 1);

      if (m === 0) {
        awayIdx = numTeams - 1;
      }

      const homeTeam = list[homeIdx];
      const awayTeam = list[awayIdx];

      schedule.push({
        week,
        homeTeamId: awayTeam.id,
        awayTeamId: homeTeam.id,
        played: false
      });
    }
  }

  return schedule;
};

/**
 * Shared utility: Build a roster map for AI teams using smart draft picks
 * instead of hardcoded champion arrays. Each team gets 5 champions selected
 * via the draft AI, respecting counters and synergies.
 */
export const buildAIRosterMap = (
  teamId: string,
  teamPlayers: Player[],
  playerTeamId: string | null,
  startingLineup?: Record<string, string>
): Record<string, { player: Player; championId: string }> => {
  const map: Record<string, { player: Player; championId: string }> = {};
  const lanes: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const pickedChamps: string[] = [];

  lanes.forEach((lane) => {
    let p: Player | undefined;
    // If this is the player's team, use their starting lineup
    if (teamId === playerTeamId && startingLineup) {
      const starterId = startingLineup[lane];
      p = teamPlayers.find(pl => pl.id === starterId);
    }
    if (!p) {
      p = teamPlayers.find(pl => pl.teamId === teamId && pl.role === lane);
    }
    if (!p) {
      p = teamPlayers.find(pl => pl.teamId === teamId) || teamPlayers[0];
    }

    // Use smart draft AI to pick a champion for this lane
    const champId = selectSmartDraftPick(pickedChamps, [], pickedChamps, false);
    pickedChamps.push(champId);
    map[lane] = { player: p, championId: champId };
  });
  return map;
};

export const INITIAL_EMAILS: Email[] = [
  {
    id: 'e1',
    sender: 'e스포츠 이사회',
    title: '신임 감독 취임을 축하드립니다!',
    content: '리그 오브 레전드 글로벌 매니저 세계에 오신 것을 환영합니다! 신임 감독으로서 구단의 재정과 로스터를 안정적으로 관리하고, 철저한 대결 준비와 전술적인 밴픽을 구사하여 LCK 리그 우승 컵을 들어 올려주시기 바랍니다. 화이팅입니다!',
    date: '2026년 1월 1일',
    read: false,
    type: 'CONGRATS'
  },
  {
    id: 'e2',
    sender: '분석 요원',
    title: '로스터 컨디션 및 훈련 팁',
    content: '감독님, 선수들의 훈련 성과는 선수 개개인의 기복성(consistency)과 컨디션(condition)에 크게 좌우됩니다. 경기 일정이 오기 전 대시보드 우측의 로스터 패널을 통해 훈련(Training)을 지시하여 능력치를 올리거나 훈련으로 지친 선수들을 푹 쉬게 해 주어 안정적인 능력을 발휘하도록 지원해야 합니다.',
    date: '2026년 1월 1일',
    read: false,
    type: 'SYSTEM'
  }
];

export const INITIAL_FREE_AGENTS: Player[] = [
  {
    id: 'scout',
    name: '이예찬',
    summonerName: 'Scout',
    role: 'MID',
    teamId: 'FA',
    age: 27,
    contractYears: 1,
    salary: 82000,
    lanePhase: 93,
    mechanics: 91,
    macro: 93,
    teamfight: 92,
    shotcalling: 94,
    mental: 90,
    consistency: 88,
    championPool: { azir: 9, sylas: 9, orianna: 8 },
    condition: 100,
    form: 'NORMAL'
  },
  {
    id: 'kanavi',
    name: '서진혁',
    summonerName: 'Kanavi',
    role: 'JUNGLE',
    teamId: 'FA',
    age: 25,
    contractYears: 1,
    salary: 72000,
    lanePhase: 88,
    mechanics: 94,
    macro: 92,
    teamfight: 91,
    shotcalling: 88,
    mental: 88,
    consistency: 84,
    championPool: { leesin: 10, sejuani: 7, brand: 8 },
    condition: 100,
    form: 'NORMAL'
  },
  {
    id: 'theshy',
    name: '강승록',
    summonerName: 'TheShy',
    role: 'TOP',
    teamId: 'FA',
    age: 26,
    contractYears: 1,
    salary: 68000,
    lanePhase: 94,
    mechanics: 95,
    macro: 84,
    teamfight: 95,
    shotcalling: 80,
    mental: 82,
    consistency: 70,
    championPool: { aatrox: 10, jayce: 9, rumble: 8 },
    condition: 100,
    form: 'NORMAL'
  }
];

export const GLOBAL_TEAMS_ADDITIONAL: Team[] = [
  {
    id: 'blg',
    name: 'Bilibili Gaming',
    logo: '🐳',
    color: '#00A1E9',
    textColor: '#FFFFFF',
    tier: 'S',
    fans: 8900000,
    budget: 35000000,
    region: 'LPL',
    roster: { TOP: 'bin', JUNGLE: 'xun', MID: 'knight', ADC: 'viper', SUPPORT: 'on', SUB: [] }
  },
  {
    id: 'tes',
    name: 'Top Esports',
    logo: '🔥',
    color: '#FF4500',
    textColor: '#FFFFFF',
    tier: 'A',
    fans: 8200000,
    budget: 29000000,
    region: 'LPL',
    roster: { TOP: '369', JUNGLE: 'naiyou', MID: 'creme', ADC: 'jiaqi', SUPPORT: 'fengyue', SUB: [] }
  },
  {
    id: 'wbg',
    name: 'Weibo Gaming',
    logo: '👁️',
    color: '#E60012',
    textColor: '#FFFFFF',
    tier: 'B',
    fans: 7800000,
    budget: 27000000,
    region: 'LPL',
    roster: { TOP: 'zika', JUNGLE: 'jiejie', MID: 'xiaohu', ADC: 'elk', SUPPORT: 'erha', SUB: [] }
  },
  {
    id: 'jdg',
    name: 'JD Gaming',
    logo: '🐉',
    color: '#FD373F',
    textColor: '#FFFFFF',
    tier: 'S',
    fans: 8000000,
    budget: 33000000,
    region: 'LPL',
    roster: { TOP: 'xiaoxu', JUNGLE: 'junjia', MID: 'hongq', ADC: 'gala', SUPPORT: 'vampire', SUB: [] }
  },
  {
    id: 'g2',
    name: 'G2 Esports',
    logo: '⚔️',
    color: '#7F7F7F',
    textColor: '#FFFFFF',
    tier: 'S',
    fans: 6500000,
    budget: 18000000,
    region: 'LEC',
    roster: { TOP: 'brokenblade', JUNGLE: 'skewmond', MID: 'caps', ADC: 'hanssama', SUPPORT: 'labrov', SUB: [] }
  },
  {
    id: 'fnc',
    name: 'Fnatic',
    logo: '🧡',
    color: '#F57F20',
    textColor: '#000000',
    tier: 'A',
    fans: 7200000,
    budget: 16000000,
    region: 'LEC',
    roster: { TOP: 'empyros', JUNGLE: 'razork', MID: 'vladi', ADC: 'upset', SUPPORT: 'lospa', SUB: [] }
  },
  {
    id: 'kc',
    name: 'Karmine Corp',
    logo: '🟦',
    color: '#0B2447',
    textColor: '#FFFFFF',
    tier: 'B',
    fans: 6500000,
    budget: 14000000,
    region: 'LEC',
    roster: { TOP: 'canna', JUNGLE: 'yike', MID: 'kyeahoo', ADC: 'caliste', SUPPORT: 'busio', SUB: [] }
  },
  {
    id: 'mdk',
    name: 'Movistar KOI',
    logo: '🦁',
    color: '#E5D53B',
    textColor: '#000000',
    tier: 'B',
    fans: 4800000,
    budget: 11000000,
    region: 'LEC',
    roster: { TOP: 'myrwn', JUNGLE: 'elyoya', MID: 'jojopyun', ADC: 'supa', SUPPORT: 'alvaro', SUB: [] }
  },
  {
    id: 'tl',
    name: 'Team Liquid',
    logo: '🐎',
    color: '#14243B',
    textColor: '#FFFFFF',
    tier: 'A',
    fans: 5200000,
    budget: 18000000,
    region: 'LCS',
    roster: { TOP: 'morgan', JUNGLE: 'josedeodo', MID: 'quid', ADC: 'yeon', SUPPORT: 'corejj', SUB: [] }
  },
  {
    id: 'fly',
    name: 'FlyQuest',
    logo: '🟢',
    color: '#097969',
    textColor: '#FFFFFF',
    tier: 'A',
    fans: 3200000,
    budget: 12000000,
    region: 'LCS',
    roster: { TOP: 'gakgos', JUNGLE: 'gryffinn', MID: 'quad', ADC: 'massu', SUPPORT: 'cryogen', SUB: [] }
  },
  {
    id: 'c9',
    name: 'Cloud9',
    logo: '☁️',
    color: '#00AEEF',
    textColor: '#FFFFFF',
    tier: 'A',
    fans: 6800000,
    budget: 21000000,
    region: 'LCS',
    roster: { TOP: 'thanatos', JUNGLE: 'blaber', MID: 'apa', ADC: 'zven', SUPPORT: 'vulcan', SUB: [] }
  }
];

export const LCK_TEAMS: Team[] = INITIAL_TEAMS.map(team => ({
  ...team,
  region: 'LCK' as const
}));

export const ALL_TEAMS = [...LCK_TEAMS, ...GLOBAL_TEAMS_ADDITIONAL];

export const GLOBAL_PLAYERS: Player[] = [
  // BLG Roster
  { id: 'bin', name: '천쩌빈', summonerName: 'Bin', role: 'TOP', teamId: 'blg', age: 22, contractYears: 2, salary: 85000, lanePhase: 96, mechanics: 95, macro: 86, teamfight: 94, shotcalling: 78, mental: 92, consistency: 90, championPool: { jax: 10, aatrox: 9, ksante: 8, rumble: 8, fiora: 9, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'xun', name: '펑리쉰', summonerName: 'Xun', role: 'JUNGLE', teamId: 'blg', age: 23, contractYears: 1, salary: 55000, lanePhase: 86, mechanics: 91, macro: 89, teamfight: 91, shotcalling: 80, mental: 85, consistency: 82, championPool: { leesin: 9, sejuani: 8, nidalee: 8, brand: 8, graves: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'knight', name: '주딩', summonerName: 'knight', role: 'MID', teamId: 'blg', age: 25, contractYears: 2, salary: 120000, lanePhase: 95, mechanics: 97, macro: 94, teamfight: 96, shotcalling: 85, mental: 90, consistency: 94, championPool: { azir: 9, ahri: 9, orianna: 9, yone: 8, sylas: 9, hwei: 8, mel: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'viper', name: '박도현', summonerName: 'Viper', role: 'ADC', teamId: 'blg', age: 25, contractYears: 2, salary: 110000, lanePhase: 96, mechanics: 98, macro: 93, teamfight: 99, shotcalling: 80, mental: 96, consistency: 97, championPool: { jinx: 10, zeri: 9, ezreal: 9, ashe: 8, kaisa: 9, kalista: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'on', name: '뤄원쥔', summonerName: 'ON', role: 'SUPPORT', teamId: 'blg', age: 22, contractYears: 1, salary: 48000, lanePhase: 90, mechanics: 93, macro: 89, teamfight: 90, shotcalling: 80, mental: 80, consistency: 78, championPool: { rakan: 9, nautilus: 9, lulu: 8, leona: 8, alistar: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // TES Roster
  { id: '369', name: '바이자하오', summonerName: '369', role: 'TOP', teamId: 'tes', age: 24, contractYears: 1, salary: 72000, lanePhase: 91, mechanics: 89, macro: 91, teamfight: 93, shotcalling: 82, mental: 89, consistency: 93, championPool: { ksante: 10, renekton: 9, aatrox: 8, rumble: 8, gwen: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'naiyou', name: '양지안', summonerName: 'naiyou', role: 'JUNGLE', teamId: 'tes', age: 20, contractYears: 2, salary: 35000, lanePhase: 84, mechanics: 88, macro: 83, teamfight: 86, shotcalling: 72, mental: 83, consistency: 82, championPool: { leesin: 8, sejuani: 8, brand: 7, vi: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'creme', name: '린젠', summonerName: 'Creme', role: 'MID', teamId: 'tes', age: 22, contractYears: 2, salary: 50000, lanePhase: 88, mechanics: 93, macro: 85, teamfight: 90, shotcalling: 70, mental: 86, consistency: 84, championPool: { yone: 9, sylas: 9, ahri: 8, akali: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'jiaqi', name: '자오자치', summonerName: 'JiaQi', role: 'ADC', teamId: 'tes', age: 19, contractYears: 3, salary: 30000, lanePhase: 83, mechanics: 89, macro: 82, teamfight: 86, shotcalling: 70, mental: 82, consistency: 80, championPool: { jinx: 8, zeri: 8, ezreal: 8, kaisa: 8, yunara: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'fengyue', name: '장펑위에', summonerName: 'fengyue', role: 'SUPPORT', teamId: 'tes', age: 19, contractYears: 3, salary: 28000, lanePhase: 81, mechanics: 85, macro: 83, teamfight: 84, shotcalling: 71, mental: 80, consistency: 80, championPool: { rakan: 8, nautilus: 8, braum: 8, leona: 8, zaahen: 7 }, condition: 100, form: 'NORMAL' },

  // WBG Roster
  { id: 'zika', name: '탕화위', summonerName: 'Zika', role: 'TOP', teamId: 'wbg', age: 22, contractYears: 2, salary: 55000, lanePhase: 88, mechanics: 89, macro: 86, teamfight: 89, shotcalling: 75, mental: 88, consistency: 86, championPool: { ksante: 9, aatrox: 8, renekton: 8, gwen: 8, rumble: 7, ambessa: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'jiejie', name: '자오리제', summonerName: 'Jiejie', role: 'JUNGLE', teamId: 'wbg', age: 24, contractYears: 1, salary: 68000, lanePhase: 88, mechanics: 90, macro: 91, teamfight: 89, shotcalling: 85, mental: 89, consistency: 86, championPool: { leesin: 9, sejuani: 8, brand: 8, vi: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'xiaohu', name: '리위안하오', summonerName: 'xiaohu', role: 'MID', teamId: 'wbg', age: 28, contractYears: 2, salary: 88000, lanePhase: 87, mechanics: 88, macro: 96, teamfight: 92, shotcalling: 93, mental: 91, consistency: 90, championPool: { azir: 9, orianna: 9, yone: 7, taliyah: 8, hwei: 8, mel: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'elk', name: '자오자하오', summonerName: 'Elk', role: 'ADC', teamId: 'wbg', age: 25, contractYears: 2, salary: 80000, lanePhase: 92, mechanics: 94, macro: 88, teamfight: 95, shotcalling: 75, mental: 90, consistency: 91, championPool: { zeri: 9, jinx: 9, ezreal: 8, kaisa: 9, kalista: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'erha', name: '첸싱민', summonerName: 'Erha', role: 'SUPPORT', teamId: 'wbg', age: 20, contractYears: 2, salary: 32000, lanePhase: 82, mechanics: 85, macro: 84, teamfight: 83, shotcalling: 76, mental: 82, consistency: 81, championPool: { rakan: 8, nautilus: 8, alistar: 7, leona: 8, zaahen: 7 }, condition: 100, form: 'NORMAL' },

  // JDG Roster
  { id: 'xiaoxu', name: '쉬싱주', summonerName: 'Xiaoxu', role: 'TOP', teamId: 'jdg', age: 21, contractYears: 2, salary: 42000, lanePhase: 84, mechanics: 86, macro: 82, teamfight: 85, shotcalling: 70, mental: 82, consistency: 81, championPool: { ksante: 8, renekton: 8, aatrox: 8, rumble: 7, ambessa: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'junjia', name: '위쥔자', summonerName: 'JunJia', role: 'JUNGLE', teamId: 'jdg', age: 23, contractYears: 2, salary: 48000, lanePhase: 85, mechanics: 87, macro: 88, teamfight: 86, shotcalling: 78, mental: 85, consistency: 83, championPool: { sejuani: 8, leesin: 8, brand: 7, vi: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'hongq', name: '왕홍치', summonerName: 'HongQ', role: 'MID', teamId: 'jdg', age: 20, contractYears: 3, salary: 30000, lanePhase: 82, mechanics: 85, macro: 83, teamfight: 84, shotcalling: 70, mental: 82, consistency: 80, championPool: { azir: 8, ahri: 8, orianna: 8, yone: 7, mel: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'gala', name: '천웨이', summonerName: 'GALA', role: 'ADC', teamId: 'jdg', age: 25, contractYears: 2, salary: 90000, lanePhase: 94, mechanics: 95, macro: 90, teamfight: 96, shotcalling: 80, mental: 94, consistency: 94, championPool: { kaisa: 10, zeri: 9, ezreal: 9, jinx: 9, varus: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'vampire', name: '자오주페이', summonerName: 'Vampire', role: 'SUPPORT', teamId: 'jdg', age: 22, contractYears: 2, salary: 35000, lanePhase: 83, mechanics: 85, macro: 85, teamfight: 84, shotcalling: 74, mental: 82, consistency: 81, championPool: { rakan: 8, nautilus: 8, braum: 8, leona: 8, zaahen: 7 }, condition: 100, form: 'NORMAL' },

  // G2 Roster
  { id: 'brokenblade', name: '세르겐 첼리크', summonerName: 'BrokenBlade', role: 'TOP', teamId: 'g2', age: 26, contractYears: 2, salary: 45000, lanePhase: 88, mechanics: 89, macro: 90, teamfight: 91, shotcalling: 82, mental: 90, consistency: 88, championPool: { ksante: 9, renekton: 9, aatrox: 8, rumble: 8, fiora: 7, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'skewmond', name: '루디 스큐몽', summonerName: 'SkewMond', role: 'JUNGLE', teamId: 'g2', age: 21, contractYears: 2, salary: 32000, lanePhase: 83, mechanics: 86, macro: 84, teamfight: 85, shotcalling: 74, mental: 84, consistency: 82, championPool: { leesin: 8, sejuani: 8, brand: 8, vi: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'caps', name: '라스무스 뷘터', summonerName: 'Caps', role: 'MID', teamId: 'g2', age: 26, contractYears: 3, salary: 75000, lanePhase: 92, mechanics: 94, macro: 94, teamfight: 93, shotcalling: 94, mental: 95, consistency: 91, championPool: { azir: 9, ahri: 9, orianna: 9, yone: 8, sylas: 9, hwei: 9, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'hanssama', name: '스티븐 리브', summonerName: 'HansSama', role: 'ADC', teamId: 'g2', age: 26, contractYears: 1, salary: 42000, lanePhase: 91, mechanics: 91, macro: 85, teamfight: 90, shotcalling: 72, mental: 85, consistency: 84, championPool: { jinx: 9, zeri: 8, ashe: 8, ezreal: 8, kaisa: 8, yunara: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'labrov', name: '라브로스 파푸차키스', summonerName: 'Labrov', role: 'SUPPORT', teamId: 'g2', age: 24, contractYears: 2, salary: 42000, lanePhase: 86, mechanics: 87, macro: 88, teamfight: 86, shotcalling: 80, mental: 85, consistency: 85, championPool: { rakan: 8, nautilus: 8, alistar: 8, leona: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // FNC Roster
  { id: 'empyros', name: '파나지오티스 탄티스', summonerName: 'Empyros', role: 'TOP', teamId: 'fnc', age: 21, contractYears: 2, salary: 26000, lanePhase: 80, mechanics: 84, macro: 81, teamfight: 83, shotcalling: 70, mental: 81, consistency: 80, championPool: { ksante: 8, aatrox: 8, renekton: 8, gwen: 7, ambessa: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'razork', name: '이반 마르틴', summonerName: 'Razork', role: 'JUNGLE', teamId: 'fnc', age: 25, contractYears: 2, salary: 34000, lanePhase: 84, mechanics: 88, macro: 89, teamfight: 88, shotcalling: 85, mental: 82, consistency: 80, championPool: { leesin: 8, sejuani: 8, brand: 8, viego: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'vladi', name: '블라디미로스 쿠르티디스', summonerName: 'Vladi', role: 'MID', teamId: 'fnc', age: 20, contractYears: 2, salary: 35000, lanePhase: 84, mechanics: 86, macro: 85, teamfight: 87, shotcalling: 70, mental: 85, consistency: 80, championPool: { azir: 8, orianna: 8, yone: 8, ahri: 7, mel: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'upset', name: '엘리아스 립', summonerName: 'Upset', role: 'ADC', teamId: 'fnc', age: 26, contractYears: 2, salary: 58000, lanePhase: 90, mechanics: 91, macro: 88, teamfight: 91, shotcalling: 78, mental: 88, consistency: 87, championPool: { ezreal: 9, kaisa: 8, zeri: 8, jinx: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'lospa', name: '박준형', summonerName: 'Lospa', role: 'SUPPORT', teamId: 'fnc', age: 21, contractYears: 2, salary: 22000, lanePhase: 81, mechanics: 84, macro: 82, teamfight: 83, shotcalling: 74, mental: 82, consistency: 81, championPool: { rakan: 8, nautilus: 8, lulu: 7, braum: 7, zaahen: 7 }, condition: 100, form: 'NORMAL' },

  // KC Roster
  { id: 'canna', name: '김창동', summonerName: 'Canna', role: 'TOP', teamId: 'kc', age: 25, contractYears: 1, salary: 55000, lanePhase: 87, mechanics: 87, macro: 86, teamfight: 88, shotcalling: 78, mental: 87, consistency: 85, championPool: { gwen: 9, renekton: 8, aatrox: 8, ksante: 8, jayce: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'yike', name: '마르틴 순델린', summonerName: 'Yike', role: 'JUNGLE', teamId: 'kc', age: 24, contractYears: 2, salary: 38000, lanePhase: 84, mechanics: 89, macro: 88, teamfight: 89, shotcalling: 75, mental: 84, consistency: 85, championPool: { leesin: 8, lillia: 9, brand: 8, graves: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'kyeahoo', name: '강예후', summonerName: 'Kyeahoo', role: 'MID', teamId: 'kc', age: 21, contractYears: 2, salary: 32000, lanePhase: 82, mechanics: 85, macro: 83, teamfight: 84, shotcalling: 72, mental: 82, consistency: 81, championPool: { azir: 8, ahri: 8, orianna: 8, sylas: 7, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'caliste', name: '칼리스트', summonerName: 'Caliste', role: 'ADC', teamId: 'kc', age: 19, contractYears: 3, salary: 65000, lanePhase: 88, mechanics: 91, macro: 86, teamfight: 90, shotcalling: 75, mental: 88, consistency: 86, championPool: { zeri: 9, kaisa: 9, jinx: 8, ezreal: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'busio', name: '알란 크왈리나', summonerName: 'Busio', role: 'SUPPORT', teamId: 'kc', age: 21, contractYears: 2, salary: 45000, lanePhase: 85, mechanics: 87, macro: 88, teamfight: 87, shotcalling: 78, mental: 85, consistency: 84, championPool: { thresh: 9, bard: 8, rakan: 8, lulu: 7, alistar: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // MDK Roster
  { id: 'myrwn', name: '알렉스 파스토르', summonerName: 'Myrwn', role: 'TOP', teamId: 'mdk', age: 21, contractYears: 2, salary: 40000, lanePhase: 84, mechanics: 88, macro: 82, teamfight: 85, shotcalling: 75, mental: 86, consistency: 80, championPool: { ksante: 8, aatrox: 8, renekton: 8, gwen: 8, rumble: 7, ambessa: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'elyoya', name: '하비에르 프라데스', summonerName: 'Elyoya', role: 'JUNGLE', teamId: 'mdk', age: 25, contractYears: 2, salary: 85000, lanePhase: 86, mechanics: 88, macro: 92, teamfight: 89, shotcalling: 94, mental: 91, consistency: 90, championPool: { leesin: 9, vi: 9, brand: 8, sejuani: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'jojopyun', name: '조셉 편', summonerName: 'Jojopyun', role: 'MID', teamId: 'mdk', age: 21, contractYears: 2, salary: 55000, lanePhase: 89, mechanics: 91, macro: 85, teamfight: 88, shotcalling: 82, mental: 88, consistency: 82, championPool: { yone: 9, azir: 8, ahri: 8, sylas: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'supa', name: '다비드 가르시아', summonerName: 'Supa', role: 'ADC', teamId: 'mdk', age: 23, contractYears: 2, salary: 50000, lanePhase: 85, mechanics: 89, macro: 81, teamfight: 88, shotcalling: 72, mental: 84, consistency: 82, championPool: { zeri: 8, kaisa: 8, jinx: 8, ezreal: 8, yunara: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'alvaro', name: '알바로 페르난데스', summonerName: 'Alvaro', role: 'SUPPORT', teamId: 'mdk', age: 22, contractYears: 2, salary: 45000, lanePhase: 86, mechanics: 87, macro: 85, teamfight: 87, shotcalling: 85, mental: 87, consistency: 84, championPool: { nautilus: 9, rakan: 8, alistar: 8, leona: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // TL Roster
  { id: 'morgan', name: '박기태', summonerName: 'Morgan', role: 'TOP', teamId: 'tl', age: 24, contractYears: 1, salary: 38000, lanePhase: 84, mechanics: 85, macro: 84, teamfight: 88, shotcalling: 76, mental: 89, consistency: 85, championPool: { renekton: 9, ksante: 8, aatrox: 8, rumble: 8, gwen: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'josedeodo', name: '브랜든 빌레가스', summonerName: 'Josedeodo', role: 'JUNGLE', teamId: 'tl', age: 24, contractYears: 2, salary: 36000, lanePhase: 83, mechanics: 86, macro: 85, teamfight: 85, shotcalling: 78, mental: 85, consistency: 83, championPool: { leesin: 8, sejuani: 8, brand: 7, viego: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'quid', name: '임현승', summonerName: 'Quid', role: 'MID', teamId: 'tl', age: 21, contractYears: 2, salary: 32000, lanePhase: 84, mechanics: 86, macro: 84, teamfight: 85, shotcalling: 76, mental: 84, consistency: 82, championPool: { azir: 8, ahri: 8, yone: 8, taliyah: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'yeon', name: '연연', summonerName: 'Yeon', role: 'ADC', teamId: 'tl', age: 23, contractYears: 2, salary: 30000, lanePhase: 85, mechanics: 87, macro: 84, teamfight: 88, shotcalling: 72, mental: 85, consistency: 86, championPool: { jinx: 8, zeri: 8, ezreal: 8, kaisa: 8, yunara: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'corejj', name: '조용인', summonerName: 'CoreJJ', role: 'SUPPORT', teamId: 'tl', age: 31, contractYears: 1, salary: 55000, lanePhase: 88, mechanics: 86, macro: 96, teamfight: 90, shotcalling: 96, mental: 96, consistency: 92, championPool: { rakan: 9, nautilus: 9, alistar: 8, leona: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // FLY Roster
  { id: 'gakgos', name: '사멧 불루트', summonerName: 'Gakgos', role: 'TOP', teamId: 'fly', age: 20, contractYears: 2, salary: 28000, lanePhase: 81, mechanics: 84, macro: 82, teamfight: 83, shotcalling: 70, mental: 81, consistency: 80, championPool: { ksante: 8, aatrox: 8, renekton: 8, gwen: 7, ambessa: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'gryffinn', name: '그리핀', summonerName: 'Gryffinn', role: 'JUNGLE', teamId: 'fly', age: 20, contractYears: 2, salary: 30000, lanePhase: 82, mechanics: 85, macro: 83, teamfight: 84, shotcalling: 72, mental: 83, consistency: 81, championPool: { leesin: 8, sejuani: 8, brand: 8, viego: 7, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'quad', name: '송수형', summonerName: 'Quad', role: 'MID', teamId: 'fly', age: 23, contractYears: 1, salary: 55000, lanePhase: 88, mechanics: 89, macro: 87, teamfight: 89, shotcalling: 80, mental: 88, consistency: 87, championPool: { azir: 8, corki: 9, orianna: 8, taliyah: 8, mel: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'massu', name: '파하드 압둘말릭', summonerName: 'Massu', role: 'ADC', teamId: 'fly', age: 20, contractYears: 2, salary: 40000, lanePhase: 86, mechanics: 89, macro: 84, teamfight: 88, shotcalling: 70, mental: 87, consistency: 85, championPool: { aphelios: 8, lucian: 8, zeri: 8, jinx: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'cryogen', name: '크라이오젠', summonerName: 'Cryogen', role: 'SUPPORT', teamId: 'fly', age: 20, contractYears: 2, salary: 25000, lanePhase: 80, mechanics: 83, macro: 82, teamfight: 82, shotcalling: 70, mental: 80, consistency: 79, championPool: { rakan: 8, lulu: 8, nautilus: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // C9 Roster
  { id: 'thanatos', name: '박승규', summonerName: 'Thanatos', role: 'TOP', teamId: 'c9', age: 22, contractYears: 2, salary: 30000, lanePhase: 84, mechanics: 88, macro: 82, teamfight: 86, shotcalling: 70, mental: 82, consistency: 80, championPool: { ksante: 8, aatrox: 9, renekton: 8, rumble: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'blaber', name: '로버트 후앙', summonerName: 'Blaber', role: 'JUNGLE', teamId: 'c9', age: 26, contractYears: 2, salary: 48000, lanePhase: 86, mechanics: 90, macro: 88, teamfight: 89, shotcalling: 84, mental: 85, consistency: 82, championPool: { leesin: 9, sejuani: 8, brand: 8, viego: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'apa', name: '에이피에이', summonerName: 'APA', role: 'MID', teamId: 'c9', age: 23, contractYears: 2, salary: 28000, lanePhase: 83, mechanics: 84, macro: 85, teamfight: 87, shotcalling: 80, mental: 90, consistency: 80, championPool: { ziggs: 9, taliyah: 8, azir: 8, orianna: 8, hwei: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'zven', name: '제스퍼 스베닝센', summonerName: 'Zven', role: 'ADC', teamId: 'c9', age: 28, contractYears: 1, salary: 52000, lanePhase: 88, mechanics: 89, macro: 91, teamfight: 91, shotcalling: 85, mental: 90, consistency: 89, championPool: { ezreal: 9, jinx: 8, ashe: 8, varus: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'vulcan', name: '필립 라플람', summonerName: 'Vulcan', role: 'SUPPORT', teamId: 'c9', age: 26, contractYears: 1, salary: 35000, lanePhase: 83, mechanics: 85, macro: 86, teamfight: 86, shotcalling: 82, mental: 84, consistency: 84, championPool: { rakan: 8, nautilus: 8, alistar: 8, leona: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },

  // Global FAs (Displaced Players)
  { id: 'tian', name: '가오톈량', summonerName: 'Tian', role: 'JUNGLE', teamId: 'FA', age: 25, contractYears: 1, salary: 70000, lanePhase: 88, mechanics: 92, macro: 93, teamfight: 92, shotcalling: 86, mental: 84, consistency: 80, championPool: { leesin: 9, sejuani: 9, maokai: 8, brand: 8, viego: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'jackeylove', name: '위원보', summonerName: 'JackeyLove', role: 'ADC', teamId: 'FA', age: 25, contractYears: 2, salary: 98000, lanePhase: 94, mechanics: 95, macro: 90, teamfight: 94, shotcalling: 88, mental: 94, consistency: 88, championPool: { jinx: 9, ezreal: 9, ashe: 8, kaisa: 9, zeri: 9, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'meiko', name: '톈예', summonerName: 'Meiko', role: 'SUPPORT', teamId: 'FA', age: 27, contractYears: 1, salary: 65000, lanePhase: 90, mechanics: 89, macro: 94, teamfight: 91, shotcalling: 94, mental: 92, consistency: 91, championPool: { rakan: 9, nautilus: 9, lulu: 8, alistar: 9, braum: 8, zaahen: 9 }, condition: 100, form: 'NORMAL' },
  { id: 'breathe', name: '천천', summonerName: 'Breathe', role: 'TOP', teamId: 'FA', age: 24, contractYears: 1, salary: 52000, lanePhase: 85, mechanics: 88, macro: 87, teamfight: 89, shotcalling: 76, mental: 85, consistency: 84, championPool: { ksante: 9, renekton: 8, jayce: 8, aatrox: 8, rumble: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'tarzan', name: '이승용', summonerName: 'Tarzan', role: 'JUNGLE', teamId: 'FA', age: 26, contractYears: 1, salary: 60000, lanePhase: 88, mechanics: 91, macro: 94, teamfight: 90, shotcalling: 85, mental: 88, consistency: 89, championPool: { sejuani: 9, leesin: 8, maokai: 9, brand: 8, viego: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'light', name: '왕광위', summonerName: 'Light', role: 'ADC', teamId: 'FA', age: 25, contractYears: 1, salary: 50000, lanePhase: 89, mechanics: 90, macro: 88, teamfight: 93, shotcalling: 75, mental: 90, consistency: 92, championPool: { zeri: 8, jinx: 9, ashe: 8, ezreal: 8, kaisa: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'crisp', name: '류칭쑹', summonerName: 'Crisp', role: 'SUPPORT', teamId: 'FA', age: 27, contractYears: 1, salary: 55000, lanePhase: 86, mechanics: 88, macro: 91, teamfight: 90, shotcalling: 85, mental: 88, consistency: 86, championPool: { rakan: 9, lulu: 8, nautilus: 8, leona: 8, alistar: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'yagao_jdg', name: '쩡치', summonerName: 'Yagao', role: 'MID', teamId: 'FA', age: 26, contractYears: 1, salary: 65000, lanePhase: 85, mechanics: 86, macro: 91, teamfight: 89, shotcalling: 88, mental: 92, consistency: 90, championPool: { azir: 9, taliyah: 9, ahri: 8, orianna: 8, mel: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'sheer', name: '쉬지에', summonerName: 'sheer', role: 'TOP', teamId: 'FA', age: 19, contractYears: 3, salary: 45000, lanePhase: 88, mechanics: 91, macro: 84, teamfight: 89, shotcalling: 70, mental: 86, consistency: 80, championPool: { ksante: 9, aatrox: 8, jayce: 7, rumble: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'missing_jdg', name: '루윈펑', summonerName: 'Missing', role: 'SUPPORT', teamId: 'FA', age: 24, contractYears: 2, salary: 55000, lanePhase: 88, mechanics: 87, macro: 91, teamfight: 91, shotcalling: 82, mental: 89, consistency: 90, championPool: { rakan: 10, nautilus: 8, lulu: 8, alistar: 8, zaahen: 9 }, condition: 100, form: 'NORMAL' },
  { id: 'mikyx', name: '미하엘 메흘레', summonerName: 'Mikyx', role: 'SUPPORT', teamId: 'FA', age: 27, contractYears: 1, salary: 40000, lanePhase: 89, mechanics: 90, macro: 92, teamfight: 89, shotcalling: 88, mental: 89, consistency: 85, championPool: { rakan: 9, nautilus: 8, lulu: 8, bard: 9, pyke: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'oscarinin', name: '오스카 무뇨스', summonerName: 'Oscarinin', role: 'TOP', teamId: 'FA', age: 23, contractYears: 1, salary: 28000, lanePhase: 81, mechanics: 84, macro: 82, teamfight: 85, shotcalling: 70, mental: 80, consistency: 78, championPool: { ksante: 8, aatrox: 8, renekton: 8, gwen: 8, ambessa: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'humanoid', name: '마레크 브라즈다', summonerName: 'Humanoid', role: 'MID', teamId: 'FA', age: 25, contractYears: 1, salary: 42000, lanePhase: 89, mechanics: 90, macro: 88, teamfight: 89, shotcalling: 82, mental: 81, consistency: 75, championPool: { azir: 8, orianna: 9, yone: 8, sylas: 8, mel: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'noah', name: '오현택', summonerName: 'Noah', role: 'ADC', teamId: 'FA', age: 24, contractYears: 2, salary: 30000, lanePhase: 86, mechanics: 89, macro: 83, teamfight: 88, shotcalling: 70, mental: 80, consistency: 82, championPool: { zeri: 9, ezreal: 8, jinx: 8, ashe: 8, yunara: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'jun', name: '윤세준', summonerName: 'Jun', role: 'SUPPORT', teamId: 'FA', age: 25, contractYears: 2, salary: 28000, lanePhase: 84, mechanics: 86, macro: 85, teamfight: 86, shotcalling: 75, mental: 82, consistency: 84, championPool: { rakan: 8, nautilus: 8, lulu: 7, alistar: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'closer_kc', name: '잔 첼리크', summonerName: 'Closer', role: 'JUNGLE', teamId: 'FA', age: 23, contractYears: 1, salary: 45000, lanePhase: 85, mechanics: 88, macro: 89, teamfight: 87, shotcalling: 82, mental: 86, consistency: 84, championPool: { leesin: 9, vi: 8, sejuani: 8, brand: 7, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'vladi_kc', name: '블라디슬라프', summonerName: 'Vladi', role: 'MID', teamId: 'FA', age: 20, contractYears: 2, salary: 35000, lanePhase: 84, mechanics: 86, macro: 85, teamfight: 87, shotcalling: 70, mental: 85, consistency: 80, championPool: { azir: 8, leblanc: 8, taliyah: 7, ahri: 8, mel: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'targamas_kc', name: '라파엘 크라베', summonerName: 'Targamas', role: 'SUPPORT', teamId: 'FA', age: 24, contractYears: 1, salary: 40000, lanePhase: 82, mechanics: 83, macro: 86, teamfight: 84, shotcalling: 80, mental: 82, consistency: 80, championPool: { rakan: 8, braum: 8, pyke: 9, nautilus: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'fresskowy_mdk', name: '바르트워메이', summonerName: 'Fresskowy', role: 'MID', teamId: 'FA', age: 23, contractYears: 1, salary: 42000, lanePhase: 83, mechanics: 84, macro: 86, teamfight: 86, shotcalling: 78, mental: 85, consistency: 83, championPool: { taliyah: 8, azir: 8, hwei: 8, orianna: 8, mel: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'bwipo_fly', name: '가브리엘 라우', summonerName: 'Bwipo', role: 'TOP', teamId: 'FA', age: 24, contractYears: 1, salary: 65000, lanePhase: 87, mechanics: 86, macro: 91, teamfight: 89, shotcalling: 88, mental: 91, consistency: 88, championPool: { aatrox: 9, jax: 9, ksante: 8, rumble: 9, gwen: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'inspired_fly', name: '카츠페르 스워마', summonerName: 'Inspired', role: 'JUNGLE', teamId: 'FA', age: 23, contractYears: 2, salary: 75000, lanePhase: 85, mechanics: 89, macro: 93, teamfight: 90, shotcalling: 90, mental: 90, consistency: 91, championPool: { graves: 9, karthus: 9, sejuani: 8, brand: 8, locke: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'busio_fly', name: '알란 크왈리나', summonerName: 'Busio', role: 'SUPPORT', teamId: 'FA', age: 21, contractYears: 2, salary: 45000, lanePhase: 85, mechanics: 87, macro: 88, teamfight: 87, shotcalling: 78, mental: 85, consistency: 84, championPool: { thresh: 9, bard: 8, rakan: 8, nautilus: 8, zaahen: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'impact_tl', name: '정언영', summonerName: 'Impact', role: 'TOP', teamId: 'FA', age: 31, contractYears: 2, salary: 50000, lanePhase: 88, mechanics: 85, macro: 94, teamfight: 91, shotcalling: 88, mental: 98, consistency: 95, championPool: { ksante: 9, renekton: 9, aatrox: 8, rumble: 8, gwen: 8, ambessa: 8 }, condition: 100, form: 'NORMAL' },
  { id: 'umti_tl', name: '엄성현', summonerName: 'UmTi', role: 'JUNGLE', teamId: 'FA', age: 26, contractYears: 1, salary: 32000, lanePhase: 82, mechanics: 85, macro: 90, teamfight: 85, shotcalling: 90, mental: 86, consistency: 84, championPool: { sejuani: 9, leesin: 8, maokai: 8, brand: 8, vi: 8, locke: 7 }, condition: 100, form: 'NORMAL' },
  { id: 'berserker_c9', name: '김민철', summonerName: 'Berserker', role: 'ADC', teamId: 'FA', age: 23, contractYears: 3, salary: 58000, lanePhase: 91, mechanics: 94, macro: 86, teamfight: 93, shotcalling: 70, mental: 90, consistency: 90, championPool: { zeri: 9, jinx: 9, ezreal: 8, kaisa: 9, yunara: 8 }, condition: 100, form: 'NORMAL' }
];

export const INITIAL_STAFF_POOL: Staff[] = [
  {
    id: 'staff_1',
    name: '김정균 kkOma',
    role: 'HEAD_COACH',
    teamId: 'FA',
    salary: 45000,
    rating: 95,
    trainingSkill: 95,
    tacticalSkill: 86,
    mentalSkill: 92
  },
  {
    id: 'staff_2',
    name: '김대호 cvMax',
    role: 'HEAD_COACH',
    teamId: 'FA',
    salary: 28000,
    rating: 86,
    trainingSkill: 92,
    tacticalSkill: 80,
    mentalSkill: 75
  },
  {
    id: 'staff_3',
    name: '임재현 Tom',
    role: 'TACTICAL_COACH',
    teamId: 'FA',
    salary: 32000,
    rating: 91,
    trainingSkill: 75,
    tacticalSkill: 95,
    mentalSkill: 83
  },
  {
    id: 'staff_4',
    name: '천주 Acorn',
    role: 'TACTICAL_COACH',
    teamId: 'FA',
    salary: 18000,
    rating: 80,
    trainingSkill: 70,
    tacticalSkill: 82,
    mentalSkill: 78
  },
  {
    id: 'staff_5',
    name: '최성범 Carey',
    role: 'MENTAL_COACH',
    teamId: 'FA',
    salary: 15000,
    rating: 88,
    trainingSkill: 65,
    tacticalSkill: 65,
    mentalSkill: 94
  },
  {
    id: 'staff_6',
    name: '서지수 Yuri',
    role: 'MENTAL_COACH',
    teamId: 'FA',
    salary: 10000,
    rating: 78,
    trainingSkill: 60,
    tacticalSkill: 60,
    mentalSkill: 84
  }
];

export const INITIAL_ACADEMY_ROOKIES_POOL: Player[] = [
  {
    id: 'rookie_gumon',
    name: '이민우',
    summonerName: 'Gumon',
    role: 'ADC',
    teamId: 'FA',
    age: 16,
    contractYears: 2,
    salary: 12000,
    lanePhase: 55,
    mechanics: 68,
    macro: 45,
    teamfight: 60,
    shotcalling: 40,
    mental: 62,
    consistency: 55,
    championPool: { zeri: 5, jinx: 6 },
    condition: 100,
    form: 'NORMAL',
    morale: 85,
    potential: 94
  },
  {
    id: 'rookie_rize',
    name: '강태원',
    summonerName: 'Rize',
    role: 'MID',
    teamId: 'FA',
    age: 17,
    contractYears: 2,
    salary: 14000,
    lanePhase: 60,
    mechanics: 66,
    macro: 52,
    teamfight: 58,
    shotcalling: 44,
    mental: 60,
    consistency: 60,
    championPool: { azir: 4, ahri: 6, orianna: 5 },
    condition: 100,
    form: 'NORMAL',
    morale: 80,
    potential: 91
  },
  {
    id: 'rookie_nero',
    name: '백동준',
    summonerName: 'Nero',
    role: 'JUNGLE',
    teamId: 'FA',
    age: 16,
    contractYears: 2,
    salary: 10000,
    lanePhase: 52,
    mechanics: 64,
    macro: 58,
    teamfight: 55,
    shotcalling: 48,
    mental: 58,
    consistency: 50,
    championPool: { leesin: 5, sejuani: 6 },
    condition: 100,
    form: 'NORMAL',
    morale: 90,
    potential: 89
  },
  {
    id: 'rookie_kahn',
    name: '임하늘',
    summonerName: 'KahnJr',
    role: 'TOP',
    teamId: 'FA',
    age: 17,
    contractYears: 2,
    salary: 15000,
    lanePhase: 64,
    mechanics: 70,
    macro: 48,
    teamfight: 62,
    shotcalling: 38,
    mental: 64,
    consistency: 54,
    championPool: { ksante: 6, aatrox: 5 },
    condition: 100,
    form: 'NORMAL',
    morale: 80,
    potential: 95
  },
  {
    id: 'rookie_dell',
    name: '박수호',
    summonerName: 'Dell',
    role: 'SUPPORT',
    teamId: 'FA',
    age: 16,
    contractYears: 2,
    salary: 8000,
    lanePhase: 48,
    mechanics: 55,
    macro: 55,
    teamfight: 50,
    shotcalling: 55,
    mental: 70,
    consistency: 65,
    championPool: { rakan: 5, lulu: 6 },
    condition: 100,
    form: 'NORMAL',
    morale: 85,
    potential: 88
  }
];

export const INITIAL_GAME_PLAYERS = [...INITIAL_PLAYERS, ...INITIAL_FREE_AGENTS, ...GLOBAL_PLAYERS].map(p => {
  const maxStat = Math.max(p.lanePhase, p.mechanics, p.macro, p.teamfight);
  let ageBonus = 2;
  if (p.age <= 19) {
    ageBonus = 8 + Math.floor(Math.random() * 5);
  } else if (p.age <= 22) {
    ageBonus = 5 + Math.floor(Math.random() * 4);
  } else if (p.age <= 25) {
    ageBonus = 3 + Math.floor(Math.random() * 3);
  } else {
    ageBonus = 1 + Math.floor(Math.random() * 2);
  }
  const calcPotential = Math.min(99, maxStat + ageBonus);

  return {
    ...p,
    morale: 80,
    potential: (p as any).potential || calcPotential,
    playstylePreference: p.playstylePreference || 'BALANCED',
    energy: 100
  } as Player;
});
