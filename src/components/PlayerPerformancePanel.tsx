import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Player, Match, PlayerMatchStats } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Star, Shield, Zap, Eye, Trophy, ChevronRight, Activity } from 'lucide-react';

interface ChartPoint {
  matchLabel: string;
  matchType: string;
  opponent: string;
  champion: string;
  result: 'WIN' | 'LOSS' | 'N/A';
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  cspm: number;
  gold: number;
  gpm: number;
  visionScore: number;
}

interface PlayerPerformancePanelProps {
  defaultRole?: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  hideRoleSelectors?: boolean;
}

export function PlayerPerformancePanel({ defaultRole, hideRoleSelectors }: PlayerPerformancePanelProps = {}) {
  const { schedule, players, startingLineup, playerTeamId, teams } = useGameStore();

  const [selectedRole, setSelectedRole] = useState<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'>(defaultRole || 'MID');
  const [activeMetric, setActiveMetric] = useState<'KDA' | 'GPM' | 'CSPM' | 'VISION'>('KDA');

  // Sync state if defaultRole is modified
  React.useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    }
  }, [defaultRole]);

  // Find the selected player based on their starting roster role
  const selectedPlayer = useMemo(() => {
    const playerId = startingLineup[selectedRole];
    return players.find(p => p.id === playerId);
  }, [startingLineup, selectedRole, players]);

  // Helper: Find team short code or emoji of team
  const getTeamNameAndLogo = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return { name: 'Unknown', logo: '⚔️' };
    return { name: team.name, logo: team.logo };
  };

  // Generate real stats from the schedule + realistic historical baselines
  const performanceData = useMemo<ChartPoint[]>(() => {
    if (!selectedPlayer) return [];

    const statsList: ChartPoint[] = [];

    // 1. Generate 5 realistic pre-season/historical match entries adjusted to the player's actual attributes
    const p = selectedPlayer;
    const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const rolesMultiplierMap = {
      TOP: { kills: 1.1, deaths: 1.0, assists: 1.0, cs: 9.0, gpm: 1.0, vision: 0.8 },
      JUNGLE: { kills: 0.9, deaths: 0.9, assists: 1.3, cs: 6.2, gpm: 0.9, vision: 1.2 },
      MID: { kills: 1.3, deaths: 1.0, assists: 1.1, cs: 9.2, gpm: 1.1, vision: 0.9 },
      ADC: { kills: 1.4, deaths: 1.1, assists: 0.9, cs: 9.8, gpm: 1.2, vision: 0.7 },
      SUPPORT: { kills: 0.2, deaths: 1.1, assists: 1.8, cs: 1.1, gpm: 0.6, vision: 2.2 }
    };
    
    const mult = rolesMultiplierMap[p.role] || rolesMultiplierMap.MID;

    const baseKills = (p.mechanics / 18) * mult.kills;
    const baseDeaths = (6.5 - (p.mental / 22)) * mult.deaths;
    const baseAssists = (p.teamfight / 15) * mult.assists;
    const baseCS = p.role === 'SUPPORT' ? 30 : (180 + p.lanePhase * 0.9) * (mult.cs / 9.0);
    const baseGold = p.role === 'SUPPORT' ? 7000 : (10500 + p.lanePhase * 30 + p.mechanics * 15) * mult.gpm;
    const baseVision = (15 + p.macro * 0.3) * mult.vision;

    // We build 5 mock historical games
    const mockOpponents = ['blg', 'tes', 'g2', 't1', 'dk'];
    const mockChamps = p.role === 'TOP' ? ['Jax', 'Renekton', 'K\'Sante', 'Gnar', 'Ornn'] :
                        p.role === 'JUNGLE' ? ['Sejuani', 'Lee Sin', 'Viego', 'Maokai', 'Nidalee'] :
                        p.role === 'MID' ? ['Azir', 'Taliyah', 'Orianna', 'Yone', 'LeBlanc'] :
                        p.role === 'ADC' ? ['Zeri', 'Kai\'Sa', 'Aphelios', 'Varus', 'Ezreal'] :
                        ['Rakan', 'Lulu', 'Nautilus', 'Renata', 'Alistar'];

    for (let i = 0; i < 5; i++) {
      const matchSeed = seed + i;
      const wave = Math.sin(matchSeed);
      const isWin = wave > -0.1;
      
      const kills = Math.max(0, Math.round(baseKills + wave * 2));
      const deaths = Math.max(1, Math.round(baseDeaths - wave * 1.5));
      const assists = Math.max(0, Math.round(baseAssists + wave * 3));
      const kda = parseFloat(((kills + assists) / deaths).toFixed(2));
      const cs = Math.max(10, Math.round(baseCS + wave * 25));
      const cspm = parseFloat((cs / 30).toFixed(1));
      const gold = Math.max(4000, Math.round(baseGold + wave * 1500));
      const gpm = parseFloat((gold / 30).toFixed(0));
      const visionScore = Math.max(5, Math.round(baseVision + wave * 8));

      statsList.push({
        matchLabel: `H${i + 1}`,
        matchType: '이전 시즌',
        opponent: mockOpponents[i % mockOpponents.length].toUpperCase(),
        champion: mockChamps[i % mockChamps.length],
        result: isWin ? 'WIN' : 'LOSS',
        kills,
        deaths,
        assists,
        kda,
        cs,
        cspm,
        gold,
        gpm,
        visionScore
      });
    }

    // 2. Fetch and append ACTUAL played matches from the league store!
    const playedMatches = schedule.filter(m => m.played && (m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId));
    
    playedMatches.forEach((match, idx) => {
      const isHome = match.homeTeamId === playerTeamId;
      const teamStats = isHome ? match.homeStats : match.awayStats;
      const playerStats = teamStats?.find(s => s.playerId === p.id);

      const oppId = isHome ? match.awayTeamId : match.homeTeamId;
      const oppInfo = getTeamNameAndLogo(oppId);
      const won = match.winnerId === playerTeamId;

      if (playerStats) {
        const kills = playerStats.kills;
        const deaths = playerStats.deaths;
        const assists = playerStats.assists;
        const kda = parseFloat(((kills + assists) / Math.max(1, deaths)).toFixed(2));
        const cs = playerStats.cs;
        const cspm = parseFloat((cs / 30).toFixed(1));
        const gold = playerStats.gold;
        const gpm = parseFloat((gold / 30).toFixed(0));
        const visionScore = playerStats.visionScore;

        statsList.push({
          matchLabel: `W${match.week}`,
          matchType: 'LCK 정규리그',
          opponent: oppInfo.name,
          champion: playerStats.championName,
          result: won ? 'WIN' : 'LOSS',
          kills,
          deaths,
          assists,
          kda,
          cs,
          cspm,
          gold,
          gpm,
          visionScore
        });
      }
    });

    // Take the last 8 matches for visual clarity
    return statsList.slice(-8);
  }, [selectedPlayer, schedule, playerTeamId, teams]);

  // Compute Averages
  const averages = useMemo(() => {
    if (performanceData.length === 0) return { kda: 0, gpm: 0, cspm: 0, vision: 0 };
    
    const sum = performanceData.reduce((acc, curr) => {
      acc.kda += curr.kda;
      acc.gpm += curr.gpm;
      acc.cspm += curr.cspm;
      acc.vision += curr.visionScore;
      return acc;
    }, { kda: 0, gpm: 0, cspm: 0, vision: 0 });

    const len = performanceData.length;
    return {
      kda: parseFloat((sum.kda / len).toFixed(2)),
      gpm: Math.round(sum.gpm / len),
      cspm: parseFloat((sum.cspm / len).toFixed(1)),
      vision: Math.round(sum.vision / len)
    };
  }, [performanceData]);

  if (!selectedPlayer) {
    return (
      <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center h-[340px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <Activity size={32} className="text-primary animate-pulse mb-3 opacity-60 drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
        <p className="text-xs text-muted-foreground font-mono">기록된 선수단이 없습니다.</p>
      </div>
    );
  }

  // Determine colors based on stats metric
  const chartProps = {
    KDA: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.1)', key: 'kda', label: '평균 KDA Ratio' },
    GPM: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.1)', key: 'gpm', label: '평균 분당 골드 수급 (GPM)' },
    CSPM: { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.1)', key: 'cspm', label: '평균 분당 CS 수급 (CSPM)' },
    VISION: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', key: 'visionScore', label: '평균 시야점수' }
  }[activeMetric];

  return (
    <div id="player-performance-trends-panel" className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-4 flex flex-col gap-3 font-mono select-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      {/* PANEL TITLE */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-primary animate-pulse drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">선수단 개별 성능 트렌드 분석 (PERFORMANCE INSIGHTS)</h3>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold">
          최근 {performanceData.length}경기 실적 연동형 차트
        </span>
      </div>

      {/* LINE-UP TAB SELECTOR */}
      {!hideRoleSelectors && (
        <div className="flex flex-wrap gap-1 p-1 bg-background/80 rounded-xl border border-border shadow-inner shadow-black/40">
          {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const).map(role => {
            const isActive = selectedRole === role;
            const pl = players.find(p => p.id === startingLineup[role]);
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex-1 min-w-[70px] text-center py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.5)] font-black'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <div className="block leading-none text-[8px] opacity-80 drop-shadow-md">{role}</div>
                <div className="truncate mt-0.5 max-w-[80px] mx-auto drop-shadow-md">{pl?.summonerName || 'EMPTY'}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* METRIC CONTROLS */}
      <div className="grid grid-cols-4 gap-1.5 mt-1">
        {[
          { id: 'KDA', label: 'KDA', icon: Trophy, color: 'text-primary', avg: averages.kda },
          { id: 'GPM', label: 'GPM', icon: Zap, color: 'text-amber-400', avg: averages.gpm },
          { id: 'CSPM', label: 'CSPM', icon: Shield, color: 'text-blue-400', avg: averages.cspm },
          { id: 'VISION', label: 'VISION', icon: Eye, color: 'text-emerald-400', avg: averages.vision }
        ].map((metric) => {
          const isActive = activeMetric === metric.id;
          const Icon = metric.icon;
          return (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id as any)}
              className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary/10 border-primary/40 shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                  : 'bg-background/40 border-border hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[9px] font-black text-muted-foreground tracking-wider uppercase">{metric.label}</span>
                <Icon size={11} className={`${metric.color} drop-shadow-[0_0_2px_currentColor]`} />
              </div>
              <div className="mt-1">
                <span className="text-xs font-black text-foreground drop-shadow-md">{metric.avg}</span>
                <span className="text-[8px] text-muted-foreground block">평균</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CHART CANVAS */}
      <div className="bg-background/80 rounded-2xl border border-border p-3 relative shadow-inner shadow-black/40">
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
          <Star size={10} className="text-primary animate-spin drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]" />
          <span className="text-[9px] text-muted-foreground font-bold uppercase">
            {selectedPlayer.summonerName} • {chartProps.label}: <strong className="text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">{averages[activeMetric === 'KDA' ? 'kda' : activeMetric === 'GPM' ? 'gpm' : activeMetric === 'CSPM' ? 'cspm' : 'vision']}</strong>
          </span>
        </div>

        <div className="h-44 w-full mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorMetric-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartProps.stroke} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={chartProps.stroke} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="matchLabel" 
                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 9, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartPoint;
                    const isWin = data.result === 'WIN';
                    return (
                      <div className="bg-background border border-border p-3 rounded-lg shadow-2xl font-mono text-[10px] space-y-1.5 w-44 z-50">
                        <div className="flex justify-between items-center border-b border-border/60 pb-1.5 mb-1">
                          <span className="text-muted-foreground font-bold text-[9px] font-mono">{data.matchType} ({data.matchLabel})</span>
                          <span className={`px-1 rounded text-[8px] font-black ${
                            isWin ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-destructive/20 text-destructive border border-destructive/30'
                          }`}>
                            {data.result}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-muted-foreground">
                          <div>상대팀:</div>
                          <div className="text-right font-bold text-foreground">{data.opponent}</div>
                          
                          <div>챔피언:</div>
                          <div className="text-right text-primary font-bold drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">{data.champion}</div>

                          <div>KDA 스코어:</div>
                          <div className="text-right text-destructive font-bold drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]">{data.kills}/{data.deaths}/{data.assists}</div>

                          <div>GPM / CSPM:</div>
                          <div className="text-right text-amber-400 font-bold drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]">{data.gpm} / {data.cspm}</div>
                          
                          <div>시야점수:</div>
                          <div className="text-right text-emerald-400 font-bold drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">{data.visionScore}점</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={chartProps.key} 
                stroke={chartProps.stroke} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#colorMetric-${activeMetric})`}
                dot={{ r: 3, fill: '#0f172a', stroke: chartProps.stroke, strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: chartProps.stroke, stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
