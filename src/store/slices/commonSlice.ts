import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { Standing, Match, Email } from '../../types';
import { formatCurrency } from '../../utils/format';
import { 
  ALL_TEAMS, 
  INITIAL_EMAILS, 
  INITIAL_GAME_PLAYERS, 
  INITIAL_STAFF_POOL, 
  INITIAL_ACADEMY_ROOKIES_POOL, 
  generateLckSchedule 
} from '../storeUtils';

export const createCommonSlice: StateCreator<
  GameStore,
  [],
  [],
  Pick<
    GameStore,
    | 'currentDate'
    | 'currentWeek'
    | 'gameState'
    | 'season'
    | 'seasonPhase'
    | 'trainingPoints'
    | 'coachingActionsLeft'
    | 'teams'
    | 'players'
    | 'playerTeamId'
    | 'startingLineup'
    | 'standings'
    | 'schedule'
    | 'emails'
    | 'playoffsMatches'
    | 'msiMatches'
    | 'worldsMatches'
    | 'selectedRegionStanding'
    | 'tactics'
    | 'coachingStaff'
    | 'activeStaff'
    | 'academyRookies'
    | 'setSelectedRegionStanding'
    | 'initializeGame'
    | 'setGameState'
    | 'readEmail'
    | 'respondToOffer'
    | 'changeTactics'
    | 'hireStaff'
    | 'fireStaff'
    | 'talkToPlayer'
  >
