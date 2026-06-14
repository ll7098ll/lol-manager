import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { Match, Player, Email } from '../../types';
import { buildAIRosterMap } from '../storeUtils';
import { simulateLoLMatch, simulateLoLSeries, generateAITactics } from '../../utils/matchEngine';
import { formatCurrency } from '../../utils/format';

export const createTrainingSlice: StateCreator<
  GameStore,
  [],
  [],
  Pick<
    GameStore,
    | 'proceedToNextDay'
    | 'skipToMatchDay'
    | 'trainRole'
    | 'restRoster'
    | 'trainPlayerIndividual'
    | 'setPlayerTrainingFocus'
    | 'allocateTrainingPoints'
  >
> = (set, get) => ({
  skipToMatchDay: () => {
    let loops = 0;
    while (loops < 14) {
      if (get().activeMatch) {
        break;
      }
      
      const prevPhase = get().seasonPhase;
      get().proceedToNextDay();
      
      const nextMatchState = get().activeMatch;
      const newPhase = get().seasonPhase;
      
      if (nextMatchState) {
        break;
      }
      if (newPhase !== prevPhase) {
        break;
      }
      const newDate = get().currentDate;
      if (newDate.getDay() === 6) {
        // Stop at Saturday (Match/Moutpiece Day)
        break;
      }
      loops++;
    }
  },

  proceedToNextDay: () => {
    const { currentDate, currentWeek, schedule, playerTeamId, players, teams, seasonPhase, playoffsMatches, msiMatches, worldsMatches } = get();
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const textDate = `${nextDate.getFullYear()}년 ${nextDate.getMonth() + 1}월 ${nextDate.getDate()}일`;
    const nextEmails = [...get().emails];
    const newPlayers = players.map(p => ({ ...p }));
    
    // Every day condition and morale fluctuations (similar to FM morale/mental management)
    const mentalCoachId = get().activeStaff.MENTAL_COACH;
    const mentalCoach = get().coachingStaff.find(s => s.id === mentalCoachId);
    const decayReduction = mentalCoach ? parseFloat((mentalCoach.mentalSkill / 35).toFixed(1)) : 0; // up to 2.5 reduction

    newPlayers.forEach(p => {
      // condition
      p.condition = Math.min(120, Math.max(80, p.condition + Math.floor((Math.random() - 0.5) * 8)));
      
      // energy recovery (daily passive rest)
      const currentEnergy = p.energy !== undefined ? p.energy : 100;
      p.energy = Math.min(100, currentEnergy + 8);
      
      // morale (only applies to player's team)
      if (p.teamId === playerTeamId) {
        const isStarter = Object.values(get().startingLineup).includes(p.id);
        if (isStarter) {
          // Starters recover morale slowly but steadily
          p.morale = Math.min(100, p.morale + 1 + (mentalCoach ? 1 : 0));
        } else {
          // Benched players lose morale (FM benched unhappiness)
          const baseDecay = 2.0;
          const decay = Math.max(0.3, baseDecay - decayReduction);
          p.morale = Math.min(100, Math.max(15, parseFloat((p.morale - decay).toFixed(1))));
        }

        // --- OVER-TIME TRAINING FOCUS PROGRESSION ---
        const focus = p.trainingFocus || 'BALANCED';
        let progressAmount = 2 + Math.floor(Math.random() * 2); // base 2-3% progress per day

        // Head coach training skill coefficient
        const headCoachId = get().activeStaff.HEAD_COACH;
        const headCoach = get().coachingStaff.find(s => s.id === headCoachId);
        if (headCoach) {
          progressAmount += Math.floor(headCoach.trainingSkill / 25); // +1 to +3 additional daily progress
        }

        // Stats difficulty capping factor: higher stats level down progress speed
        const pCurrentOvr = Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight) / 4);
        const limit = p.potential || 99;
        if (pCurrentOvr >= limit) {
          progressAmount = Math.max(1, Math.floor(progressAmount * 0.22));
        } else if (pCurrentOvr > 85) {
          progressAmount = Math.max(2, Math.floor(progressAmount * 0.55));
        }

        const currentProg = p.trainingProgress !== undefined ? p.trainingProgress : 0;
        const nextProg = currentProg + progressAmount;

        if (nextProg >= 100) {
          p.trainingProgress = 0;
          let statToUpgrade = '';
          const maxVal = p.potential || 99;

          if (focus === 'LANING') {
            if (p.lanePhase < maxVal) { p.lanePhase++; statToUpgrade = 'Laning (라인전)'; }
          } else if (focus === 'MECHANICS') {
            if (p.mechanics < maxVal) { p.mechanics++; statToUpgrade = 'Mechanics (피지컬)'; }
          } else if (focus === 'MACRO') {
            if (p.macro < maxVal) { p.macro++; statToUpgrade = 'Macro (운영지표)'; }
          } else if (focus === 'TEAMFIGHT') {
            if (p.teamfight < maxVal) { p.teamfight++; statToUpgrade = 'Teamfight (교전력)'; }
          } else if (focus === 'VISION') {
            if (p.macro < maxVal) { p.macro++; statToUpgrade = 'Macro (시야·운영)'; }
            if (p.shotcalling < maxVal && Math.random() < 0.5) p.shotcalling++;
          } else if (focus === 'MENTAL') {
            if (p.mental < maxVal) { p.mental++; statToUpgrade = 'Mental (멘탈케어)'; }
          } else if (focus === 'BALANCED') {
            const stats: ('lanePhase' | 'mechanics' | 'macro' | 'teamfight' | 'mental')[] = ['lanePhase', 'mechanics', 'macro', 'teamfight', 'mental'];
            const improvable = stats.filter(s => p[s] < maxVal);
            if (improvable.length > 0) {
              const selectedS = improvable[Math.floor(Math.random() * improvable.length)];
              p[selectedS]++;
              const statLabelMap = {
                lanePhase: 'Laning (라인전)',
                mechanics: 'Mechanics (피지컬)',
                macro: 'Macro (운영)',
                teamfight: 'Teamfight (교전력)',
                mental: 'Mental (멘탈)'
              };
              statToUpgrade = statLabelMap[selectedS];
            }
          }

          if (statToUpgrade) {
            nextEmails.push({
              id: `email_training_lvlup_${p.id}_${nextDate.getTime()}`,
              sender: '코치진 대내통보',
              title: `[훈련 완수] ${p.summonerName} 선수 전문 분야 특훈 돌파!`,
              content: `감독님! 구단 훈련장에 기쁜 소식입니다.\n\n[${focus}] 분야에서 집중 트렌드 훈련을 이행 중이던 **${p.summonerName} (${p.name})** 선수가 각고의 노력 끝에 드디어 임계점을 돌파하였습니다.\n\n그 결과, 해당 선수의 **${statToUpgrade} 능력치**가 **1**만큼 영구 상승하였습니다!\n\n현재 이 선수의 능력치는 구단 트레이닝 지표에 반영 완료되었습니다. 지속적인 전문 특훈 성장을 기대합니다!`,
              date: textDate,
              read: false,
              type: 'CONGRATS'
            });
          }
        } else {
          p.trainingProgress = nextProg;
        }
      }
    });

    const isRegularSeason = seasonPhase === 'SPRING_REGULAR' || seasonPhase === 'SUMMER_REGULAR';
    let activatedMatch: Match | null = null;

    let nextPo = [...playoffsMatches];
    let nextMsi = [...msiMatches];
    let nextWorlds = [...worldsMatches];

    if (isRegularSeason) {
      // Check if next day is a Saturday (Saturday is day index 6)
      const isSaturday = nextDate.getDay() === 6;

      if (isSaturday) {
        // Find matches for the current week
        const currentWeekMatches = schedule.filter(m => m.week === currentWeek && !m.played);
        const playerMatch = currentWeekMatches.find(m => m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId);

        if (playerMatch) {
          activatedMatch = playerMatch;
          nextEmails.push({
            id: `email_sat_${nextDate.getTime()}`,
            sender: '코치진',
            title: `[매치 데이] 금일 경기 일정이 배치되었습니다!`,
            content: `감독님! 오늘은 대망의 LCK e스포츠 정규시즌 격전일입니다. 우측 대시보드에서 선수들의 스탯 및 컨디션을 최종 점검하시고 하단의 '밴픽 시작' 버튼을 눌러 승리를 쟁취해 주십시오!`,
            date: textDate,
            read: false,
            type: 'SYSTEM'
          });
        } else {
          // Player's team rests this week. Auto-simulate other matches instantly for this round!
          nextEmails.push({
            id: `email_sat_rest_${nextDate.getTime()}`,
            sender: 'e스포츠 협회',
            title: `[주간 휴식] 귀사는 이번 라운드에 매치가 없습니다.`,
            content: `금주는 경기 일정 없이 휴식주를 갖습니다. 다른 구단들의 경기는 자동으로 시뮬레이션되어 리그 랭킹 정보에 갱신됩니다. '일정 진행' 버튼을 누르면 다른 매치들이 가상 진행됩니다.`,
            date: textDate,
            read: false,
            type: 'SYSTEM'
          });
        }
      }
    } else if (seasonPhase !== 'STOVE_LEAGUE') {
      // BRACKET TOURNAMENT PROGRESSION ON-THE-FLY
      let currentMatches: Match[] = [];
      if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
        currentMatches = playoffsMatches;
      } else if (seasonPhase === 'MSI') {
        currentMatches = msiMatches;
      } else if (seasonPhase === 'WORLDS') {
        currentMatches = worldsMatches;
      }

      // Find first unplayed match
      const nextUnplayed = currentMatches.find(m => !m.played);
      if (nextUnplayed) {
        const isPlayerMatch = nextUnplayed.homeTeamId === playerTeamId || nextUnplayed.awayTeamId === playerTeamId;
        if (isPlayerMatch) {
          activatedMatch = nextUnplayed;
          nextEmails.push({
            id: `email_bracket_${nextDate.getTime()}`,
            sender: 'LCK 사무국',
            title: `[토너먼트 매치데이] 단판 데스매치가 오늘 펼쳐집니다!`,
            content: `경고! 오늘 소속 구단이 대망의 관문 토너먼트 매치에 돌입합니다. 무대는 전 세계 팬들이 실시간 지켜보고 있으니 정예 라인업 스탯을 영구 보정해주시고 준비 후 '밴픽'에 진입해주시길 바랍니다.`,
            date: textDate,
            read: false,
            type: 'SYSTEM'
          });
        } else {
          // AI vs AI on-the-fly simulation!
          const homeT = teams.find(t => t.id === nextUnplayed.homeTeamId)!;
          const awayT = teams.find(t => t.id === nextUnplayed.awayTeamId)!;

          const hPlayers = newPlayers.filter(p => p.teamId === nextUnplayed.homeTeamId);
          const aPlayers = newPlayers.filter(p => p.teamId === nextUnplayed.awayTeamId);
          const hRoster = buildAIRosterMap(nextUnplayed.homeTeamId, hPlayers, playerTeamId);
          const aRoster = buildAIRosterMap(nextUnplayed.awayTeamId, aPlayers, playerTeamId);
          const mType = nextUnplayed.matchType || seasonPhase;
          const mId = nextUnplayed.id;
          let boFormat: 'BO1' | 'BO3' | 'BO5' = 'BO1';

          if (nextUnplayed.boFormat) {
            boFormat = nextUnplayed.boFormat;
          } else if (mType === 'WORLDS') {
            if (mId.includes('worlds_qf') || mId.includes('worlds_sf') || mId === 'worlds_f') {
              boFormat = 'BO5';
            } else if (
              mId.startsWith('worlds_swiss_r3_m1') || mId.startsWith('worlds_swiss_r3_m2') ||
              mId.startsWith('worlds_swiss_r3_m7') || mId.startsWith('worlds_swiss_r3_m8') ||
              mId.startsWith('worlds_swiss_r4_') ||
              mId.startsWith('worlds_swiss_r5_')
            ) {
              boFormat = 'BO3';
            } else {
              boFormat = 'BO1';
            }
          } else if (mType === 'SPRING_PLAYOFFS' || mType === 'SUMMER_PLAYOFFS') {
            boFormat = 'BO5';
          } else if (mType === 'MSI') {
            if (mId === 'msi_f' || mId === 'msi_lbf' || mId === 'msi_ubf' || mId.startsWith('msi_ubsf') || mId.startsWith('msi_lbr2') || mId.startsWith('msi_lbr3')) {
              boFormat = 'BO5';
            } else {
              boFormat = 'BO3';
            }
          } else if (mType === 'SPRING_REGULAR' || mType === 'SUMMER_REGULAR') {
            boFormat = 'BO3';
          }

          const hTactics = generateAITactics(hRoster);
          const aTactics = generateAITactics(aRoster);
          
          let simResult;
          if (boFormat === 'BO1') {
            const matchRes = simulateLoLMatch(homeT, hRoster, awayT, aRoster, hTactics, aTactics);
            simResult = {
              winnerId: matchRes.winnerId,
              score: matchRes.winnerId === homeT.id ? { home: 1, away: 0 } : { home: 0, away: 1 },
              log: matchRes.log,
              goldDiffHistory: matchRes.goldDiffHistory,
              killHistory: matchRes.killHistory,
              pogPlayerId: matchRes.pogPlayerId,
              homeStats: matchRes.homeStats,
              awayStats: matchRes.awayStats
            };
          } else {
            simResult = simulateLoLSeries(
              homeT, hRoster, awayT, aRoster,
              hTactics, aTactics, 0, 0, false, false,
              boFormat === 'BO3'
            );
          }
          
          const updatedMatch: Match = {
            ...nextUnplayed,
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

          const pogPlayer = newPlayers.find(p => p.id === simResult.pogPlayerId);
          const winnerTeam = teams.find(t => t.id === simResult.winnerId)!;
          const loserTeam = teams.find(t => t.id === (simResult.winnerId === nextUnplayed.homeTeamId ? nextUnplayed.awayTeamId : nextUnplayed.homeTeamId))!;

          nextEmails.push({
            id: `email_sim_${nextDate.getTime()}`,
            sender: '뉴스 채널',
            title: `[토너먼트 결과] ${winnerTeam.name}, ${loserTeam.name}에 짜릿한 격승!`,
            content: `속보입니다. 오늘 펼쳐진 한 판 토너먼트 전쟁에서 ${winnerTeam.name}가 ${loserTeam.name}를 환상적인 대치 스노우볼로 격침시켰습니다! 영의 진두지휘 POG 플레이어로 선정된 선수는 [${pogPlayer?.summonerName || 'unknown'}] 입니다!`,
            date: textDate,
            read: false,
            type: 'NEWS'
          });

          if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
            nextPo = playoffsMatches.map(m => m.id === nextUnplayed.id ? updatedMatch : m);
          } else if (seasonPhase === 'MSI') {
            nextMsi = msiMatches.map(m => m.id === nextUnplayed.id ? updatedMatch : m);
          } else if (seasonPhase === 'WORLDS') {
            nextWorlds = worldsMatches.map(m => m.id === nextUnplayed.id ? updatedMatch : m);
          }
        }
      }
    }

    // Occasional scouting offers or random news emails (22% chance on weekdays)
    if (nextDate.getDay() !== 6 && Math.random() < 0.22 && isRegularSeason) {
      const luckyPlayer = newPlayers.find(p => p.teamId === playerTeamId);
      if (luckyPlayer) {
        const valueChange = Math.floor((Math.random() - 0.5) * 6);
        const statToGrow = (['lanePhase', 'mechanics', 'macro', 'teamfight'] as const)[Math.floor(Math.random() * 4)];
        luckyPlayer[statToGrow] = Math.min(99, Math.max(1, luckyPlayer[statToGrow] + valueChange));
        
        let mailTitle = '';
        let mailContent = '';
        if (valueChange > 0) {
          mailTitle = `[훈련 성공] ${luckyPlayer.summonerName} 선수의 기량 증가`;
          mailContent = `감독님! 코칭 스태프의 밀착 지원 하에 [${luckyPlayer.summonerName}] 선수가 개인 기량 교정 훈련에서 큰 한걸음을 내디뎠습니다. 챔피언 라인 운용 능력 및 세부 능력 스탯(${statToGrow})이 ${valueChange}포인트 만큼 특별 영구 성장하였습니다!`;
        } else {
          mailTitle = `[컨디션 저하] ${luckyPlayer.summonerName} 선수의 아쉬운 컨디션 유실`;
          mailContent = `감독님, 최근 이어진 야간 SNS 스트리밍 방송과 가벼운 수면 미달로 인해, [${luckyPlayer.summonerName}] 선수가 전반적인 컨디션 관리에 어려움을 호소하고 있습니다. 약간의 피로도가 상승했으며 스탯 기량이 잠시 기복을 겪고 있습니다.`;
        }

        nextEmails.push({
          id: `email_rnd_${nextDate.getTime()}`,
          sender: '수석 코치',
          title: mailTitle,
          content: mailContent,
          date: textDate,
          read: false,
          type: 'NEWS'
        });
      }
    }

    // Occasional Scouting offers from opposing teams (30% chance on Tuesday)
    if (nextDate.getDay() === 2 && Math.random() < 0.3 && isRegularSeason) {
      const otherTeams = teams.filter(t => t.id !== playerTeamId);
      const randomTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)];
      const teamPlayers = newPlayers.filter(p => p.teamId === playerTeamId);
      const trgPlayer = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];

      if (trgPlayer) {
        const offerAmount = trgPlayer.salary * 1.5;
        nextEmails.push({
          id: `email_offer_${nextDate.getTime()}`,
          sender: randomTeam.name,
          title: `[이적 제안] ${trgPlayer.summonerName} 선수 영입 타진 희망 건`,
          content: `${randomTeam.name} 구단 프런트입니다. 당사는 수십 번의 전력 분석 결과, 공석인 해당 라인 강화를 위해 감독님 소속인 [${trgPlayer.summonerName}] 선수의 영입에 지대한 관심을 품고 있습니다. 이적료 ${formatCurrency(offerAmount)}에 해당 선수의 완전 이적을 요청하오니, 긍정적인 검토 부탁드립니다.`,
          date: textDate,
          read: false,
          type: 'OFFER',
          offerDetails: {
            type: 'TRANSFER',
            playerId: trgPlayer.id,
            teamId: randomTeam.id,
            price: offerAmount
          }
        });
      }
    }

    set({
      currentDate: nextDate,
      emails: nextEmails,
      players: newPlayers,
      playoffsMatches: nextPo,
      msiMatches: nextMsi,
      worldsMatches: nextWorlds,
      activeMatch: activatedMatch,
      trainingPoints: Math.min(50, get().trainingPoints + 2),
      coachingActionsLeft: 2
    });

    if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
      get().updatePlayoffsBracketTree(nextPo);
    } else if (seasonPhase === 'MSI') {
      get().updateMsiBracketTree(nextMsi);
    } else if (seasonPhase === 'WORLDS') {
      get().updateWorldsBracketTree(nextWorlds);
    }

    // If Saturday, and player team is NOT playing today, auto-simulate ALL other games in background right away on Saturday tick!
    if (isRegularSeason && nextDate.getDay() === 6 && !activatedMatch) {
      get().autoDraftForOpponent(); 
    }
  },

  trainRole: (role, statType) => {
    const { players, playerTeamId } = get();
    const player = players.find(p => p.teamId === playerTeamId && p.role === role);
    if (!player) return;

    const newPlayers = players.map(p => {
      if (p.id === player.id) {
        const currentVal = p[statType];
        const currentEnergy = p.energy !== undefined ? p.energy : 100;
        return {
          ...p,
          [statType]: Math.min(99, currentVal + 1),
          condition: Math.max(80, p.condition - 5),
          energy: Math.max(0, currentEnergy - 8)
        };
      }
      return p;
    });

    set({ players: newPlayers });
  },

  restRoster: () => {
    const { players, playerTeamId } = get();
    const newPlayers = players.map(p => {
      if (p.teamId === playerTeamId) {
        return {
          ...p,
          condition: Math.min(120, p.condition + 15),
          form: (Math.random() > 0.7 ? 'UP' : p.form) as 'UP' | 'NORMAL' | 'DOWN',
          energy: 100
        };
      }
      return p;
    });

    set({ players: newPlayers });
    get().proceedToNextDay();
  },

  allocateTrainingPoints: (playerId, statType, points) => {
    const { players, playerTeamId, trainingPoints } = get();
    
    const player = players.find(p => p.id === playerId && p.teamId === playerTeamId);
    if (!player) {
      return { success: false, message: '소속 팀 선수를 찾을 수 없습니다.' };
    }

    const potentialLimit = player.potential || 99;
    if (player[statType] >= potentialLimit) {
      return { success: false, message: `선수의 타고난 잠재력 한계선(Potential: ${potentialLimit})에 도달하여 수동으로 능력치를 올릴 수 없습니다.` };
    }

    if (player[statType] >= 90) {
      return { success: false, message: '90이 넘는 초정밀 능력치는 훈련 포인트로 수동 즉시 상승할 수 없습니다. 오직 시간 가치의 오버타임 집중 특훈 코스(Daily Focus)로만 수양 가능합니다.' };
    }

    let requiredPoints = points;
    if (player[statType] >= 80) {
      requiredPoints = points * 3;
    }

    if (trainingPoints < requiredPoints) {
      if (player[statType] >= 80) {
        return { success: false, message: `80 이상의 노련한 능력치는 전술 훈련 포인트가 3 PT 소모됩니다. (현재 보유: ${trainingPoints} PT)` };
      }
      return { success: false, message: `훈련 포인트가 부족합니다. (현재 보유: ${trainingPoints} PT)` };
    }

    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          [statType]: Math.min(potentialLimit, p[statType] + points)
        };
      }
      return p;
    });

    set({ players: newPlayers, trainingPoints: trainingPoints - requiredPoints });
    
    return { success: true, message: `성공적으로 ${statType === 'lanePhase' ? '라인전' : statType === 'mechanics' ? '피지컬' : statType === 'macro' ? '운영지표' : '교전참여력'} 능력치를 +${points} 부여했습니다!` };
  },

  trainPlayerIndividual: (playerId, programId) => {
    const { players, playerTeamId, activeStaff, coachingStaff, coachingActionsLeft } = get();
    const player = players.find(p => p.id === playerId && p.teamId === playerTeamId);
    if (!player) return { success: false, message: '소속 팀 선수를 찾을 수 없습니다.' };

    if (coachingActionsLeft <= 0) {
      return { success: false, message: '오늘 지휘관의 일일 집중 지도 횟수(Action Points: 2회)를 모두 소진했습니다. 다음 날로 이동 시 리셋됩니다.' };
    }
    if (programId !== 'REST') {
      const currentEnergy = player.energy !== undefined ? player.energy : 100;
      if (currentEnergy < 12) {
        return { success: false, message: `선수의 에너지 체력(Energy: ${Math.round(currentEnergy)}%)이 너무 결핍되어 특훈을 수용할 수 없습니다. 온전한 'REST' 휴식 등이 추천됩니다.` };
      }
    }

    const headCoachId = activeStaff.HEAD_COACH;
    const headCoach = coachingStaff.find(s => s.id === headCoachId);
    const extraGain = headCoach && headCoach.trainingSkill >= 90 ? 1 : 0;

    let cost = 8;
    let updates: Partial<Player> = {};

    const getDiminishedGain = (currentVal: number, baseGain: number): number => {
      if (currentVal >= 90) return 0;
      if (currentVal >= 80) return 1;
      return baseGain;
    };

    const potentialLimit = player.potential || 99;

    switch (programId) {
      case 'LANING':
        updates = {
          lanePhase: Math.min(potentialLimit, player.lanePhase + getDiminishedGain(player.lanePhase, 2 + extraGain)),
          consistency: Math.min(potentialLimit, player.consistency + getDiminishedGain(player.consistency, 1))
        };
        cost = 8;
        break;
      case 'SOLOQ':
        updates = {
          mechanics: Math.min(potentialLimit, player.mechanics + getDiminishedGain(player.mechanics, 2 + extraGain)),
          lanePhase: Math.min(potentialLimit, player.lanePhase + getDiminishedGain(player.lanePhase, 1))
        };
        cost = 10;
        break;
      case 'SCRIMS':
        updates = {
          teamfight: Math.min(potentialLimit, player.teamfight + getDiminishedGain(player.teamfight, 2 + extraGain)),
          macro: Math.min(potentialLimit, player.macro + getDiminishedGain(player.macro, 1))
        };
        cost = 8;
        break;
      case 'MACRO':
        updates = {
          macro: Math.min(potentialLimit, player.macro + getDiminishedGain(player.macro, 3 + extraGain)),
          shotcalling: Math.min(potentialLimit, player.shotcalling + getDiminishedGain(player.shotcalling, 2))
        };
        cost = 6;
        break;
      case 'MINDSET':
        updates = {
          mental: Math.min(potentialLimit, player.mental + getDiminishedGain(player.mental, 2 + extraGain)),
          consistency: Math.min(potentialLimit, player.consistency + getDiminishedGain(player.consistency, 1))
        };
        cost = 8;
        break;
      case 'CHAMPION_POOL':
        updates = {
          macro: Math.min(potentialLimit, player.macro + getDiminishedGain(player.macro, 1))
        };
        const topPool = Object.keys(player.championPool);
        if (topPool.length > 0) {
          const randomChamp = topPool[Math.floor(Math.random() * topPool.length)];
          updates.championPool = {
            ...player.championPool,
            [randomChamp]: Math.min(10, player.championPool[randomChamp] + 1)
          }
        }
        cost = 10;
        break;
      case 'REST':
        updates = {};
        cost = -35;
        break;
      default:
        return { success: false, message: '잘못된 훈련 프로그램입니다.' };
    }

    const mentalCoachId = activeStaff.MENTAL_COACH;
    const finalCost = (programId !== 'REST' && programId !== 'MINDSET' && mentalCoachId) ? Math.ceil(cost * 0.7) : cost;

    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        const nextCondition = Math.min(120, Math.max(50, p.condition - finalCost));
        const currentEnergy = p.energy !== undefined ? p.energy : 100;
        const nextEnergy = Math.min(100, Math.max(0, currentEnergy - finalCost));
        return {
          ...p,
          ...updates,
          condition: nextCondition,
          energy: nextEnergy
        };
      }
      return p;
    });

    const isRest = programId === 'REST';
    set({ 
      players: newPlayers, 
      coachingActionsLeft: coachingActionsLeft - 1 
    });

    return { 
      success: true, 
      message: isRest 
        ? `${player.summonerName} 선수가 안온한 휴식을 취하며 체력과 컨디션을 각각 +35 회복했습니다! (남은 오늘 지도 횟수: ${coachingActionsLeft - 1}회)`
        : `${player.summonerName} 선수의 개인 집중 특훈을 무사 수행했습니다! (남은 오늘 지도 횟수: ${coachingActionsLeft - 1}회)`
    };
  },

  setPlayerTrainingFocus: (playerId, focus) => {
    const { players } = get();
    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          trainingFocus: focus,
          trainingProgress: p.trainingProgress !== undefined ? p.trainingProgress : 0
        };
      }
      return p;
    });
    set({ players: newPlayers });
  }
});
