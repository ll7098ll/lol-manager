import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { Standing, Match, Player, Email } from '../../types';
import { ALL_TEAMS, generateLckSchedule } from '../storeUtils';
import { formatCurrency } from '../../utils/format';

const autoFillTeamRoster = (players: Player[], teamId: string): Player[] => {
  if (teamId === 'FA') return players;
  
  let updatedPlayers = [...players];
  const teamPlayers = updatedPlayers.filter(p => p.teamId === teamId);
  
  if (teamPlayers.length >= 5) return updatedPlayers;
  
  const neededCount = 5 - teamPlayers.length;
  const positions: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  
  // Find which roles are missing in the team
  const missingRoles = positions.filter(role => !updatedPlayers.some(p => p.teamId === teamId && p.role === role));
  
  for (let i = 0; i < neededCount; i++) {
    const roleToFill = missingRoles[i] || positions[i % 5];
    
    // 1. Try to find a Free Agent with the same role
    let faIdx = updatedPlayers.findIndex(p => p.teamId === 'FA' && p.role === roleToFill);
    
    // 2. If not found, try to find any Free Agent
    if (faIdx === -1) {
      faIdx = updatedPlayers.findIndex(p => p.teamId === 'FA');
    }
    
    if (faIdx !== -1) {
      updatedPlayers[faIdx] = {
        ...updatedPlayers[faIdx],
        teamId: teamId,
        contractYears: 1,
        condition: 100
      };
    } else {
      const names = ['김철수', '이영희', '박민수', '최성진', '정하늘', '조재현'];
      const summNames = ['Substitute', 'Rookie', 'Shadow', 'Ghost', 'Nova'];
      const newPlayer: Player = {
        id: `auto_fill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: names[Math.floor(Math.random() * names.length)],
        summonerName: `${summNames[Math.floor(Math.random() * summNames.length)]}_${Math.floor(Math.random() * 90 + 10)}`,
        role: roleToFill,
        teamId: teamId,
        age: 19,
        contractYears: 1,
        salary: 15000,
        lanePhase: 65 + Math.floor(Math.random() * 15),
        mechanics: 65 + Math.floor(Math.random() * 15),
        macro: 65 + Math.floor(Math.random() * 15),
        teamfight: 65 + Math.floor(Math.random() * 15),
        shotcalling: 55 + Math.floor(Math.random() * 15),
        mental: 65 + Math.floor(Math.random() * 15),
        consistency: 60 + Math.floor(Math.random() * 15),
        championPool: { azir: 5, leesin: 5, ksante: 5 },
        condition: 100,
        form: 'NORMAL',
        morale: 80,
        potential: 80,
        playstylePreference: 'BALANCED',
        energy: 100
      };
      updatedPlayers.push(newPlayer);
    }
  }
  
  return updatedPlayers;
};

export const createFinanceSlice: StateCreator<
  GameStore,
  [],
  [],
  Pick<
    GameStore,
    | 'buyPlayer'
    | 'sellPlayer'
    | 'updateStartingLineup'
    | 'renewContract'
    | 'negotiateContractSuccess'
    | 'startNextSeason'
    | 'setPlayerPlaystyle'
    | 'hireAcademyRookie'
    | 'tradePlayers'
  >
> = (set, get) => ({
  buyPlayer: (playerId) => {
    const { players, teams, playerTeamId } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: '선수를 찾을 수 없습니다.' };
    
    if (player.teamId === playerTeamId) {
      return { success: false, message: '이미 소속되어 있는 선수입니다.' };
    }

    const myTeam = teams.find(t => t.id === playerTeamId);
    if (!myTeam) return { success: false, message: '소속 팀 정보를 찾을 수 없습니다.' };

    const currentSalariesSum = players.filter(p => p.teamId === playerTeamId).reduce((sum, p) => sum + p.salary, 0);
    const SALARY_CAP = 450000;
    if (currentSalariesSum + player.salary > SALARY_CAP) {
      return { 
        success: false, 
        message: `연봉 상한선(샐러리 캡, 45억 원)을 초과할 수 없습니다. (현재 총 연봉: ${(currentSalariesSum / 10000).toFixed(2)}억 원, 추가할 선수 연봉: ${(player.salary / 10000).toFixed(2)}억 원, 합계: ${((currentSalariesSum + player.salary) / 10000).toFixed(2)}억 원)` 
      };
    }

    const isFreeAgent = player.teamId === 'FA';
    const buyoutFee = isFreeAgent ? Math.floor(player.salary * 0.5) : Math.floor(player.salary * 1.5);

    if (myTeam.budget < buyoutFee) {
      return { success: false, message: `예산이 부족합니다. (필요 예산: ${formatCurrency(buyoutFee)}, 보유 예산: ${formatCurrency(myTeam.budget)})` };
    }

    const sellingTeamId = player.teamId;
    const newTeams = teams.map(t => {
      if (t.id === playerTeamId) {
        return { ...t, budget: t.budget - buyoutFee };
      }
      if (sellingTeamId !== 'FA' && t.id === sellingTeamId) {
        return { ...t, budget: t.budget + buyoutFee };
      }
      return t;
    });

    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          teamId: playerTeamId!,
          contractYears: p.contractYears === 0 ? 1 : p.contractYears,
          condition: 100
        };
      }
      return p;
    });

    const finalPlayers = autoFillTeamRoster(newPlayers, sellingTeamId);

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
    const buyerTeamName = myTeam.name;
    const sellerTeamName = sellingTeamId === 'FA' ? '자유계약 신분' : (teams.find(t => t.id === sellingTeamId)?.name || '기존 구단');
    const newsEmail: Email = {
      id: `buy_${Date.now()}`,
      sender: 'LCK 공식 협회',
      title: `[이적 오피셜] ${player.summonerName} 선수, ${buyerTeamName} 합류 완료!`,
      content: `최종 이적 합의 완료! ${sellerTeamName}에서 활약하던 [${player.summonerName}] 선수가 이적 보상액/체결비 ${formatCurrency(buyoutFee)}을 투지하며 ${buyerTeamName} 구단에 공식 입단하였습니다. 영입된 선수는 즉시 로스터 벤치에 합류하였으며 라인업 조정 탭에서 선발 슬롯에 배치시킬 수 있습니다.`,
      date: textDate,
      read: false,
      type: 'NEWS'
    };

    set({
      teams: newTeams,
      players: finalPlayers,
      emails: [newsEmail, ...get().emails]
    });

    return { success: true, message: `${player.summonerName} 선수를 영입하였습니다!` };
  },

  sellPlayer: (playerId) => {
    const { players, teams, playerTeamId, startingLineup } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: '선수를 찾을 수 없습니다.' };

    if (player.teamId !== playerTeamId) {
      return { success: false, message: '우리 구단 소속 선수만 판매할 수 있습니다.' };
    }

    const isInStartingLineup = Object.values(startingLineup).includes(playerId);
    if (isInStartingLineup) {
      return { success: false, message: '주전 라인업에 배치된 선수는 방출할 수 없습니다. 벤치 멤버로 설정한 후 판매해 주세요.' };
    }

    const myTeam = teams.find(t => t.id === playerTeamId);
    if (!myTeam) return { success: false, message: '구단 정보를 찾을 수 없습니다.' };

    const refundFee = Math.floor(player.salary * 1.0);

    const newTeams = teams.map(t => {
      if (t.id === playerTeamId) {
        return { ...t, budget: t.budget + refundFee };
      }
      return t;
    });

    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          teamId: 'FA',
          contractYears: 0,
          condition: 100
        };
      }
      return p;
    });

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
    const newsEmail: Email = {
      id: `sell_news_${Date.now()}`,
      sender: 'LCK 데일리 뉴스',
      title: `[오피셜] ${player.summonerName} 선수 계약 해지 및 FA 전환`,
      content: `${myTeam.name} 구단은 금일 [${player.summonerName}] 선수와의 원만한 상호 합의에 따라 잔여 계약 내용을 중도 청산하고 FA 신분으로 공시하였습니다. 보상 정산금으로 구단 예산 +${formatCurrency(refundFee)}이 환부 이관되었습니다.`,
      date: textDate,
      read: false,
      type: 'NEWS'
    };

    set({
      teams: newTeams,
      players: newPlayers,
      emails: [newsEmail, ...get().emails]
    });

    return { success: true, message: `${player.summonerName} 선수를 계약 상호 해지하여 FA로 지정했습니다.` };
  },

  updateStartingLineup: (role, playerId) => {
    const { players, playerTeamId, startingLineup } = get();
    const p = players.find(player => player.id === playerId && player.teamId === playerTeamId);
    if (!p) return;

    const newLineup = { ...startingLineup };

    const positions: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
    positions.forEach(pos => {
      if (newLineup[pos] === playerId) {
        newLineup[pos] = '';
      }
    });

    newLineup[role] = playerId;

    set({ startingLineup: newLineup });
  },

  renewContract: (playerId, years) => {
    const { players, teams, playerTeamId } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const myTeam = teams.find(t => t.id === playerTeamId);
    if (!myTeam) return;

    const signatureBonus = Math.floor(player.salary * 0.15 * years);

    const newTeams = teams.map(t => {
      if (t.id === playerTeamId) {
        return { ...t, budget: Math.max(0, t.budget - signatureBonus) };
      }
      return t;
    });

    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          contractYears: p.contractYears + years
        };
      }
      return p;
    });

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
    const newsEmail: Email = {
      id: `renew_${Date.now()}`,
      sender: '구단 프런트',
      title: `[계약 갱신] ${player.summonerName} 선수와 연장 계약 체결!`,
      content: `팬들이 염원하던 재계약 성사! 감독님의 전략적 영단에 힘입어 구단은 프랜차이즈 간판 스타인 [${player.summonerName}] 선수와 ${years}년 연장 계약안에 최종 조인 서명하였습니다. 구단 서명 체결 보너스로 예산 ${formatCurrency(signatureBonus)}이 차감 지급되었습니다.`,
      date: textDate,
      read: false,
      type: 'NEWS'
    };

    set({
      teams: newTeams,
      players: newPlayers,
      emails: [newsEmail, ...get().emails]
    });
  },

  negotiateContractSuccess: (playerId, years, salary, signingBonus, isRenewal) => {
    const { players, teams, playerTeamId } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: '선수를 찾을 수 없습니다.' };

    const myTeam = teams.find(t => t.id === playerTeamId);
    if (!myTeam) return { success: false, message: '구단 정보를 찾을 수 없습니다.' };

    const isFreeAgent = player.teamId === 'FA';
    const buyoutFee = (isRenewal || isFreeAgent) ? 0 : Math.floor(player.salary * 1.5);
    const totalUpfrontCost = signingBonus + buyoutFee;

    if (myTeam.budget < totalUpfrontCost) {
      return { 
        success: false, 
        message: `구단 예산이 부족합니다. (필요 금액: ${formatCurrency(totalUpfrontCost)}, 현재 보유 예산: ${formatCurrency(myTeam.budget)})` 
      };
    }

    const sellingTeamId = player.teamId;
    const newTeams = teams.map(t => {
      if (t.id === playerTeamId) {
        return { ...t, budget: t.budget - totalUpfrontCost };
      }
      if (!isRenewal && !isFreeAgent && t.id === sellingTeamId) {
        return { ...t, budget: t.budget + buyoutFee };
      }
      return t;
    });

    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          teamId: playerTeamId!,
          contractYears: years,
          salary: salary,
          condition: 100,
          form: 'NORMAL' as const
        };
      }
      return p;
    });

    const finalPlayers = autoFillTeamRoster(newPlayers, sellingTeamId);

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
    const newsTitle = isRenewal 
      ? `[계약 갱신 성공] ${player.summonerName} 선수가 다년 재계약서에 서명했습니다!`
      : `[계약 타결 오피셜] ${player.summonerName} 선수, 치열한 협상 끝에 전격 입단!`;

    const newsContent = isRenewal
      ? `길었던 연봉 및 체결 보존금 밀당 끝에 드디어 도장을 찍었습니다! [${player.summonerName}] 선수가 연봉 ${formatCurrency(salary)}, 계약 기간 ${years}년 조건으로 구단과의 동행을 연장하기로 합의했습니다. 즉시 계약 수당 및 사이닝 보너스로 ${formatCurrency(signingBonus)}이 지급 차감되었습니다.`
      : `이적성사의 감격! 자유 시장 최고의 화두 중 하나였던 [${player.summonerName}] 선수가 여러 경쟁 구단을 물리치고 결국 우리 팀 입단을 수락했습니다. 연봉 ${formatCurrency(salary)}, 계약 기간 ${years}년 조건이며, 계약금 ${formatCurrency(signingBonus)} 및 기존 소속팀 이적 보상금 ${formatCurrency(buyoutFee)}이 정식 차감 지급되었습니다.`;

    const newsEmail: Email = {
      id: `negotiate_success_${Date.now()}`,
      sender: isRenewal ? '구단 프런트' : 'LCK 이적 대행국',
      title: newsTitle,
      content: newsContent,
      date: textDate,
      read: false,
      type: 'NEWS'
    };

    set({
      teams: newTeams,
      players: finalPlayers,
      emails: [newsEmail, ...get().emails]
    });

    return { 
      success: true, 
      message: `${player.summonerName} 선수와 연봉 ${formatCurrency(salary)}, ${years}년 계약 체결 완수!` 
    };
  },

  startNextSeason: () => {
    const { season, teams, players, playerTeamId } = get();
    const nextSeason = season + 1;

    const standings: Standing[] = teams.map(team => ({
      teamId: team.id,
      wins: 0,
      losses: 0,
      gameDiff: 0
    }));

    const schedule: Match[] = generateLckSchedule(teams).map((m, idx) => ({
      ...m,
      id: `season_${nextSeason}_match_${idx + 1}`,
      played: false,
      winnerId: undefined,
      score: undefined,
      log: undefined,
      goldDiffHistory: undefined,
      killHistory: undefined,
      pogPlayerId: undefined,
      matchType: 'SPRING_REGULAR'
    }));

    const retiredPlayerEmails: Email[] = [];
    const currentYear = get().currentDate.getFullYear();
    const textDate = `${currentYear}년 12월 31일`;

    const updatedPlayers: Player[] = [];

    players.forEach(p => {
      if (p.age >= 32 && Math.random() < 0.60) {
        if (p.teamId === playerTeamId) {
          retiredPlayerEmails.push({
            id: `retire_${p.id}_${Date.now()}`,
            sender: `${p.summonerName} (${p.name})`,
            title: `[은퇴 알림] ${p.summonerName} 선수의 감사 편지`,
            content: `감독님, 안녕하십니까. 오랜 고심 끝에 이번 시즌을 마지막으로 마우스를 내려놓고 프로 게이머 은퇴를 결정하였습니다. 그동안 구단에서 감독님의 든든한 전략적 가호 아래 뛰었던 나날들은 제 인생 최고의 영광이었습니다. 저의 2막을 응원해주시길 바라며, 팀의 영원한 승리를 응원하겠습니다. 감사했습니다!`,
            date: textDate,
            read: false,
            type: 'NEWS'
          });
        }
        return;
      }

      let nextLanePhase = p.lanePhase;
      let nextMechanics = p.mechanics;
      let nextMacro = p.macro;
      let nextTeamfight = p.teamfight;
      let nextShotcalling = p.shotcalling;
      let nextMental = p.mental;

      if (p.age >= 29) {
        let decline = 1;
        if (p.age >= 32) {
          decline = 3 + Math.floor(Math.random() * 3);
        } else if (p.age >= 30) {
          decline = 2 + Math.floor(Math.random() * 2);
        } else {
          decline = 1 + Math.floor(Math.random() * 2);
        }

        nextLanePhase = Math.max(50, p.lanePhase - decline);
        nextMechanics = Math.max(50, p.mechanics - decline);
        nextMacro = Math.max(50, p.macro - Math.max(1, decline - 1));
        nextTeamfight = Math.max(50, p.teamfight - decline);
        nextShotcalling = Math.max(50, p.shotcalling - Math.max(0, decline - 2));
        nextMental = Math.max(50, p.mental);
      }

      const nextContractYears = Math.max(0, p.contractYears - 1);
      const isFA = nextContractYears === 0;
      let nextTeamId = p.teamId;
      if (isFA) {
        nextTeamId = 'FA';
      }

      updatedPlayers.push({
        ...p,
        age: p.age + 1,
        contractYears: nextContractYears,
        teamId: nextTeamId,
        lanePhase: nextLanePhase,
        mechanics: nextMechanics,
        macro: nextMacro,
        teamfight: nextTeamfight,
        shotcalling: nextShotcalling,
        mental: nextMental,
        condition: 100,
        form: 'NORMAL' as const
      });
    });

    const finalStartingLineup = { ...get().startingLineup };
    const validPlayerIdsOnMyTeam = updatedPlayers
      .filter(p => p.teamId === playerTeamId)
      .map(p => p.id);

    (Object.keys(finalStartingLineup) as Array<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'>).forEach(role => {
      const pId = finalStartingLineup[role];
      if (!pId || !validPlayerIdsOnMyTeam.includes(pId)) {
        const backup = updatedPlayers.find(p => p.teamId === playerTeamId && p.role === role);
        finalStartingLineup[role] = backup ? backup.id : '';
      }
    });

    const names = ['조민수', '한정엽', '김한결', '신동주', '최서준', '박진형'];
    const summNames = ['Slayer', 'Genesis', 'Reboot', 'Bullet', 'Challenger', 'Ace'];
    const positions: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

    const rookies: Player[] = [0, 1, 2].map((_, idx) => {
      const pIdx = Math.floor(Math.random() * positions.length);
      const role = positions[pIdx];
      const summName = `${summNames[Math.floor(Math.random() * summNames.length)]}_${Math.floor(Math.random()*89 + 10)}`;
      return {
        id: `rookie_${Date.now()}_${idx}`,
        name: names[Math.floor(Math.random() * names.length)],
        summonerName: summName,
        role: role,
        teamId: 'FA',
        age: 18,
        contractYears: 2,
        salary: Math.floor(18000 + Math.random() * 10000),
        lanePhase: Math.floor(72 + Math.random() * 10),
        mechanics: Math.floor(75 + Math.random() * 12),
        macro: Math.floor(66 + Math.random() * 12),
        teamfight: Math.floor(70 + Math.random() * 12),
        shotcalling: Math.floor(55 + Math.random() * 12),
        mental: Math.floor(65 + Math.random() * 15),
        consistency: Math.floor(60 + Math.random() * 15),
        championPool: { azir: 5, leesin: 5, ksante: 5 },
        condition: 100,
        form: 'NORMAL'
      };
    });

    const nextYearTextDate = `${2026 + nextSeason - 1}년 1월 1일`;
    const welcomeMail: Email = {
      id: `welcome_season_${nextSeason}`,
      sender: 'LCK 사무국',
      title: `[LCK] LCK 시즌 ${nextSeason} 정식 개막!`,
      content: `감독님! 대망의 LCK 시즌 ${nextSeason} 정규 리그 개막을 환영합니다. 비시즌 스토브리그 기간 및 드래프트 관리 성과를 바탕으로 탄탄한 선발 명단을 갖추었기를 희망합니다. 기재된 일정에 따라 영광스런 시즌 챔피언 트로피 도전을 지속해 주십시오!`,
      date: nextYearTextDate,
      read: false,
      type: 'CONGRATS'
    };

    set({
      season: nextSeason,
      standings,
      schedule,
      seasonPhase: 'SPRING_REGULAR',
      players: [...updatedPlayers, ...rookies],
      emails: [welcomeMail, ...retiredPlayerEmails, ...get().emails],
      currentDate: new Date(2025 + nextSeason, 0, 1),
      currentWeek: 1,
      startingLineup: finalStartingLineup,
      gameState: 'OFFICE'
    });
  },

  setPlayerPlaystyle: (playerId, playstyle) => {
    const { players } = get();
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        return { ...p, playstylePreference: playstyle };
      }
      return p;
    });
    set({ players: updatedPlayers });
  },

  hireAcademyRookie: (rookieId) => {
    const { academyRookies, players, teams, playerTeamId } = get();
    const rookie = academyRookies.find(r => r.id === rookieId);
    if (!rookie) return { success: false, message: '연습생을 찾을 수 없습니다.' };

    const myTeam = teams.find(t => t.id === playerTeamId);
    if (!myTeam) return { success: false, message: '소속팀 정보를 찾을 수 없습니다.' };

    const currentSalariesSum = players.filter(p => p.teamId === playerTeamId).reduce((sum, p) => sum + p.salary, 0);
    const SALARY_CAP = 450000;
    if (currentSalariesSum + rookie.salary > SALARY_CAP) {
      return { 
        success: false, 
        message: `연봉 상한선(샐러리 캡, 45억 원)을 초과하게 되어 연습생을 고용할 수 없습니다. (현재 총 연봉: ${(currentSalariesSum / 10000).toFixed(2)}억 원, 연습생 연봉: ${(rookie.salary / 10000).toFixed(2)}억 원)` 
      };
    }

    if (myTeam.budget < rookie.salary) {
      return { success: false, message: `구단 예산이 부족합니다. (선입금 계약금: ${rookie.salary}만원)` };
    }

    const updatedPlayers = [...players, { ...rookie, teamId: playerTeamId, contractYears: 1 }];
    const updatedAcademy = academyRookies.filter(r => r.id !== rookieId);
    const updatedTeams = teams.map(t => {
      if (t.id === playerTeamId) {
        return { ...t, budget: Math.max(0, t.budget - rookie.salary) };
      }
      return t;
    });

    set({
      players: updatedPlayers,
      academyRookies: updatedAcademy,
      teams: updatedTeams
    });

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
    const congratsMail: Email = {
      id: `acc_hire_${Date.now()}`,
      sender: '유스 아카데미',
      title: `[아카데미] 특급 유망주 ${rookie.summonerName} 정식 영입 완료!`,
      content: `감독님! 당사 아카데미에 가입된 특급 하이퍼 루키 [${rookie.summonerName}] 선수를 1군에 유스 연습생 자격으로 긴급 콜업 체결하였습니다. 이 선수의 기량 한계점(Potential)은 무려 ${rookie.potential}에 달해 집중 연마 및 전술 훈련을 거치면 전설의 프로게이머가 될 수 있습니다.`,
      date: textDate,
      read: false,
      type: 'CONGRATS'
    };

    set({ emails: [congratsMail, ...get().emails] });

    return { success: true, message: `[${rookie.summonerName}] 연습생을 영입하여 1군 아카데미 전력으로 등록했습니다!` };
  },

  tradePlayers: (myPlayerId, opponentPlayerId) => {
    const { players, teams, playerTeamId, startingLineup } = get();
    const myPlayer = players.find(p => p.id === myPlayerId && p.teamId === playerTeamId);
    const oppPlayer = players.find(p => p.id === opponentPlayerId);

    if (!myPlayer || !oppPlayer) {
      return { success: false, message: '선수를 찾을 수 없습니다.' };
    }

    if (oppPlayer.teamId === playerTeamId) {
      return { success: false, message: '이미 소속되어 있는 선수입니다.' };
    }

    if (myPlayer.role !== oppPlayer.role) {
      return { success: false, message: '서로 다른 포지션의 선수는 1:1 트레이드할 수 없습니다.' };
    }

    const isStarting = Object.values(startingLineup).includes(myPlayerId);

    const getOvr = (p: Player) => Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight) / 4);
    
    const myOvr = getOvr(myPlayer);
    const oppOvr = getOvr(oppPlayer);
    
    const myPotential = myPlayer.potential || 80;
    const oppPotential = oppPlayer.potential || 80;

    const myValue = myOvr * 1.0 + myPotential * 0.2 + (30 - myPlayer.age) * 1.5;
    const oppValue = oppOvr * 1.0 + oppPotential * 0.2 + (30 - oppPlayer.age) * 1.5;

    if (myValue < oppValue * 0.95) {
      const diff = Math.round(oppValue - myValue);
      return { 
        success: false, 
        message: `상대 구단이 제안을 거절했습니다.\n(제안 가치 부족. 가치 격차: ${diff > 0 ? diff : 0}점)\nAI 피드백: "우리는 더 높은 기량이나 미래 가치를 지닌 선수를 원합니다."` 
      };
    }

    const sellingTeamId = oppPlayer.teamId;

    const newPlayers = players.map(p => {
      if (p.id === myPlayerId) {
        return {
          ...p,
          teamId: sellingTeamId,
          contractYears: Math.max(1, p.contractYears),
          condition: 100
        };
      }
      if (p.id === opponentPlayerId) {
        return {
          ...p,
          teamId: playerTeamId!,
          contractYears: Math.max(1, p.contractYears),
          condition: 100
        };
      }
      return p;
    });

    let finalPlayers = autoFillTeamRoster(newPlayers, sellingTeamId);
    finalPlayers = autoFillTeamRoster(finalPlayers, playerTeamId!);

    const newLineup = { ...startingLineup };
    if (isStarting) {
      const assignedRole = (Object.keys(startingLineup) as Array<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'>).find(
        key => startingLineup[key] === myPlayerId
      );
      if (assignedRole) {
        newLineup[assignedRole] = opponentPlayerId;
      }
    }

    const textDate = `${get().currentDate.getFullYear()}년 ${get().currentDate.getMonth() + 1}월 ${get().currentDate.getDate()}일`;
    const oppTeamName = sellingTeamId === 'FA' ? '자유계약 신분' : (teams.find(t => t.id === sellingTeamId)?.name || '기존 구단');
    const myTeamName = teams.find(t => t.id === playerTeamId)?.name || '우리 구단';

    const newsEmail: Email = {
      id: `trade_${Date.now()}`,
      sender: 'LCK 공식 협회',
      title: `[트레이드 오피셜] ${myTeamName} - ${oppTeamName}, 1:1 트레이드 성사!`,
      content: `충격적인 트레이드 단행! ${myTeamName} 구단과 ${oppTeamName} 구단이 [${myPlayer.summonerName}] 선수와 [${oppPlayer.summonerName}] 선수의 1:1 이적 트레이드안에 정식 합의했습니다. 양 선수는 즉시 소속팀을 교환하였으며, 주전 라인업에 있던 선수는 교환된 신임 선수가 즉시 선발 슬롯을 승계하게 됩니다.`,
      date: textDate,
      read: false,
      type: 'NEWS'
    };

    set({
      players: finalPlayers,
      startingLineup: newLineup,
      emails: [newsEmail, ...get().emails]
    });

    return { 
      success: true, 
      message: `${myPlayer.summonerName} 선수와 ${oppPlayer.summonerName} 선수의 1:1 트레이드가 성사되었습니다!` 
    };
  }
});