> = (set, get) => ({
  currentDate: new Date(2026, 0, 1),
  currentWeek: 1,
  gameState: 'SETUP',
  season: 1,
  seasonPhase: 'SPRING_REGULAR',
  trainingPoints: 10,
  coachingActionsLeft: 2,

  teams: ALL_TEAMS,
  players: INITIAL_GAME_PLAYERS,
  playerTeamId: null,
  startingLineup: {
    TOP: '',
    JUNGLE: '',
    MID: '',
    ADC: '',
    SUPPORT: ''
  },

  standings: [],
  schedule: [],
  emails: INITIAL_EMAILS,

  playoffsMatches: [],
  msiMatches: [],
  worldsMatches: [],
  selectedRegionStanding: 'LCK',

  tactics: {
    teamFocusRole: 'BALANCED',
    gameTempo: 'BALANCED',
    playstyle: 'TEAMFIGHT'
  },
  coachingStaff: INITIAL_STAFF_POOL,
  activeStaff: {},
  academyRookies: INITIAL_ACADEMY_ROOKIES_POOL,

  setSelectedRegionStanding: (region) => set({ selectedRegionStanding: region }),

  initializeGame: (selectedTeamId: string) => {
    const standings: Standing[] = ALL_TEAMS.map(team => ({
      teamId: team.id,
      wins: 0,
      losses: 0,
      gameDiff: 0
    }));

    const schedule: Match[] = generateLckSchedule(ALL_TEAMS).map((m, idx) => ({
      ...m,
      id: `match_${idx + 1}`,
      matchType: 'SPRING_REGULAR'
    }));

    const teamPlayers = INITIAL_GAME_PLAYERS.filter(p => p.teamId === selectedTeamId);
    const startingLineup = {
      TOP: teamPlayers.find(p => p.role === 'TOP')?.id || '',
      JUNGLE: teamPlayers.find(p => p.role === 'JUNGLE')?.id || '',
      MID: teamPlayers.find(p => p.role === 'MID')?.id || '',
      ADC: teamPlayers.find(p => p.role === 'ADC')?.id || '',
      SUPPORT: teamPlayers.find(p => p.role === 'SUPPORT')?.id || ''
    };

    set({
      playerTeamId: selectedTeamId,
      teams: ALL_TEAMS,
      players: INITIAL_GAME_PLAYERS,
      standings,
      schedule,
      startingLineup,
      season: 1,
      seasonPhase: 'SPRING_REGULAR',
      playoffsMatches: [],
      msiMatches: [],
      worldsMatches: [],
      selectedRegionStanding: 'LCK',
      emails: [...INITIAL_EMAILS],
      currentDate: new Date(2026, 0, 1),
      currentWeek: 1,
      gameState: 'OFFICE',
      trainingPoints: 10,
      activeMatch: null,
      draftState: null,
      matchSimulationResult: null
    });
  },

  setGameState: (state) => set({ gameState: state }),

  readEmail: (emailId) => {
    const nextEmails = get().emails.map(e => e.id === emailId ? { ...e, read: true } : e);
    set({ emails: nextEmails });
  },

  respondToOffer: (emailId, accept) => {
    const email = get().emails.find(e => e.id === emailId);
    if (!email || !email.offerDetails || email.offerDetails.type !== 'TRANSFER') return;

    const { playerId, price, teamId } = email.offerDetails;
    const { players, teams, playerTeamId } = get();

    if (accept && playerId && price && teamId) {
      const trgPlayer = players.find(p => p.id === playerId);
      if (!trgPlayer) return;

      const buyerTeam = teams.find(t => t.id === teamId);
      const myTeam = teams.find(t => t.id === playerTeamId);

      if (myTeam && buyerTeam) {
        const newTeams = teams.map(t => {
          if (t.id === playerTeamId) {
            return { ...t, budget: t.budget + price };
          }
          if (t.id === teamId) {
            return { ...t, budget: Math.max(0, t.budget - price) };
          }
          return t;
        });

        const newPlayers = players.map(p => {
          if (p.id === playerId) {
            return { ...p, teamId: teamId, condition: 100 };
          }
          return p;
        });

        const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
        const newsEmail: Email = {
          id: `news_${Date.now()}`,
          sender: 'LCK 기자단',
          title: `[속보] ${trgPlayer.summonerName}, ${buyerTeam.name}으로 충격 이적 성사!`,
          content: `LCK 이적 시장에 커다란 소식이 전해졌습니다. ${myTeam.name}에서 활약하던 명품 라이너 [${trgPlayer.summonerName}] 선수가 이적 보상액 ${formatCurrency(price)}을 남기고 ${buyerTeam.name} 구단으로의 깜짝 수혈 이적안에 전격 합의하였습니다.`,
          date: textDate,
          read: false,
          type: 'NEWS'
        };

        const updatedEmails = get().emails.map(e => e.id === emailId ? { ...e, read: true } : e);

        set({
          teams: newTeams,
          players: newPlayers,
          emails: [newsEmail, ...updatedEmails]
        });
      }
    } else {
      const updatedEmails = get().emails.map(e => e.id === emailId ? { ...e, read: true } : e);
      set({ emails: updatedEmails });
    }
  },

  changeTactics: (newTactics) => {
    set({ tactics: { ...get().tactics, ...newTactics } });
  },

  hireStaff: (staffId) => {
    const { coachingStaff, activeStaff, teams, playerTeamId } = get();
    const staff = coachingStaff.find(s => s.id === staffId);
    if (!staff) return { success: false, message: '스태프를 찾을 수 없습니다.' };
    
    const myTeam = teams.find(t => t.id === playerTeamId);
    if (!myTeam) return { success: false, message: '구단 정보를 불러올 수 없습니다.' };
    
    if (myTeam.budget < staff.salary) {
      return { success: false, message: `구단 예산이 부족합니다. (필요: ${staff.salary}만원)` };
    }

    const previousStaffId = activeStaff[staff.role];
    let updatedStaff = coachingStaff.map(s => {
      if (s.id === staffId) {
        return { ...s, teamId: playerTeamId };
      }
      if (previousStaffId && s.id === previousStaffId) {
        return { ...s, teamId: 'FA' };
      }
      return s;
    });

    const updatedActive = { ...activeStaff, [staff.role]: staffId };
    
    const updatedTeams = teams.map(t => {
      if (t.id === playerTeamId) {
        return { ...t, budget: Math.max(0, t.budget - staff.salary) };
      }
      return t;
    });

    set({
      coachingStaff: updatedStaff,
      activeStaff: updatedActive,
      teams: updatedTeams
    });

    return { success: true, message: `[${staff.name}] 코칭스태프 영입에 성공하였습니다!` };
  },

  fireStaff: (staffId) => {
    const { coachingStaff, activeStaff } = get();
    const staff = coachingStaff.find(s => s.id === staffId);
    if (!staff) return;

    const updatedStaff = coachingStaff.map(s => s.id === staffId ? { ...s, teamId: 'FA' } : s);
    const updatedActive = { ...activeStaff };
    if (updatedActive.HEAD_COACH === staffId) updatedActive.HEAD_COACH = undefined;
    if (updatedActive.TACTICAL_COACH === staffId) updatedActive.TACTICAL_COACH = undefined;
    if (updatedActive.MENTAL_COACH === staffId) updatedActive.MENTAL_COACH = undefined;

    set({
      coachingStaff: updatedStaff,
      activeStaff: updatedActive
    });
  },

  talkToPlayer: (playerId, talkType) => {
    const { players, playerTeamId, activeStaff, coachingStaff } = get();
    const player = players.find(p => p.id === playerId && p.teamId === playerTeamId);
    if (!player) return { message: '선수를 찾을 수 없습니다.', moraleChange: 0, formChange: false };

    let moraleChange = 0;
    let message = '';
    let formChange = false;

    const mentalCoachId = activeStaff.MENTAL_COACH;
    const mentalCoach = coachingStaff.find(s => s.id === mentalCoachId);
    const mentalBonus = mentalCoach ? Math.floor(mentalCoach.mentalSkill / 20) : 0;

    if (talkType === 'ENCOURAGE') {
      moraleChange = 8 + mentalBonus + Math.floor(Math.random() * 5);
      if (player.morale < 50) {
        moraleChange += 5;
      }
      message = `감독님이 [${player.summonerName}] 선수를 개별 면담해 따뜻하게 격려해주었습니다. 선수의 사기가 회복되고 긍정적인 정서적 자극을 받았습니다.`;
      if (Math.random() > 0.7) {
        formChange = true;
      }
    } else if (talkType === 'CRITICIZE') {
      if (player.mental > 85) {
        moraleChange = -3;
        message = `감독님이 기복을 보이는 [${player.summonerName}] 선수를 무섭게 질책하였습니다. 강한 정신력을 소유한 해당 선수는 반성하며 집중력을 가다듬었습니다! (일시적 컨디션 및 폼 개선 효과)`;
        formChange = true;
      } else {
        moraleChange = -15 + mentalBonus;
        message = `감독님이 [${player.summonerName}] 선수의 최근 슬럼프를 강한 톤으로 비판하였습니다. 리가 다소 소심하던 선수는 심리적 타격을 받고 사기가 급락하고 말았습니다.`;
      }
    } else if (talkType === 'PROMISE_PLAYTIME') {
      moraleChange = 15 + mentalBonus;
      message = `감독님이 [${player.summonerName}] 선수에게 다가오는 정규 시즌에서 주전 자리를 적극 보장해 줄 것임을 엄하게 약속했습니다. 선수가 구단의 기대감을 느끼고 사기가 치솟았습니다!`;
    }

    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        const nextMorale = Math.min(100, Math.max(1, p.morale + moraleChange));
        const nextForm = formChange ? 'UP' : p.form;
        return {
          ...p,
          morale: nextMorale,
          form: nextForm
        };
      }
      return p;
    });

    set({ players: updatedPlayers });
    return { message, moraleChange, formChange };
  }
});
