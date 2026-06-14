import { Player, Champion, Team, Tactics, PlayerMatchStats } from '../types';
import { CHAMPIONS } from '../data/initialData';

export interface MatchSimResult {
  homeTeamId: string;
  awayTeamId: string;
  winnerId: string;
  score: { home: number; away: number }; // kills
  log: string[];
  goldDiffHistory: number[]; // relative to home: positive means home lead, negative means away lead
  xpDiffHistory: number[];   // relative to home: positive means home lead, negative means away lead
  killHistory: { home: number; away: number }[];
  homeStats: PlayerMatchStats[];
  awayStats: PlayerMatchStats[];
  pogPlayerId: string;
}

// Helper to role-match and find champion info
const findChamp = (id: string): Champion | undefined => {
  return CHAMPIONS.find(c => c.id === id);
};

export function simulateLoLMatch(
  homeTeam: Team,
  homeRoster: { [key: string]: { player: Player; championId: string } },
  awayTeam: Team,
  awayRoster: { [key: string]: { player: Player; championId: string } },
  homeTactics?: Tactics,
  awayTactics?: Tactics,
  homeTacticalCoachSkill: number = 0,
  awayTacticalCoachSkill: number = 0,
  isPlayerHome: boolean = false,
  isPlayerAway: boolean = false,
  setNumber: number = 1,
  adaptationBonusHome: number = 0,
  adaptationBonusAway: number = 0,
  sideHome: 'BLUE' | 'RED' = 'BLUE',
  sideAway: 'BLUE' | 'RED' = 'RED'
): MatchSimResult {
  const log: string[] = [];
  const goldDiffHistory: number[] = [0];
  const xpDiffHistory: number[] = [0];
  const killHistory: { home: number; away: number }[] = [{ home: 0, away: 0 }];

  const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

  // Find Aces (highest OVR players) for both teams
  let homeAceId = '';
  let homeMaxOVR = -1;
  roles.forEach(role => {
    const p = homeRoster[role]?.player;
    if (p) {
      const ovr = ((p.lanePhase || 50) + (p.mechanics || 50) + (p.macro || 50) + (p.teamfight || 50) + (p.mental || 50)) / 5;
      if (ovr > homeMaxOVR) {
        homeMaxOVR = ovr;
        homeAceId = p.id;
      }
    }
  });

  let awayAceId = '';
  let awayMaxOVR = -1;
  roles.forEach(role => {
    const p = awayRoster[role]?.player;
    if (p) {
      const ovr = ((p.lanePhase || 50) + (p.mechanics || 50) + (p.macro || 50) + (p.teamfight || 50) + (p.mental || 50)) / 5;
      if (ovr > awayMaxOVR) {
        awayMaxOVR = ovr;
        awayAceId = p.id;
      }
    }
  });

  // AI Difficulty Modifier
  const aiDiffBonusHome = (!isPlayerHome && isPlayerAway) ? 4 : 0;
  const aiDiffBonusAway = (!isPlayerAway && isPlayerHome) ? 4 : 0;

  // Global XP counters
  let homeXP = 0;
  let awayXP = 0;

  // Initialize stats for every player
  const homeStats: Record<string, PlayerMatchStats> = {};
  const awayStats: Record<string, PlayerMatchStats> = {};

  roles.forEach(role => {
    const homeItem = homeRoster[role];
    const awayItem = awayRoster[role];

    const hChamp = findChamp(homeItem.championId);
    const aChamp = findChamp(awayItem.championId);

    homeStats[role] = {
      playerId: homeItem.player.id,
      summonerName: homeItem.player.summonerName,
      role,
      kills: 0,
      deaths: 0,
      assists: 0,
      cs: 0,
      gold: 500, // starting gold
      visionScore: 0,
      championName: hChamp?.name || 'Champion',
      dpm: 0,
      damageDealt: 0
    };

    awayStats[role] = {
      playerId: awayItem.player.id,
      summonerName: awayItem.player.summonerName,
      role,
      kills: 0,
      deaths: 0,
      assists: 0,
      cs: 0,
      gold: 500,
      visionScore: 0,
      championName: aChamp?.name || 'Champion',
      dpm: 0,
      damageDealt: 0
    };
  });

  // Calculate Counter & Synergy Bonuses
  const calculateDraftBonuses = () => {
    let homeTotalCounter = 0;
    let awayTotalCounter = 0;
    let homeTotalSynergy = 0;
    let awayTotalSynergy = 0;

    roles.forEach(role => {
      const hChamp = findChamp(homeRoster[role].championId);
      const aChamp = findChamp(awayRoster[role].championId);

      if (hChamp && aChamp) {
        if (hChamp.counterIds.includes(aChamp.id)) {
          homeTotalCounter += 1.5;
        }
        if (aChamp.counterIds.includes(hChamp.id)) {
          awayTotalCounter += 1.5;
        }
      }
    });

    const homeChamps = roles.map(r => homeRoster[r].championId);
    const awayChamps = roles.map(r => awayRoster[r].championId);

    roles.forEach(role => {
      const hChamp = findChamp(homeRoster[role].championId);
      const aChamp = findChamp(awayRoster[role].championId);

      if (hChamp) {
        hChamp.synergyIds.forEach(synId => {
          if (homeChamps.includes(synId)) homeTotalSynergy += 0.8;
        });
      }
      if (aChamp) {
        aChamp.synergyIds.forEach(synId => {
          if (awayChamps.includes(synId)) awayTotalSynergy += 0.8;
        });
      }
    });

    if (homeTacticalCoachSkill > 0) {
      homeTotalSynergy += parseFloat((homeTacticalCoachSkill / 45).toFixed(2));
    }
    if (awayTacticalCoachSkill > 0) {
      awayTotalSynergy += parseFloat((awayTacticalCoachSkill / 45).toFixed(2));
    }

    return {
      homeCounter: homeTotalCounter,
      awayCounter: awayTotalCounter,
      homeSynergy: homeTotalSynergy,
      awaySynergy: awayTotalSynergy
    };
  };

  const draftBonuses = calculateDraftBonuses();

  log.push(`[경기 시작] ${homeTeam.logo} ${homeTeam.name} vs ${awayTeam.logo} ${awayTeam.name}의 경기가 소환사의 협곡에서 펼쳐집니다!`);
  
  if (draftBonuses.homeCounter > 0 || draftBonuses.homeSynergy > 0) {
    log.push(`[밴픽 분석] ${homeTeam.name}이(가) 카운터 챔피언 구성 및 시너지 보너스 (+${((draftBonuses.homeCounter + draftBonuses.homeSynergy) * 2).toFixed(1)}%) 효과를 획득하여 분석력 우위를 보여줍니다.`);
  }
  if (draftBonuses.awayCounter > 0 || draftBonuses.awaySynergy > 0) {
    log.push(`[밴픽 분석] ${awayTeam.name}이(가) 카운터 챔피언 구성 및 시너지 보너스 (+${((draftBonuses.awayCounter + draftBonuses.awaySynergy) * 2).toFixed(1)}%) 효과를 획득했습니다.`);
  }

  let homeKills = 0;
  let awayKills = 0;
  let homeGold = 2500;
  let awayGold = 2500;
  let homeDrakes = 0;
  let awayDrakes = 0;
  let homeBarons = 0;
  let awayBarons = 0;
  let homeTowers = 0;
  let awayTowers = 0;

  // Track consecutive kills without dying for bounties (LoL system!)
  const homeKillstreaks: Record<string, number> = { TOP: 0, JUNGLE: 0, MID: 0, ADC: 0, SUPPORT: 0 };
  const awayKillstreaks: Record<string, number> = { TOP: 0, JUNGLE: 0, MID: 0, ADC: 0, SUPPORT: 0 };

  const addKill = (
    team: 'HOME' | 'AWAY',
    killerRole: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT',
    assistantRoles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[],
    victimRole: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  ) => {
    if (team === 'HOME') {
      homeKills++;
      
      // Calculate bounty gold
      let killGold = 300;
      let shutdownBonus = 0;
      
      // Check if victim had a bounty streak (3 or more kills)
      const victimStreak = awayKillstreaks[victimRole];
      if (victimStreak >= 3) {
        shutdownBonus = Math.min((victimStreak - 2) * 150, 700); // Max shutdown bounty of 700g
        killGold += shutdownBonus;
      }
      
      homeStats[killerRole].kills++;
      homeStats[killerRole].gold += killGold;
      
      // Reset victim's streak
      awayKillstreaks[victimRole] = 0;
      // Increment killer's streak
      homeKillstreaks[killerRole]++;

      assistantRoles.forEach(r => {
        homeStats[r].assists++;
        homeStats[r].gold += 150;
      });
      awayStats[victimRole].deaths++;

      if (shutdownBonus > 0) {
        log.push(`${minute}분: [🚨 제압 킬] [${homeStats[killerRole].summonerName}] 선수가 현상금이 걸린 [${awayStats[victimRole].summonerName}] 선수를 처치하고 추가 현상 제압 골드 (+${shutdownBonus}G)를 획득합니다!`);
      }
    } else {
      awayKills++;
      
      let killGold = 300;
      let shutdownBonus = 0;
      
      const victimStreak = homeKillstreaks[victimRole];
      if (victimStreak >= 3) {
        shutdownBonus = Math.min((victimStreak - 2) * 150, 700);
        killGold += shutdownBonus;
      }

      awayStats[killerRole].kills++;
      awayStats[killerRole].gold += killGold;
      
      homeKillstreaks[victimRole] = 0;
      awayKillstreaks[killerRole]++;

      assistantRoles.forEach(r => {
        awayStats[r].assists++;
        awayStats[r].gold += 150;
      });
      homeStats[victimRole].deaths++;

      if (shutdownBonus > 0) {
        log.push(`${minute}분: [🚨 제압 킬] [${awayStats[killerRole].summonerName}] 선수가 현상금이 걸린 [${homeStats[victimRole].summonerName}] 선수를 처단하며 현상 제압 골드 (+${shutdownBonus}G)를 수확합니다!`);
      }
    }
  };

  const getDicedStat = (p: Player, attribute: keyof Player, bonus: number = 0) => {
    const baseVal = (p[attribute] as number) || 50;
    const condMult = p.condition / 100;
    
    // Side Selection stat modifiers
    let sideBonus = 0;
    if (p.teamId === homeTeam.id) {
      if (sideHome === 'BLUE' && attribute === 'lanePhase') sideBonus = 3;
      if (sideHome === 'RED' && attribute === 'mechanics') sideBonus = 3;
    } else if (p.teamId === awayTeam.id) {
      if (sideAway === 'BLUE' && attribute === 'lanePhase') sideBonus = 3;
      if (sideAway === 'RED' && attribute === 'mechanics') sideBonus = 3;
    }

    // Draft Adaptation Bonus
    let adaptationBonus = 0;
    if (p.teamId === homeTeam.id) {
      adaptationBonus = adaptationBonusHome;
    } else if (p.teamId === awayTeam.id) {
      adaptationBonus = adaptationBonusAway;
    }

    // 5세트 (Silver Scraps) Ace Trigger
    let aceMultiplier = 1.0;
    if (setNumber === 5 && (p.id === homeAceId || p.id === awayAceId)) {
      if (attribute === 'mental' || attribute === 'macro') {
        aceMultiplier = 1.5;
      }
    }

    // Cumulative Series Fatigue for low mental players
    let seriesFatiguePenalty = 0;
    if (setNumber > 1 && p.mental < 85) {
      seriesFatiguePenalty = -1 * (setNumber - 1) * (1 - p.mental / 100) * 8;
    }

    // Player Morale Factor
    let moraleBonus = 0;
    if (p.morale !== undefined) {
      if (p.morale >= 85) moraleBonus = 2.5;
      else if (p.morale <= 45) moraleBonus = -4;
    }

    // Playstyle Preference Factor
    let playstyleBonus = 0;
    const playstyle = p.playstylePreference || 'BALANCED';
    if (playstyle === 'AGGRESSIVE') {
      if (attribute === 'lanePhase' || attribute === 'mechanics') {
        playstyleBonus = 4;
      } else if (attribute === 'macro' || attribute === 'mental') {
        playstyleBonus = -3;
      }
    } else if (playstyle === 'DEFENSIVE') {
      if (attribute === 'macro' || attribute === 'mental') {
        playstyleBonus = 4;
      } else if (attribute === 'lanePhase' || attribute === 'mechanics') {
        playstyleBonus = -3;
      }
    }

    // Player Energy / Fatigue Factor
    const currentEnergy = p.energy !== undefined ? p.energy : 100;
    const energyPenalty = currentEnergy < 100 ? (currentEnergy - 100) * 0.15 : 0;

    // Improved variance: make games more dynamic and less deterministic
    const variance = 12 + (100 - p.consistency) * 0.5;
    const roll = (Math.random() - 0.5) * variance;
    
    let difficultyBonus = 0;
    if (p.teamId === homeTeam.id) {
      difficultyBonus = aiDiffBonusHome;
    } else if (p.teamId === awayTeam.id) {
      difficultyBonus = aiDiffBonusAway;
    }

    return (baseVal * condMult * aceMultiplier) + bonus + moraleBonus + playstyleBonus + energyPenalty + difficultyBonus + roll + sideBonus + adaptationBonus + seriesFatiguePenalty;
  };

  // Dampen gold lead scaling so early leads don't create mathematical lockouts
  const getGoldLeadBonus = (hGold: number, aGold: number) => {
    const diff = hGold - aGold;
    let hBonus = 0;
    let aBonus = 0;
    let complacencyHome = false;
    let complacencyAway = false;

    // Use a square root scale so gold lead bonuses are balanced and realistic
    if (diff > 0) {
      hBonus = parseFloat((Math.sqrt(diff / 300)).toFixed(2));
      // Leading team has a small chance to get complacent when ahead by >6000 gold
      if (diff > 6000 && Math.random() < 0.15) {
        complacencyHome = true;
      }
    } else if (diff < 0) {
      aBonus = parseFloat((Math.sqrt(-diff / 300)).toFixed(2));
      if (-diff > 6000 && Math.random() < 0.15) {
        complacencyAway = true;
      }
    }

    return { homeBonus: hBonus, awayBonus: aBonus, complacencyHome, complacencyAway };
  };

  // Game tempo late scaling bonuses/debuffs
  let tempoLateFightBonusHome = 0;
  let tempoLateFightBonusAway = 0;
  if (homeTactics?.gameTempo === 'LATE_SCALING') {
    tempoLateFightBonusHome = 5;
  } else if (homeTactics?.gameTempo === 'EARLY_SNOWBALL') {
    tempoLateFightBonusHome = -4;
  }
  if (awayTactics?.gameTempo === 'LATE_SCALING') {
    tempoLateFightBonusAway = 5;
  } else if (awayTactics?.gameTempo === 'EARLY_SNOWBALL') {
    tempoLateFightBonusAway = -4;
  }

  // Run through minute 1 to 40
  let gameFinished = false;
  let finalWinner = '';
  let minute = 1;

  while (minute <= 40 && !gameFinished) {
    // Generate passive gold & CS & Vision Score
    roles.forEach(role => {
      // Passive CS growth
      if (role !== 'SUPPORT') {
        const hCSInc = role === 'JUNGLE' ? 4 : 8;
        const aCSInc = role === 'JUNGLE' ? 4 : 8;
        homeStats[role].cs += hCSInc + (Math.random() > 0.6 ? 1 : 0);
        awayStats[role].cs += aCSInc + (Math.random() > 0.6 ? 1 : 0);
        homeStats[role].visionScore += Math.random() > 0.5 ? 1 : 0;
        awayStats[role].visionScore += Math.random() > 0.5 ? 1 : 0;
      } else {
        homeStats[role].cs += Math.random() > 0.8 ? 1 : 0;
        awayStats[role].cs += Math.random() > 0.8 ? 1 : 0;
        homeStats[role].visionScore += 2 + Math.floor(Math.random() * 2);
        awayStats[role].visionScore += 2 + Math.floor(Math.random() * 2);
      }

      // Passive gold
      homeStats[role].gold += 120 + (homeStats[role].cs * 1.5);
      awayStats[role].gold += 120 + (awayStats[role].cs * 1.5);
    });

    // Sync team total gold
    homeGold = roles.reduce((total, r) => total + homeStats[r].gold, 0) + (homeTowers * 500) + (homeDrakes * 150);
    awayGold = roles.reduce((total, r) => total + awayStats[r].gold, 0) + (awayTowers * 500) + (awayDrakes * 150);

    // Phase 1: Early/Laning Phase (Minutes 1 - 14)
    if (minute <= 14) {
      let laneClashProb = 0.4;
      let gankProb = 0.3;

      if (homeTactics?.gameTempo === 'EARLY_SNOWBALL') {
        laneClashProb += 0.12;
        gankProb += 0.08;
      } else if (homeTactics?.gameTempo === 'LATE_SCALING') {
        laneClashProb -= 0.12;
        gankProb -= 0.08;
      }

      if (awayTactics?.gameTempo === 'EARLY_SNOWBALL') {
        laneClashProb += 0.05;
        gankProb += 0.03;
      } else if (awayTactics?.gameTempo === 'LATE_SCALING') {
        laneClashProb -= 0.05;
        gankProb -= 0.03;
      }

      // Small laning clash roll every minute
      const laneRoll = Math.random();
      if (laneRoll < laneClashProb) {
        const activeRoles: ('TOP' | 'MID' | 'ADC')[] = ['TOP', 'MID', 'ADC'];
        const targetRole = activeRoles[Math.floor(Math.random() * activeRoles.length)];

        const hPlayer = homeRoster[targetRole].player;
        const aPlayer = awayRoster[targetRole].player;

        const focusBonusHome = (homeTactics?.teamFocusRole === targetRole) ? 4 : 0;
        const focusBonusAway = (awayTactics?.teamFocusRole === targetRole) ? 4 : 0;

        const hSkill = getDicedStat(hPlayer, 'lanePhase', draftBonuses.homeCounter + focusBonusHome);
        const aSkill = getDicedStat(aPlayer, 'lanePhase', draftBonuses.awayCounter + focusBonusAway);

        const diff = hSkill - aSkill;

        if (diff > 13) {
          const victim = aPlayer.summonerName;
          const killer = hPlayer.summonerName;
          addKill('HOME', targetRole, [], targetRole);
          log.push(`${minute}분: [라인전] 대단합니다! [${killer}] 선수가 완벽한 솔로 킬 각을 포착하며 [${victim}] 선수를 쓰러뜨립니다!`);
          homeGold += 350;
        } else if (diff < -13) {
          const victim = hPlayer.summonerName;
          const killer = aPlayer.summonerName;
          addKill('AWAY', targetRole, [], targetRole);
          log.push(`${minute}분: [라인전] [${killer}] 선수가 과감한 앞점멸 공세로 [${victim}] 선수를 타워 밑에서 다이브 솔로 킬해냅니다!`);
          awayGold += 350;
        } else if (Math.abs(diff) > 4) {
          const winnerRole = diff > 0 ? 'HOME' : 'AWAY';
          if (winnerRole === 'HOME') {
            homeStats[targetRole].cs += 4;
            homeStats[targetRole].gold += 80;
            // Bot lane dynamic double kill chance (2v2)
            if (targetRole === 'ADC' && Math.random() < 0.12) {
              addKill('HOME', 'ADC', ['SUPPORT'], 'ADC');
              log.push(`${minute}분: [바텀 교전] 바텀 2대2 교전 상황에서 [${hPlayer.summonerName}] 선수가 호흡을 맞춰 킬을 기록합니다!`);
            }
          } else {
            awayStats[targetRole].cs += 4;
            awayStats[targetRole].gold += 80;
            if (targetRole === 'ADC' && Math.random() < 0.12) {
              addKill('AWAY', 'ADC', ['SUPPORT'], 'ADC');
              log.push(`${minute}분: [바텀 교전] 바텀 대치 상태에서 [${aPlayer.summonerName}] 선수가 전광석화 같은 역습으로 킬을 올립니다!`);
            }
          }
        }
      }

      // Jungle Gank Roll
      if (Math.random() < gankProb) {
        const jgTeam = Math.random() > 0.5 ? 'HOME' : 'AWAY';
        const targetRole = (['TOP', 'MID', 'ADC'] as const)[Math.floor(Math.random() * 3)];

        if (jgTeam === 'HOME') {
          const jg = homeRoster.JUNGLE.player;
          const laner = homeRoster[targetRole].player;
          const enemy = awayRoster[targetRole].player;
          const enemyJg = awayRoster.JUNGLE.player;

          const focusGankHome = (homeTactics?.teamFocusRole === targetRole) ? 8 : 0;
          const enemyPlaystyle = enemy.playstylePreference || 'BALANCED';
          let gankPlaystyleModifier = 0;
          if (enemyPlaystyle === 'AGGRESSIVE') gankPlaystyleModifier = 4;
          else if (enemyPlaystyle === 'DEFENSIVE') gankPlaystyleModifier = -4;

          const gankScore = getDicedStat(jg, 'macro') + getDicedStat(laner, 'lanePhase', 4 + focusGankHome) - getDicedStat(enemy, 'lanePhase') - getDicedStat(enemyJg, 'macro', 4) + gankPlaystyleModifier;

          // Counter-gank chance (dynamic 2v2 skirmish)
          const enemyCounterScore = getDicedStat(enemyJg, 'macro') - 5;
          
          if (enemyCounterScore > 75 && Math.random() < 0.35) {
            log.push(`${minute}분: [역갱] [${jg.summonerName}] 선수가 갱킹을 시도하였으나, 미리 경로를 예측한 [${enemyJg.summonerName}] 선수가 부쉬에서 엄호 역갱을 개시하며 2대2 전초전이 터집니다!`);
            
            const fightDiff = (getDicedStat(laner, 'mechanics') + getDicedStat(jg, 'mechanics')) - (getDicedStat(enemy, 'mechanics') + getDicedStat(enemyJg, 'mechanics'));
            if (fightDiff > 8) {
              // Home wins counter-gank (2 for 1)
              addKill('HOME', targetRole, ['JUNGLE'], targetRole);
              addKill('HOME', 'JUNGLE', [targetRole], 'JUNGLE');
              addKill('AWAY', targetRole, ['JUNGLE'], 'JUNGLE');
              log.push(`${minute}분: [교전] 치열한 이전투구 끝에 ${homeTeam.name}이 2킬을 올려 역갱 무리를 완벽 분쇄합니다! (2대1 교전 승리)`);
            } else if (fightDiff < -8) {
              // Away wins counter-gank (2 for 1)
              addKill('AWAY', targetRole, ['JUNGLE'], targetRole);
              addKill('AWAY', 'JUNGLE', [targetRole], 'JUNGLE');
              addKill('HOME', targetRole, ['JUNGLE'], 'JUNGLE');
              log.push(`${minute}분: [교전] 수비하던 ${awayTeam.name}이 역공 화력을 집중하여 상대 듀오를 패퇴시킵니다. (1대2 교전 패배)`);
            } else {
            // 1 for 1 trade
            addKill('HOME', targetRole, ['JUNGLE'], targetRole);
            addKill('AWAY', targetRole, ['JUNGLE'], targetRole);
            log.push(`${minute}분: [교전] 양 팀 정글러들이 라이너를 맞바꿔 처치하며 훈훈하게 1대1 킬 교환에 성공합니다.`);
          }
        } else if (gankScore > 11) {
          addKill('HOME', targetRole, ['JUNGLE', 'SUPPORT'], targetRole);
          if (enemyPlaystyle === 'AGGRESSIVE') {
            log.push(`${minute}분: [갱킹] [${jg.summonerName}] 선수가 빈틈없는 진입으로 갱킹에 성공! 극도로 공격적인 스탠스로 일관하던 [${enemy.summonerName}] 선수가 방심 상태에서 제압당하고 맙니다!`);
          } else {
            log.push(`${minute}분: [갱킹] [${jg.summonerName}] 선수가 빈틈없는 진입으로 갱킹에 성공, [${enemy.summonerName}] 선수를 저승으로 보냅니다!`);
          }
        } else if (enemyPlaystyle === 'DEFENSIVE' && gankScore <= 11) {
          log.push(`${minute}분: [갱킹 모면] [${jg.summonerName}] 선수가 매섭게 다가서며 급습하였으나, 철저히 수비적인 선호 플레이 스타일을 유지 중인 [${enemy.summonerName}] 선수가 뒤로 사리며 가볍게 도망칩니다.`);
        }
        } else {
          const jg = awayRoster.JUNGLE.player;
          const laner = awayRoster[targetRole].player;
          const enemy = homeRoster[targetRole].player;
          const enemyJg = homeRoster.JUNGLE.player;

          const focusGankAway = (awayTactics?.teamFocusRole === targetRole) ? 8 : 0;
          const enemyPlaystyle = enemy.playstylePreference || 'BALANCED';
          let gankPlaystyleModifier = 0;
          if (enemyPlaystyle === 'AGGRESSIVE') gankPlaystyleModifier = 4;
          else if (enemyPlaystyle === 'DEFENSIVE') gankPlaystyleModifier = -4;

          const gankScore = getDicedStat(jg, 'macro') + getDicedStat(laner, 'lanePhase', 4 + focusGankAway) - getDicedStat(enemy, 'lanePhase') - getDicedStat(enemyJg, 'macro', 4) + gankPlaystyleModifier;

          // Counter-gank chance (dynamic 2v2 skirmish)
          const enemyCounterScore = getDicedStat(enemyJg, 'macro') - 5;

          if (enemyCounterScore > 75 && Math.random() < 0.35) {
            log.push(`${minute}분: [역갱] 적 정글러 [${jg.summonerName}]가 매섭게 달려들자, 기류를 눈치챈 [${enemyJg.summonerName}] 선수가 기민하게 진입하며 역갱의 카운터 블로를 칩니다!`);
            
            const fightDiff = (getDicedStat(enemy, 'mechanics') + getDicedStat(enemyJg, 'mechanics')) - (getDicedStat(laner, 'mechanics') + getDicedStat(jg, 'mechanics'));
            if (fightDiff > 8) {
              addKill('HOME', targetRole, ['JUNGLE'], targetRole);
              addKill('HOME', 'JUNGLE', [targetRole], 'JUNGLE');
              addKill('AWAY', targetRole, ['JUNGLE'], 'JUNGLE');
              log.push(`${minute}분: [교전] 아군의 날카로운 합공으로 적군 정글과 라이너를 모두 사냥하고 호조세를 맞이합니다! (2대1 교전 승리)`);
            } else if (fightDiff < -8) {
              addKill('AWAY', targetRole, ['JUNGLE'], targetRole);
              addKill('AWAY', 'JUNGLE', [targetRole], 'JUNGLE');
              addKill('HOME', targetRole, ['JUNGLE'], 'JUNGLE');
              log.push(`${minute}분: [교전] 기세를 모은 적 정글러가 더 정교한 타격을 행사하여 아군이 무너졌습니다. (1대2 패배)`);
            } else {
              addKill('HOME', targetRole, ['JUNGLE'], targetRole);
              addKill('AWAY', targetRole, ['JUNGLE'], targetRole);
              log.push(`${minute}분: [교전] 스펠과 스킬이 극한으로 오간 끝에 철저히 1대1 킬을 교환하고 수장됩니다.`);
            }
          } else if (gankScore > 11) {
            addKill('AWAY', targetRole, ['JUNGLE', 'SUPPORT'], targetRole);
            if (enemyPlaystyle === 'AGGRESSIVE') {
              log.push(`${minute}분: [갱킹] 상대 정글러 [${jg.summonerName}] 선수가 라인을 깊게 밀고 압박하던 아군 [${enemy.summonerName}] 선수의 배후를 노출한 성향을 노려 그대로 끌어내립니다!`);
            } else {
              log.push(`${minute}분: [갱킹] 상대 정글러 [${jg.summonerName}] 선수가 침착히 매설하며 [${enemy.summonerName}] 선수를 주저앉힙니다.`);
            }
          } else if (enemyPlaystyle === 'DEFENSIVE' && gankScore <= 11) {
            log.push(`${minute}분: [갱킹 모면] 적 정글러가 기습 압박을 시도했으나, 수비 위주로 안정적인 동선을 사리던 [${enemy.summonerName}] 선수가 안전하게 거리를 벌려 귀환에 성공합니다.`);
          }
        }
      }

      // Objective Contest: Rift Herald / 1st Drake
      if (minute === 8 || minute === 13) {
        const objType = minute === 8 ? '협곡의 전령' : '첫 번째 드래곤';
        const hControl = getDicedStat(homeRoster.JUNGLE.player, 'macro') + getDicedStat(homeRoster.MID.player, 'shotcalling') * 0.5 + (draftBonuses.homeSynergy * 3);
        const aControl = getDicedStat(awayRoster.JUNGLE.player, 'macro') + getDicedStat(awayRoster.MID.player, 'shotcalling') * 0.5 + (draftBonuses.awaySynergy * 3);

        if (hControl >= aControl) {
          if (minute === 8) {
            homeTowers += 1;
            homeGold += 600;
            log.push(`${minute}분: [오브젝트] [${homeRoster.JUNGLE.player.summonerName}] 선수가 ${objType}을 확보하고 탑 타워 골드를 채굴합니다!`);
          } else {
            homeDrakes += 1;
            log.push(`${minute}분: [오브젝트] ${homeTeam.name}이 용 둥지를 선점하며 첫 번째 원소 드래곤을 사냥 완료합니다.`);
          }
        } else {
          if (minute === 8) {
            awayTowers += 1;
            awayGold += 600;
            log.push(`${minute}분: [오브젝트] 적 정글러가 ${objType}을 둥지에서 사냥해 철거 기회를 이뤄냅니다.`);
          } else {
            awayDrakes += 1;
            log.push(`${minute}분: [오브젝트] ${awayTeam.name}이 영구 포커싱 버프인 첫 드래곤을 조용히 사냥 완료합니다.`);
          }
        }
      }
    }

    // Phase 2: Mid Game / Objectives (Minutes 15 - 24)
    if (minute > 14 && minute <= 24) {
      if (minute === 15 || minute === 18 || minute === 21) {
        const hMacro = roles.reduce((sum, r) => sum + getDicedStat(homeRoster[r].player, 'macro'), 0) / 5 + (draftBonuses.homeSynergy * 2);
        const aMacro = roles.reduce((sum, r) => sum + getDicedStat(awayRoster[r].player, 'macro'), 0) / 5 + (draftBonuses.awaySynergy * 2);

        if (hMacro - aMacro > 10) {
          homeTowers++;
          homeGold += 500;
          log.push(`${minute}분: [포탑 파괴] ${homeTeam.name}이 맵 전반의 훌륭한 라인 스왑 브리핑 운영으로 상대 외곽 포탑을 철거합니다.`);
        } else if (aMacro - hMacro > 10) {
          awayTowers++;
          awayGold += 500;
          log.push(`${minute}분: [포탑 파괴] 운영의 정밀함에서 밀려 ${awayTeam.name}의 돌파형 사이드 푸시에 아군 타워를 헌납합니다.`);
        }
      }

      // Objective Contest: Drakes (Minutes 17, 22)
      if (minute === 17 || minute === 22) {
        log.push(`${minute}분: [오브젝트] 드래곤 둥지 주변 강가 아군 적군 시야석 핑이 폭발하며 오늘 첫 대형 한타가 촉발됩니다!`);

        // Retrieve Gold Lead scaling and Complacency factors!
        const leadState = getGoldLeadBonus(homeGold, awayGold);
        
        const complacencyPenaltyHome = leadState.complacencyHome ? -10 : 0;
        const complacencyPenaltyAway = leadState.complacencyAway ? -10 : 0;

        if (leadState.complacencyHome) {
          log.push(`${minute}분: [⚡ 방심] 글로벌 골드가 크게 앞선 ${homeTeam.name}이 포지셔닝 실수 및 다소 오만한 시야 전개로 빈틈을 노출합니다!`);
        }
        if (leadState.complacencyAway) {
          log.push(`${minute}분: [⚡ 방심] 글로벌 골드가 대거 앞서던 ${awayTeam.name}이 맵 리딩 실수 및 오버 익스텐션으로 주도권을 한 템포 내어줍니다!`);
        }

        const hFight = roles.reduce((sum, r) => sum + getDicedStat(homeRoster[r].player, 'teamfight'), 0) / 5 + (draftBonuses.homeSynergy * 2.5) + tempoLateFightBonusHome + leadState.homeBonus + complacencyPenaltyHome;
        const aFight = roles.reduce((sum, r) => sum + getDicedStat(awayRoster[r].player, 'teamfight'), 0) / 5 + (draftBonuses.awaySynergy * 2.5) + tempoLateFightBonusAway + leadState.awayBonus + complacencyPenaltyAway;

        if (hFight > aFight + 8) {
          homeDrakes++;
          // Home Massive Win (3-1 Trade)
          addKill('HOME', 'ADC', ['SUPPORT', 'MID'], 'ADC');
          addKill('HOME', 'MID', ['JUNGLE'], 'MID');
          addKill('HOME', 'TOP', ['SUPPORT'], 'TOP');
          addKill('AWAY', 'ADC', ['SUPPORT'], 'JUNGLE'); 
          log.push(`${minute}분: [드래곤 한타] 대승!! [${homeRoster.ADC.player.summonerName}] 선수의 엄청난 보디가딩 속 폭발적인 딜링으로 상대를 압살하며 3킬을 쓸어 담고 고대 용 버프를 사냥합니다! (3대1 교전 완승)`);
        } else if (hFight > aFight + 3) {
          homeDrakes++;
          // Home Minor Win (2-1 Trade)
          addKill('HOME', 'ADC', ['SUPPORT', 'MID'], 'ADC');
          addKill('HOME', 'MID', ['JUNGLE'], 'MID');
          addKill('AWAY', 'ADC', ['JUNGLE'], 'SUPPORT');
          log.push(`${minute}분: [드래곤 한타] 상대를 야금야금 조여가는 조율 속에서 ${homeTeam.name}이 정교한 포커싱으로 2명 제압 후 고대 용둥지를 장악합니다! (2대1 교전 승리)`);
        } else if (aFight > hFight + 8) {
          awayDrakes++;
          // Away Massive Win (3-1 Trade)
          addKill('AWAY', 'ADC', ['SUPPORT', 'MID'], 'ADC');
          addKill('AWAY', 'MID', ['JUNGLE'], 'MID');
          addKill('AWAY', 'TOP', ['SUPPORT'], 'TOP');
          addKill('HOME', 'ADC', ['SUPPORT'], 'JUNGLE');
          log.push(`${minute}분: [드래곤 한타] 대패! 후반 지점에서 급습을 시도한 [${awayRoster.ADC.player.summonerName}] 선수가 더블킬을 작렬시키며 진영을 초토화시킵니다! 용을 내어줍니다. (1대3 교전 완패)`);
        } else if (aFight > hFight + 3) {
          awayDrakes++;
          // Away Minor Win (2-1 Trade)
          addKill('AWAY', 'ADC', ['SUPPORT', 'MID'], 'ADC');
          addKill('AWAY', 'MID', ['JUNGLE'], 'MID');
          addKill('HOME', 'ADC', ['JUNGLE'], 'SUPPORT');
          log.push(`${minute}분: [드래곤 한타] 부쉬 매복 각도에서 상대 서포터를 처단하고 용 둥지 돌입에 성공하며 한타 판세를 굳힙니다. (1대2 교전 패배)`);
        } else {
          // Tense contest / Trade / Steal (1-1 Trade)
          const stealer = Math.random() > 0.5 ? 'HOME' : 'AWAY';
          addKill('HOME', 'ADC', ['SUPPORT'], 'ADC');
          addKill('AWAY', 'ADC', ['SUPPORT'], 'ADC');
          if (stealer === 'HOME') {
            homeDrakes++;
            log.push(`${minute}분: [드래곤 스틸!] 한치 물러섬 없는 대치 국면에서 [${homeRoster.JUNGLE.player.summonerName}] 선수가 눈부신 스틸을 결행하며 버프를 강탈합니다! 킬은 양 팀 1대1 교환인 호각새입니다.`);
          } else {
            awayDrakes++;
            log.push(`${minute}분: [드래곤 스틸!] [${awayRoster.JUNGLE.player.summonerName}] 선수가 한 치 오차도 없는 강타 타이밍으로 스틸을 완료합니다! 난전 격전 속 1대1 킬 스왑!`);
          }
        }
      }
    }

    // Phase 3: Late Game / Teamfights / Baron (Minutes 25+)
    if (minute >= 25) {
      const fightRoll = Math.random();

      // Baron nashor spawns and contested (Minute 26, 32, 37)
      if (minute === 26 || minute === 32 || minute === 37) {
        log.push(`${minute}분: [바론 대치] 내셔 남작(바론) 둥지 인근으로 극도의 살얼음판 시야 와드 대치가 이어집니다. 단 한번의 실수가 곧바로 게임 패배와 연결됩니다.`);

        const hShot = roles.reduce((sum, r) => sum + getDicedStat(homeRoster[r].player, 'shotcalling'), 0) / 5;
        const aShot = roles.reduce((sum, r) => sum + getDicedStat(awayRoster[r].player, 'shotcalling'), 0) / 5;

        // Retrieve Gold Lead and Complacency factors!
        const leadState = getGoldLeadBonus(homeGold, awayGold);
        const complacencyPenaltyHome = leadState.complacencyHome ? -12 : 0;
        const complacencyPenaltyAway = leadState.complacencyAway ? -12 : 0;

        if (leadState.complacencyHome) {
          log.push(`${minute}분: [🚨 방심] 유리한 흐름인 ${homeTeam.name} 측에서 내셔 남작 버스트를 지나치게 서두르다 대형 오판을 저지릅니다!`);
        }
        if (leadState.complacencyAway) {
          log.push(`${minute}분: [🚨 방심] 압도적인 리드이던 ${awayTeam.name} 측의 대열이 순간 벌어지며 바론 시야 사화에 맹점을 맞이합니다!`);
        }

        const hFight = roles.reduce((sum, r) => sum + getDicedStat(homeRoster[r].player, 'teamfight'), 0) / 5 + (draftBonuses.homeSynergy * 3) + tempoLateFightBonusHome + hShot * 0.25 + leadState.homeBonus + complacencyPenaltyHome;
        const aFight = roles.reduce((sum, r) => sum + getDicedStat(awayRoster[r].player, 'teamfight'), 0) / 5 + (draftBonuses.awaySynergy * 3) + tempoLateFightBonusAway + aShot * 0.25 + leadState.awayBonus + complacencyPenaltyAway;

        const scoreDiff = hFight - aFight;

        if (scoreDiff > 10) {
          // Home ACE! (4-1 trade)
          homeBarons++;
          homeTowers += 2;
          homeGold += 2000;

          addKill('HOME', 'MID', ['SUPPORT', 'ADC'], 'MID');
          addKill('HOME', 'ADC', ['JUNGLE', 'TOP'], 'ADC');
          addKill('HOME', 'TOP', ['MID'], 'TOP');
          addKill('HOME', 'JUNGLE', ['SUPPORT'], 'JUNGLE');
          addKill('AWAY', 'ADC', ['SUPPORT'], 'SUPPORT');

          log.push(`${minute}분: [에이스 대승!] 협곡 전율의 내셔 남작 둥지 대승! [${homeRoster.MID.player.summonerName}] 선수의 현란한 수퍼 배달콤보로 상대 딜러 대열을 붕괴하며 한타 대승, 영도력을 갖춘 바론 버프를 마킹합니다! (4대1 교전 대승)`);
        } else if (scoreDiff > 4) {
          // Home big victory (3-2 Trade)
          homeBarons++;
          homeTowers += 1;
          homeGold += 1700;

          addKill('HOME', 'ADC', ['SUPPORT'], 'ADC');
          addKill('HOME', 'MID', ['JUNGLE'], 'MID');
          addKill('HOME', 'TOP', ['MID'], 'TOP');
          addKill('AWAY', 'MID', ['SUPPORT'], 'JUNGLE');
          addKill('AWAY', 'ADC', ['TOP'], 'SUPPORT');

          log.push(`${minute}분: [바론 대승] 바론 주도권의 혈전 끝에 ${homeTeam.name}의 뒷심 화력이 상대 진입 조율을 압도하며 3명을 지우고 바론 사냥에 골인합니다! (3대2 교전 승리)`);
        } else if (scoreDiff < -10) {
          // Away ACE! (1-4 trade)
          awayBarons++;
          awayTowers += 2;
          awayGold += 2000;

          addKill('AWAY', 'MID', ['SUPPORT', 'ADC'], 'MID');
          addKill('AWAY', 'ADC', ['JUNGLE', 'TOP'], 'ADC');
          addKill('AWAY', 'TOP', ['MID'], 'TOP');
          addKill('AWAY', 'JUNGLE', ['SUPPORT'], 'JUNGLE');
          addKill('HOME', 'ADC', ['SUPPORT'], 'SUPPORT');

          log.push(`${minute}분: [에이스 대패] 바론 수성에 완벽히 압도당했습니다! 적 에이스 [${awayRoster.MID.player.summonerName}] 선수의 눈을 가리는 포격 누킹딜에 대오가 무너지며 4킬을 내주고 바론을 양도합니다. (1대4 교전 완패)`);
        } else if (scoreDiff < -4) {
          // Away big victory (2-3 Trade)
          awayBarons++;
          awayTowers += 1;
          awayGold += 1700;

          addKill('AWAY', 'ADC', ['SUPPORT'], 'ADC');
          addKill('AWAY', 'MID', ['JUNGLE'], 'MID');
          addKill('AWAY', 'TOP', ['MID'], 'TOP');
          addKill('HOME', 'MID', ['SUPPORT'], 'MID');
          addKill('HOME', 'ADC', ['TOP'], 'SUPPORT');

          log.push(`${minute}분: [바론 장악] 상대 기습 매복공세에 진형이 분리되어 3킬을 내주었고, 남작 지배권을 적에게 완전 피탈당합니다. (2대3 교전 패배)`);
        } else {
          // Soft trade / Dramatic steal! (1-1 Trade)
          const stealer = Math.random() > 0.5 ? 'HOME' : 'AWAY';
          addKill('HOME', 'ADC', ['SUPPORT'], 'ADC');
          addKill('AWAY', 'ADC', ['SUPPORT'], 'ADC');
          if (stealer === 'HOME') {
            homeBarons++;
            homeGold += 1500;
            log.push(`${minute}분: [오브젝트] [${homeRoster.JUNGLE.player.summonerName}] 선수의 심장을 부여잡는 기적의 강타! 상대의 억 소리 나는 버스트를 한방 스마이트로 탈취하여 버프를 뺏어옵니다! 공방 수습 후 1대1 동점 교환!`);
          } else {
            awayBarons++;
            awayGold += 1500;
            log.push(`${minute}분: [오브젝트] 적 정글러 [${awayRoster.JUNGLE.player.summonerName}] 선수가 사력을 다한 강타로 스틸을 성립하며 바론 버프의 키를 가져옵니다! 1대1 킬을 기록하는 분쟁지대였습니다.`);
          }
        }
      } else if (fightRoll < 0.40) {
        // Late random skirmish (2-1 Trade, or 1-1 Trade)
        const hFight = roles.reduce((sum, r) => sum + getDicedStat(homeRoster[r].player, 'teamfight'), 0) / 5 + (draftBonuses.homeSynergy * 2.5) + tempoLateFightBonusHome;
        const aFight = roles.reduce((sum, r) => sum + getDicedStat(awayRoster[r].player, 'teamfight'), 0) / 5 + (draftBonuses.awaySynergy * 2.5) + tempoLateFightBonusAway;

        const bLead = (homeBarons * 8) - (awayBarons * 8);
        const leadState = getGoldLeadBonus(homeGold, awayGold);

        const hScore = hFight + bLead + leadState.homeBonus;
        const aScore = aFight + leadState.awayBonus;

        const fightDiff = hScore - aScore;

        if (fightDiff > 8) {
          // Home winner trade (2-1 Trade)
          addKill('HOME', 'ADC', ['SUPPORT'], 'ADC');
          addKill('HOME', 'MID', ['JUNGLE'], 'MID');
          addKill('AWAY', 'ADC', ['SUPPORT'], 'SUPPORT');
          log.push(`${minute}분: [한타 대승] 극렬한 정글 시야 신경전 도중 [${homeRoster.ADC.player.summonerName}] 선수가 눈부신 카이팅 폭딜로 귀중한 2킬을 수취해 한타를 선도합니다! (2대1 교전 승리)`);
        } else if (fightDiff < -8) {
          // Away winner trade (2-1 Trade)
          addKill('AWAY', 'ADC', ['SUPPORT'], 'ADC');
          addKill('AWAY', 'MID', ['JUNGLE'], 'MID');
          addKill('HOME', 'ADC', ['SUPPORT'], 'SUPPORT');
          log.push(`${minute}분: [한타 패배] 아군의 진입 경로가 상대의 시야에 완벽 차단당해 고립되었고, 적 아펠/제리에게 휘말려 손해를 안겼습니다. (1대2 교전 패배)`);
        } else if (Math.abs(fightDiff) > 3) {
          // 1-1 trade
          const winnerArg = fightDiff > 0 ? 'HOME' : 'AWAY';
          if (winnerArg === 'HOME') {
            addKill('HOME', 'MID', ['JUNGLE'], 'MID');
            addKill('AWAY', 'ADC', ['SUPPORT'], 'SUPPORT');
          } else {
            addKill('AWAY', 'MID', ['JUNGLE'], 'MID');
            addKill('HOME', 'ADC', ['SUPPORT'], 'SUPPORT');
          }
          log.push(`${minute}분: [소규모 교전] 적막이 도는 드래곤 길목 매복 작전 도중 서폿끼리의 무차별 스펠 교섭 후 일가에서 격하게 전사자를 한 명씩 내놓습니다.`);
        }
      }

      // Check for Game Finish criteria (Nexus down after massive push)
      const gLead = homeGold - awayGold;
      const hEndScore = gLead / 200 + (homeBarons * 3) + (homeTowers - awayTowers) * 2;
      
      const endThreshold = minute >= 30 ? 25 : 35;
      
      if (hEndScore > endThreshold) {
        gameFinished = true;
        finalWinner = 'HOME';
        log.push(`${minute}분: [경기 종료] ${homeTeam.logo} ${homeTeam.name}이 장로 드래곤 버프와 함께 적 넥서스를 정조준합니다! 마지막 방어 대열을 무력화시키고 넥서스를 완전 완파해내며 승리합니다!`);
      } else if (hEndScore < -endThreshold) {
        gameFinished = true;
        finalWinner = 'AWAY';
        log.push(`${minute}분: [경기 종료] ${awayTeam.logo} ${awayTeam.name}이 거세게 밀려오는 정돈된 미니언 군대를 따라 쌍둥이 포탑을 장악, 필사의 수비진을 지우고 넥서스를 분쇄하며 경기를 굳힙니다!`);
      }
    }

    // Update player cumulative damage and DPM during this minute
    roles.forEach(role => {
      const hStats = homeStats[role];
      const aStats = awayStats[role];
      const hItem = homeRoster[role];
      const aItem = awayRoster[role];

      // Base minute damage multiplier based on role
      const roleDamageMultipliers = {
        TOP: { base: 420, skillWeight: 3.5, killsWeight: 180 },
        JUNGLE: { base: 260, skillWeight: 2.2, killsWeight: 120 },
        MID: { base: 540, skillWeight: 4.5, killsWeight: 240 },
        ADC: { base: 600, skillWeight: 4.8, killsWeight: 260 },
        SUPPORT: { base: 110, skillWeight: 1.0, killsWeight: 40 }
      };

      const hMult = roleDamageMultipliers[role];
      const hDmgInc = hMult.base + 
        (hItem.player.mechanics * hMult.skillWeight) + 
        (hStats.kills * hMult.killsWeight) + 
        (Math.random() * 120);
      hStats.damageDealt = (hStats.damageDealt || 0) + Math.round(hDmgInc);
      hStats.dpm = Math.round(hStats.damageDealt / minute);

      const aMult = roleDamageMultipliers[role];
      const aDmgInc = aMult.base + 
        (aItem.player.mechanics * aMult.skillWeight) + 
        (aStats.kills * aMult.killsWeight) + 
        (Math.random() * 120);
      aStats.damageDealt = (aStats.damageDealt || 0) + Math.round(aDmgInc);
      aStats.dpm = Math.round(aStats.damageDealt / minute);
    });

    // Experience modeling
    const hXPInc = roles.reduce((sum, r) => {
      const pStats = homeStats[r];
      return sum + 400 + (pStats.cs * 52) + (pStats.kills * 110);
    }, 0) + (homeTowers * 550) + (homeBarons * 1200);

    const aXPInc = roles.reduce((sum, r) => {
      const pStats = awayStats[r];
      return sum + 400 + (pStats.cs * 52) + (pStats.kills * 110);
    }, 0) + (awayTowers * 550) + (awayBarons * 1200);

    homeXP += hXPInc;
    awayXP += aXPInc;

    // Push details to history
    goldDiffHistory.push(homeGold - awayGold);
    xpDiffHistory.push(homeXP - awayXP);
    killHistory.push({ home: homeKills, away: awayKills });

    minute++;
  }

  // If time runs out (40 min max), force winner based on current gold lead or objective lead
  if (!gameFinished) {
    if (homeGold >= awayGold) {
      finalWinner = 'HOME';
      log.push(`40분: [경기 종료] 한계 시간 40분이 만료되어, 글로벌 골드 격차 및 타워 균열 주도권이 뛰어난 ${homeTeam.logo} ${homeTeam.name}의 기운찬 판정승이 선언됩니다!`);
    } else {
      finalWinner = 'AWAY';
      log.push(`40분: [경기 종료] 격변하는 전투 속 40분 시간 제한이 도래하여, 보다 풍부한 시야석 및 골드 우위를 점한 ${awayTeam.logo} ${awayTeam.name}의 최종 판정승이 확정됩니다!`);
    }
  }

  // Determine POG Player (and return stats)
  let bestPogRole: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' = 'MID';
  let maxMVPVal = -999;
  
  if (finalWinner === 'HOME') {
    roles.forEach(r => {
      const stats = homeStats[r];
      const mvpScore = stats.kills * 4 + stats.assists * 2 - stats.deaths * 2 + (hCSIncFactor(r) * stats.cs * 0.05);
      if (mvpScore > maxMVPVal) {
        maxMVPVal = mvpScore;
        bestPogRole = r;
      }
    });

    const pogPlayer = homeRoster[bestPogRole].player;
    return {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      winnerId: homeTeam.id,
      score: { home: homeKills, away: awayKills },
      log,
      goldDiffHistory,
      xpDiffHistory,
      killHistory,
      homeStats: Object.values(homeStats),
      awayStats: Object.values(awayStats),
      pogPlayerId: pogPlayer.id
    };
  } else {
    roles.forEach(r => {
      const stats = awayStats[r];
      const mvpScore = stats.kills * 4 + stats.assists * 2 - stats.deaths * 2 + (hCSIncFactor(r) * stats.cs * 0.05);
      if (mvpScore > maxMVPVal) {
        maxMVPVal = mvpScore;
        bestPogRole = r;
      }
    });

    const pogPlayer = awayRoster[bestPogRole].player;
    return {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      winnerId: awayTeam.id,
      score: { home: homeKills, away: awayKills },
      log,
      goldDiffHistory,
      xpDiffHistory,
      killHistory,
      homeStats: Object.values(homeStats),
      awayStats: Object.values(awayStats),
      pogPlayerId: pogPlayer.id
    };
  }
}

function hCSIncFactor(role: string) {
  if (role === 'ADC' || role === 'MID') return 1;
  if (role === 'TOP') return 0.8;
  if (role === 'JUNGLE') return 0.5;
  return 0.1;
}

export function simulateLoLSeries(
  homeTeam: Team,
  homeRoster: { [key: string]: { player: Player; championId: string } },
  awayTeam: Team,
  awayRoster: { [key: string]: { player: Player; championId: string } },
  homeTactics?: Tactics,
  awayTactics?: Tactics,
  homeTacticalCoachSkill: number = 0,
  awayTacticalCoachSkill: number = 0,
  isPlayerHome: boolean = false,
  isPlayerAway: boolean = false,
  isBo3: boolean = false
): MatchSimResult {
  const maxWins = isBo3 ? 2 : 3;
  let homeWins = 0;
  let awayWins = 0;
  let currentSet = 1;

  const seriesLogs: string[] = [];
  let lastSetRes: MatchSimResult | null = null;
  
  // Track previous set loser for side selection and adaptation
  let lastSetLoser: 'HOME' | 'AWAY' | null = null;

  // Track stats summation
  const sumHomeStats: Record<string, PlayerMatchStats> = {};
  const sumAwayStats: Record<string, PlayerMatchStats> = {};
  const pogCount: Record<string, number> = {};

  const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

  seriesLogs.push(`[토너먼트 매치 개시] ${homeTeam.logo} ${homeTeam.name} vs ${awayTeam.logo} ${awayTeam.name}의 ${isBo3 ? '3판 2선승제(BO3)' : '5판 3선승제(BO5)'} 다전제 결정전 매치가 오피셜 개막됩니다!`);

  while (homeWins < maxWins && awayWins < maxWins && currentSet <= (isBo3 ? 3 : 5)) {
    // 1. Determine active side choices
    let sideHome: 'BLUE' | 'RED' = 'BLUE';
    let sideAway: 'BLUE' | 'RED' = 'RED';

    if (currentSet > 1 && lastSetLoser) {
      if (lastSetLoser === 'HOME') {
        sideHome = 'BLUE';
        sideAway = 'RED';
      } else {
        sideHome = 'RED';
        sideAway = 'BLUE';
      }
    }

    // 2. Draft Adaptation Bonus (loser of last game gets +5)
    let adaptationBonusHome = 0;
    let adaptationBonusAway = 0;
    if (currentSet > 1 && lastSetLoser) {
      if (lastSetLoser === 'HOME') {
        adaptationBonusHome = 5;
      } else {
        adaptationBonusAway = 5;
      }
    }

    let setIntro = `\n--- ⚔️ 제 ${currentSet}세트 (SET ${currentSet}) 시작 ⚔️ ---`;
    seriesLogs.push(setIntro);

    if (currentSet > 1 && lastSetLoser) {
      const loserName = lastSetLoser === 'HOME' ? homeTeam.name : awayTeam.name;
      seriesLogs.push(`[진영 선택] 이전 세트를 패배한 [${loserName}] 팀이 사이드 선택권을 활용해 BLUE 진영(첫 번째 우선 픽 구성)을 차지합니다!`);
      seriesLogs.push(`[드래프트 적응] [${loserName}] 팀이 완벽한 밴픽 피드백을 통해 챔피언 대응 전술 보정 (+5%) 시너지를 획득하여 분석력 주도권을 쥡니다.`);
    }

    // Run set
    const setRes = simulateLoLMatch(
      homeTeam,
      homeRoster,
      awayTeam,
      awayRoster,
      homeTactics,
      awayTactics,
      homeTacticalCoachSkill,
      awayTacticalCoachSkill,
      isPlayerHome,
      isPlayerAway,
      currentSet,
      adaptationBonusHome,
      adaptationBonusAway,
      sideHome,
      sideAway
    );

    // Save logs (only filter major milestone logs of this set to make a clean, epic timeline!)
    const majorSetLogs = setRes.log.filter(line => {
      return (
        line.includes('[경기 시작]') ||
        line.includes('[밴픽 분석]') ||
        line.includes('[🚨 제압 킬]') ||
        line.includes('[역갱]') ||
        line.includes('[바론]') ||
        line.includes('[드래곤 영혼]') ||
        line.includes('[장로 드래곤]') ||
        line.includes('[경기 종료]') ||
        line.includes('펜타킬') ||
        (line.includes('[한타]') && Math.random() < 0.45) ||
        (line.includes('[오브젝트]') && Math.random() < 0.6)
      );
    });

    majorSetLogs.forEach(logLine => {
      seriesLogs.push(`[SET ${currentSet}] ${logLine}`);
    });

    // Record winner
    const setWinner = setRes.winnerId;
    if (setWinner === homeTeam.id) {
      homeWins++;
      lastSetLoser = 'AWAY';
      seriesLogs.push(`[SET ${currentSet} 종료] ${homeTeam.logo} ${homeTeam.name} 승리! (세트 스코어 ${homeWins}:${awayWins})`);
    } else {
      awayWins++;
      lastSetLoser = 'HOME';
      seriesLogs.push(`[SET ${currentSet} 종료] ${awayTeam.logo} ${awayTeam.name} 승리! (세트 스코어 ${homeWins}:${awayWins})`);
    }

    // Accumulate player stats
    const hStatsList = setRes.homeStats;
    const aStatsList = setRes.awayStats;

    hStatsList.forEach(s => {
      if (!sumHomeStats[s.role]) {
        sumHomeStats[s.role] = { ...s };
      } else {
        sumHomeStats[s.role].kills += s.kills;
        sumHomeStats[s.role].deaths += s.deaths;
        sumHomeStats[s.role].assists += s.assists;
        sumHomeStats[s.role].cs += s.cs;
        sumHomeStats[s.role].gold += s.gold;
        sumHomeStats[s.role].visionScore += s.visionScore;
        sumHomeStats[s.role].damageDealt = (sumHomeStats[s.role].damageDealt || 0) + (s.damageDealt || 0);
      }
    });

    aStatsList.forEach(s => {
      if (!sumAwayStats[s.role]) {
        sumAwayStats[s.role] = { ...s };
      } else {
        sumAwayStats[s.role].kills += s.kills;
        sumAwayStats[s.role].deaths += s.deaths;
        sumAwayStats[s.role].assists += s.assists;
        sumAwayStats[s.role].cs += s.cs;
        sumAwayStats[s.role].gold += s.gold;
        sumAwayStats[s.role].visionScore += s.visionScore;
        sumAwayStats[s.role].damageDealt = (sumAwayStats[s.role].damageDealt || 0) + (s.damageDealt || 0);
      }
    });

    // POG tallies
    pogCount[setRes.pogPlayerId] = (pogCount[setRes.pogPlayerId] || 0) + 1;

    lastSetRes = setRes;
    currentSet++;
  }

  // Calculate final OVR and DPM averages for the player stats arrays
  const totalGamesPlayed = homeWins + awayWins;
  roles.forEach(role => {
    if (sumHomeStats[role]) {
      sumHomeStats[role].dpm = Math.round((sumHomeStats[role].damageDealt || 0) / (32 * totalGamesPlayed));
    }
    if (sumAwayStats[role]) {
      sumAwayStats[role].dpm = Math.round((sumAwayStats[role].damageDealt || 0) / (32 * totalGamesPlayed));
    }
  });

  const seriesWinnerId = homeWins > awayWins ? homeTeam.id : awayTeam.id;
  seriesLogs.push(`\n[최종 대진 결산] 🎉 경이로운 싸움 끝에 시리즈 최종 스코어 ${homeWins}:${awayWins}로 ${seriesWinnerId === homeTeam.id ? homeTeam.name : awayTeam.name}팀이 대망의 최종 지형 매치 승자로 등극합니다!`);

  // Find overall Series POG
  let bestPogId = lastSetRes?.pogPlayerId || '';
  let maxPogWins = 0;
  Object.entries(pogCount).forEach(([pId, wins]) => {
    if (wins > maxPogWins) {
      maxPogWins = wins;
      bestPogId = pId;
    }
  });

  // Return formatted results
  return {
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    winnerId: seriesWinnerId,
    score: { home: homeWins, away: awayWins },
    log: seriesLogs,
    goldDiffHistory: lastSetRes?.goldDiffHistory || [0],
    xpDiffHistory: lastSetRes?.xpDiffHistory || [0],
    killHistory: lastSetRes?.killHistory || [{ home: 0, away: 0 }],
    homeStats: Object.values(sumHomeStats),
    awayStats: Object.values(sumAwayStats),
    pogPlayerId: bestPogId
  };
}

