import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CHAMPIONS } from '../data/initialData';
import { 
  Trophy, 
  Map, 
  Play, 
  Pause, 
  ChevronsRight, 
  Zap, 
  ArrowLeft, 
  DollarSign, 
  Flame, 
  ChevronRight, 
  Star, 
  AlertCircle,
  BarChart2,
  LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';

export default function MatchViewer() {
  const {
    playerTeamId,
    activeMatch,
    teams,
    players,
    gameState,
    matchSimulationResult,
    resetToOffice
  } = useGameStore();

  // If simulation is loaded, use its values
  const result = matchSimulationResult;
  if (!result || !activeMatch) return null;

  const homeTeam = teams.find(t => t.id === activeMatch.homeTeamId)!;
  const awayTeam = teams.find(t => t.id === activeMatch.awayTeamId)!;
  const isPlayerHome = homeTeam.id === playerTeamId;

  // Real-time ticking playback state
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4 | 99>(2); // 99 means Instant bypass
  const [showScoreboard, setShowScoreboard] = useState(false); // toggle intermediate/final scoreboards
  const [activeTab, setActiveTab] = useState<'GOLD' | 'XP' | 'DPM'>('GOLD');
  const [reportView, setReportView] = useState<'CARDS' | 'ANALYTICS'>('CARDS');

  const logLength = result.log.length;
  const totalMinutes = result.goldDiffHistory.length - 1;

  // Speed mapping (milliseconds per mock game minute)
  const speedDelays = {
    1: 1500,
    2: 700,
    4: 300,
    99: 0
  };

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Tick progression loop
  useEffect(() => {
    if (!isPlaying) return;
    if (currentTick >= totalMinutes) {
      setIsPlaying(false);
      setShowScoreboard(true); // Auto show summary at end
      return;
    }

    if (simSpeed === 99) {
      setCurrentTick(totalMinutes);
      setIsPlaying(false);
      setShowScoreboard(true);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentTick(prev => Math.min(totalMinutes, prev + 1));
    }, speedDelays[simSpeed]);

    return () => clearTimeout(timer);
  }, [isPlaying, currentTick, simSpeed, totalMinutes]);

  // Scroll log panel to bottom when new logs appear
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentTick]);

  // Filter logs relevant up to current simulated minute tick
  const visibleLogs = result.log.filter((logLine: string) => {
    // Parse minute out of log line format (e.g., "12분: [Faker] 선수가...")
    // "경기 시작" has no minute, always visible. "40분: 경기 종료" contains minute
    if (logLine.startsWith('[경기 시작]')) return true;
    if (logLine.startsWith('[밴픽 분석]')) return true;
    
    const minMatch = logLine.match(/^(\d+)분/);
    if (!minMatch) return true;
    
    const logMin = parseInt(minMatch[1], 10);
    return logMin <= currentTick;
  });

  // Calculate stats values matching current simulated tick count
  const currentGoldDiff = result.goldDiffHistory[currentTick] || 0;
  const currentKills = result.killHistory[currentTick] || { home: 0, away: 0 };
  
  // Custom linear interpolation for gradual CS/gold increment animation
  const scaleStatsFactor = totalMinutes > 0 ? (currentTick / totalMinutes) : 1;

  const currentHomeGold = 2500 + Math.round((result.homeStats.reduce((sum: number, s: any) => sum + s.gold, 0) - 2500) * scaleStatsFactor);
  const currentAwayGold = 2500 + Math.round((result.awayStats.reduce((sum: number, s: any) => sum + s.gold, 0) - 2500) * scaleStatsFactor);

  const playerWon = result.winnerId === playerTeamId;

  // Create history up to current tick
  const chartData = Array.from({ length: currentTick + 1 }, (_, idx) => {
    const goldDiff = result.goldDiffHistory[idx] || 0;
    const xpDiff = result.xpDiffHistory ? (result.xpDiffHistory[idx] || 0) : 0;
    return {
      minute: idx,
      goldDiff,
      xpDiff
    };
  });

  const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const dpmData = roles.map(role => {
    const homeP = result.homeStats.find((s: any) => s.role === role)!;
    const awayP = result.awayStats.find((s: any) => s.role === role)!;
    
    const hDPM = Math.round((homeP.dpm || 0) * scaleStatsFactor);
    const aDPM = Math.round((awayP.dpm || 0) * scaleStatsFactor);

    return {
      role,
      [homeTeam.name]: hDPM,
      [awayTeam.name]: aDPM,
      homeSummoner: homeP.summonerName,
      awaySummoner: awayP.summonerName
    };
  });

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isHomeLead = val >= 0;
      const teamLabel = isHomeLead ? homeTeam.name : awayTeam.name;
      const leadText = `${teamLabel} +${(Math.abs(val) / 1000).toFixed(1)}k`;
      
      return (
        <div className="bg-background border border-border p-2.5 rounded-xl font-mono text-[10px] shadow-2xl">
          <p className="font-extrabold text-muted-foreground mb-0.5">{label}분 경과</p>
          <p className={`font-black ${isHomeLead ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]'}`}>
            {unit === 'XP' ? 'EXP 우세:' : '골드 우세:'} {leadText}
          </p>
        </div>
      );
    }
    return null;
  };

  // Find POG details
  const pogPlayer = players.find(p => p.id === result.pogPlayerId);
  const pogTeam = teams.find(t => t.id === pogPlayer?.teamId);

  return (
    <div className="min-h-screen xl:h-screen xl:overflow-hidden bg-background text-foreground flex flex-col justify-between font-sans relative p-3 md:p-4 gap-3 selection:bg-primary/30 selection:text-primary">
      
      {/* Top Header Match Stats Hud */}
      <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-3 md:p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative z-10">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Home team KDA / Gold */}
          <div className="col-span-4 flex items-center gap-3">
            <span className="text-3xl">{homeTeam.logo}</span>
            <div>
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1 font-heading">
                {homeTeam.name}
                {isPlayerHome && (
                  <span className="text-[8px] bg-primary/10 text-primary border border-primary/30 px-1 py-0.5 rounded uppercase font-black">MY</span>
                )}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">GOLD { (currentHomeGold / 1000).toFixed(1) }k</p>
            </div>
          </div>

          {/* Core Central Match Clock & Big Score */}
          <div className="col-span-4 text-center">
            <div className="inline-block text-[9px] bg-background border border-border text-muted-foreground font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-inner shadow-black/40">
              {currentTick >= totalMinutes ? 'MATCH COMPLETE' : `SUMMONER'S RIFT : ${currentTick}분`}
            </div>
            <div className="flex justify-center items-center gap-4 mt-1">
              <span className="text-2xl font-black text-white font-mono drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">{currentKills.home}</span>
              <span className="text-muted-foreground font-mono font-bold text-[10px] bg-background shadow-inner shadow-black/30 px-2 py-0.5 rounded border border-border">KILLS</span>
              <span className="text-2xl font-black text-white font-mono drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">{currentKills.away}</span>
            </div>
          </div>

          {/* Away team KDA / Gold */}
          <div className="col-span-4 flex items-center gap-3 justify-end text-right">
            <div>
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1 justify-end font-heading">
                {!isPlayerHome && (
                  <span className="text-[8px] bg-primary/10 text-primary border border-primary/30 px-1 py-0.5 rounded uppercase font-black">MY</span>
                )}
                {awayTeam.name}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">GOLD { (currentAwayGold / 1000).toFixed(1) }k</p>
            </div>
            <span className="text-3xl">{awayTeam.logo}</span>
          </div>
        </div>

        {/* Small live dynamic Gold Lead indicator strip */}
        <div className="h-1 bg-background rounded-full mt-3 overflow-hidden relative border border-border shadow-inner shadow-black/50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-300"
            style={{
              width: '100%',
              transform: `translateX(${Math.min(50, Math.max(-50, (currentGoldDiff / 10000) * 50)) + '%'})`
            }}
          />
        </div>
        <p className="text-center text-[9px] text-muted-foreground/80 font-mono mt-1 uppercase tracking-widest">
          {currentGoldDiff > 0 
            ? `${homeTeam.name} LEAD +${(currentGoldDiff / 1000).toFixed(1)}k` 
            : currentGoldDiff < 0
              ? `${awayTeam.name} LEAD +${(Math.abs(currentGoldDiff) / 1000).toFixed(1)}k`
              : 'EQUAL SUMMONERS GOLD'
          }
        </p>
      </div>

      {/* REPLAY SCREEN LAYOUT OR FINAL SUMMARY SCOREBOARD PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch">
        
        {/* PLAYBACK STAGE SCREEN (Col Left: 7 spans) */}
        {!showScoreboard ? (
          <div className="lg:col-span-7 bg-card/30 backdrop-blur-sm border border-border rounded-2xl p-3 flex flex-col justify-between h-full min-h-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-border/80 pb-1.5 mb-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground flex items-center gap-1 font-bold">
                <Map size={11} className="text-primary" /> LIVE MATCH RECON commentary feed
              </span>
              
              {/* Speed Controller toggles */}
              <div className="flex gap-1 bg-background p-0.5 border border-border rounded text-[9px] font-mono font-black shadow-inner shadow-black/40">
                {([1, 2, 4, 99] as const).map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      setSimSpeed(speed);
                      setIsPlaying(true);
                    }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      simSpeed === speed 
                        ? 'bg-primary/20 text-primary border border-primary/30 font-black shadow-[0_0_5px_rgba(var(--primary),0.2)]' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {speed === 99 ? 'INSTANT' : `${speed}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE COMMENTARY SCROLLING BOX */}
            <div className="flex-1 bg-background/80 rounded-xl p-3 border border-border overflow-y-auto xl:max-h-[calc(100vh-270px)] space-y-1 mb-2 font-sans text-xs leading-relaxed scrollbar-thin shadow-inner shadow-black/50 relative">
              {visibleLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground/50 opacity-50 animate-pulse text-[10px]">
                  경기가 곧 지연 생중계됩니다...
                </div>
              ) : (
                visibleLogs.map((log, idx) => {
                  const isEnd = log.includes('[경기 종료]');
                  const isAce = log.includes('[에이스!]') || log.includes('[라인전] 미쳤습니다!');
                  const isObj = log.includes('[드래곤') || log.includes('[바론');
                  const isKill = log.includes('처치');
                  const isSteal = log.includes('스틸');

                  // Extract bracketed name, e.g. "12분: [Chovy] 선수가..." -> "Chovy"
                  const nameMatch = log.match(/\[([a-zA-Z0-9가-힣]+)\]\s선수/);
                  let badge = null;
                  if (nameMatch) {
                    const sName = nameMatch[1];
                    const hPlayer = result.homeStats.find((s: any) => s.summonerName === sName);
                    const aPlayer = result.awayStats.find((s: any) => s.summonerName === sName);
                    const playerObj = hPlayer || aPlayer;
                    if (playerObj) {
                      const isH = !!hPlayer;
                      badge = (
                        <span className={`inline-flex items-center gap-1 font-black px-1.5 py-0.5 rounded mr-1 ${isH ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                          <span className="text-[9px] uppercase font-mono bg-background px-1 rounded-sm shadow-inner shadow-black/50">{playerObj.championName.split(' ')[0]}</span>
                          {sName}
                        </span>
                      );
                    }
                  }

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`border-l-4 pl-3 py-1.5 transition-all w-full relative overflow-hidden rounded-r-lg ${
                        isEnd 
                          ? 'border-amber-500 bg-gradient-to-r from-amber-500/20 to-transparent text-amber-300 font-extrabold shadow-[inset_4px_0_10px_rgba(245,158,11,0.1)]' 
                          : isAce || isSteal
                            ? 'border-destructive bg-gradient-to-r from-destructive/20 to-transparent text-white font-black drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]'
                            : isObj
                              ? 'border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-300 font-bold'
                              : isKill
                                ? 'border-primary bg-gradient-to-r from-primary/10 to-transparent text-foreground/90 font-bold'
                                : 'border-border/50 text-muted-foreground'
                      }`}
                    >
                      <div className="flex gap-2 items-start relative z-10">
                        {/* If no badge but has minute block, split it visually */}
                        <span className="flex-1">
                          {badge ? (
                             <>
                               {log.split(nameMatch![0])[0]}
                               {badge}
                               {log.split(nameMatch![0])[1]}
                             </>
                          ) : (
                             log
                          )}
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
              <div ref={logsEndRef} className="h-2" />
            </div>

            {/* Playback action controller buttons */}
            <div className="flex justify-between items-center bg-background shadow-inner shadow-black/50 p-2 rounded-xl border border-border/60 text-xs font-mono">
              <div className="flex gap-1.5 text-muted-foreground text-[9px]">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-card border border-border rounded hover:bg-muted/80 hover:text-white transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  onClick={() => {
                    setCurrentTick(totalMinutes);
                    setIsPlaying(false);
                    setShowScoreboard(true);
                  }}
                  className="p-1 px-2 bg-card border border-border rounded hover:bg-muted/80 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronsRight size={12} /> SKIP TO END
                </button>
              </div>

              <div className="text-muted-foreground/80 text-[9px] uppercase">
                SPEED PRESET: <span className="text-primary font-bold font-mono">{simSpeed === 99 ? 'FAST FORWARD' : `${simSpeed}x`}</span>
              </div>
            </div>
          </div>
        ) : (
          /* FINAL SCOREBOARD & DETAILED REPORT COMPONENT */
          <div className="lg:col-span-7 bg-card/40 backdrop-blur-md border border-border rounded-2xl p-4 flex flex-col justify-between h-full min-h-0 overflow-y-auto xl:max-h-[calc(100vh-230px)] scrollbar-thin shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* Big Victory Badge banner */}
              <div className="text-center py-3 border-b border-border/60 mb-3 bg-background/50 rounded-xl relative overflow-hidden shrink-0 shadow-inner shadow-black/50">
                <div 
                  className="absolute inset-0 opacity-20 filter blur-[40px] pointer-events-none"
                  style={{ backgroundColor: playerWon ? 'var(--primary)' : 'var(--destructive)' }}
                />
                
                <h2 className={`text-2xl md:text-3xl font-extrabold tracking-widest font-heading drop-shadow-md ${playerWon ? 'text-primary' : 'text-destructive font-black'}`}>
                  {playerWon ? '👑 MATCH VICTORY' : '💀 MATCH DEFEAT'}
                </h2>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider mt-0.5">
                  {homeTeam.name} {result.score.home} vs {result.score.away} {awayTeam.name} • 경기 종결 보고서
                </p>
              </div>

              {/* High-tech View Switcher */}
              <div className="flex justify-center gap-2 mb-4 bg-background p-1 border border-border rounded-lg text-xs font-mono shrink-0 shadow-inner shadow-black/40">
                <button
                  type="button"
                  onClick={() => setReportView('CARDS')}
                  className={`flex-1 py-1.5 rounded-md cursor-pointer text-center font-bold tracking-wider transition-all ${
                    reportView === 'CARDS'
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_5px_rgba(var(--primary),0.2)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📊 플레이어 스코어보드 (SCORES)
                </button>
                <button
                  type="button"
                  onClick={() => setReportView('ANALYTICS')}
                  className={`flex-1 py-1.5 rounded-md cursor-pointer text-center font-bold tracking-wider transition-all ${
                    reportView === 'ANALYTICS'
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_5px_rgba(var(--primary),0.2)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📈 경기 전력 및 DPM 분석 (CHARTS)
                </button>
              </div>

              {/* Conditional Views */}
              {reportView === 'CARDS' ? (
                /* Roster Match Scorecards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Home Team scorecard */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-mono text-primary font-bold uppercase border-b border-primary/30 pb-0.5 flex items-center gap-1 drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
                      {homeTeam.name} SCORECARD
                    </h4>
                    <div className="space-y-1 text-[11px] font-mono">
                      {result.homeStats.map((pStat: any) => (
                        <div key={pStat.playerId} className="bg-background/50 p-1.5 rounded-lg border border-border/80 flex justify-between items-center shadow-inner shadow-black/20">
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase font-black tracking-wider block">{pStat.role}</span>
                            <span className="font-extrabold text-foreground">{pStat.summonerName}</span>
                            <span className="text-[9px] text-muted-foreground/80 font-normal ml-1">({pStat.championName.split(' ')[0]})</span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-xs text-white">{pStat.kills}/{pStat.deaths}/{pStat.assists}</span>
                            <span className="text-[8px] text-muted-foreground block">CS {pStat.cs} • { (pStat.gold/1000).toFixed(1) }k</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Team scorecard */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-mono text-destructive font-bold uppercase border-b border-destructive/30 pb-0.5 flex items-center gap-1 drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]">
                      {awayTeam.name} SCORECARD
                    </h4>
                    <div className="space-y-1 text-[11px] font-mono">
                      {result.awayStats.map((pStat: any) => (
                        <div key={pStat.playerId} className="bg-background/50 p-1.5 rounded-lg border border-border/80 flex justify-between items-center shadow-inner shadow-black/20">
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase font-black tracking-wider block">{pStat.role}</span>
                            <span className="font-extrabold text-foreground">{pStat.summonerName}</span>
                            <span className="text-[9px] text-muted-foreground/80 font-normal ml-1">({pStat.championName.split(' ')[0]})</span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-xs text-white">{pStat.kills}/{pStat.deaths}/{pStat.assists}</span>
                            <span className="text-[8px] text-muted-foreground block">CS {pStat.cs} • { (pStat.gold/1000).toFixed(1) }k</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Advanced Analytics visuals */
                <div className="space-y-4">
                  {/* Gold & Experience Area Chart over time */}
                  <div className="bg-background/60 shadow-inner shadow-black/30 border border-border/80 p-3 rounded-xl">
                    <span className="text-[9.5px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 block flex justify-between">
                      <span>GLOBAL LEADS DEVELOPMENT (전체 라운드 골드 • EXP 누적)</span>
                      <span className="text-blue-400 text-[8.5px]">Reference y=0 bounds</span>
                    </span>

                    <div className="w-full h-[180px] bg-background shadow-inner shadow-black/50 p-2 rounded-lg border border-border">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                          <defs>
                            <linearGradient id="fullGoldGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0891b2" stopOpacity={0.35}/>
                              <stop offset="50%" stopColor="#0891b2" stopOpacity={0.02}/>
                              <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.02}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.35}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                          <XAxis dataKey="minute" stroke="#64748b" fontSize={8} />
                          <YAxis stroke="#64748b" fontSize={8} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                          <Area type="monotone" name="골드 주도권" dataKey="goldDiff" stroke="#0891b2" strokeWidth={2} fill="url(#fullGoldGrad)" />
                          <Area type="monotone" name="경험치 주도권" dataKey="xpDiff" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.05} />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Relative Damage Per Minute rankings */}
                  <div className="bg-background/60 shadow-inner shadow-black/30 border border-border/80 p-3 rounded-xl">
                    <span className="text-[9.5px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 block flex justify-between">
                      <span>가해 공격력(DPM) 기여도 순위 (DAMAGE-PER-MINUTE POWERHOUSE RANK)</span>
                      <span className="text-red-400 text-[8.5px]">Home = Blue • Away = Red</span>
                    </span>

                    <div className="w-full h-[220px] bg-background shadow-inner shadow-black/50 p-2 rounded-lg border border-border">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={[
                            ...result.homeStats.map((s: any) => ({ ...s, isHome: true })),
                            ...result.awayStats.map((s: any) => ({ ...s, isHome: false }))
                          ].sort((a, b) => (b.dpm || 0) - (a.dpm || 0))}
                          margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.2} />
                          <XAxis type="number" stroke="#64748b" fontSize={8} />
                          <YAxis 
                            type="category" 
                            dataKey="summonerName" 
                            stroke="#94a3b8" 
                            fontSize={9} 
                            tickLine={false}
                            width={85}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '10px', fontFamily: 'monospace' }}
                            formatter={(value: any, name: any, props: any) => [`${value} DPM (${props.payload.championName})`, '공격 기여도']}
                          />
                          <Bar dataKey="dpm" radius={[0, 4, 4, 0]} barSize={9}>
                            {[
                              ...result.homeStats.map((s: any) => ({ ...s, isHome: true })),
                              ...result.awayStats.map((s: any) => ({ ...s, isHome: false }))
                            ].sort((a, b) => (b.dpm || 0) - (a.dpm || 0)).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isHome ? '#3b82f6' : '#ef4444'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowScoreboard(false)}
              className="mt-3 w-full py-2 bg-background text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-card hover:border-primary/50 transition-all font-mono text-[9px] tracking-widest uppercase cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.3)]"
            >
              ← 경기 시뮬레이션 중계 로그 다시 검토
            </button>
          </div>
        )}

        {/* SIDE BAR: Live Gold, XP, DPM Recharts Analytics Dashboard & POG Card */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-0 gap-3">
          <div className="bg-muted/20 border border-border p-3.5 rounded-xl shadow-md flex-1 min-h-0 flex flex-col justify-between">
            
            {/* Tab switch header */}
            <div className="flex justify-between items-center border-b border-border/80 pb-2 mb-2 shrink-0">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <BarChart2 size={11} className="text-blue-400 animate-pulse" /> 실시간 분석 지표 (LIVE ANALYTICS)
              </span>
              <div className="flex gap-1 bg-background shadow-inner shadow-black/50 p-0.5 border border-border rounded text-[9.5px] font-mono">
                {(['GOLD', 'XP', 'DPM'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      activeTab === tab 
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-black' 
                        : 'text-muted-foreground/80 hover:text-foreground/90'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Recharts Plot area */}
            <div className="bg-background shadow-inner shadow-black/50/70 p-2 rounded-xl border border-border/80 flex justify-center items-center flex-1 min-h-0">
              {totalMinutes > 0 ? (
                <div className="w-full h-full min-h-[150px] relative">
                  {activeTab === 'GOLD' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="liveGoldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.02}/>
                            <stop offset="50%" stopColor="#ef4444" stopOpacity={0.02}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.35}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis 
                          dataKey="minute" 
                          stroke="#4b5563" 
                          fontSize={9} 
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#4b5563" 
                          fontSize={9} 
                          tickLine={false}
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip unit="GOLD" />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                        <Area 
                          type="monotone" 
                          dataKey="goldDiff" 
                          stroke="#0891b2" 
                          strokeWidth={2}
                          fill="url(#liveGoldGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {activeTab === 'XP' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="liveXpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.02}/>
                            <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.02}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.35}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis 
                          dataKey="minute" 
                          stroke="#4b5563" 
                          fontSize={9} 
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#4b5563" 
                          fontSize={9} 
                          tickLine={false}
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip unit="XP" />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                        <Area 
                          type="monotone" 
                          dataKey="xpDiff" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          fill="url(#liveXpGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {activeTab === 'DPM' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dpmData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.3} />
                        <XAxis dataKey="role" stroke="#4b5563" fontSize={9} tickLine={false} />
                        <YAxis stroke="#4b5563" fontSize={9} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '10px', fontFamily: 'monospace' }}
                          formatter={(value: any, name: string, props: any) => {
                            const pName = props.dataKey === homeTeam.name ? props.payload.homeSummoner : props.payload.awaySummoner;
                            return [`${value} DPM [${pName}]`, name];
                          }}
                        />
                        <Bar dataKey={homeTeam.name} fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                        <Bar dataKey={awayTeam.name} fill="#f43f5e" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground/50 text-[10px] font-mono">
                  데이터 집계 준비 중 (PREPARING METRICS...)
                </div>
              )}
            </div>

            {/* Status explanation label */}
            <p className="text-[8.5px] font-mono text-muted-foreground/80 mt-1.5 pl-1 leading-normal shrink-0">
              {activeTab === 'DPM' 
                ? '바 차트 비교 항목은 동일 포지션 상인 각 라이너 간의 가해 공격 DPM 비교율입니다.' 
                : '그래프 기준선 상향 배치는 홈 주도권(+), 하향 배치는 어웨이 주도권(-)을 산출합니다.'
              }
            </p>
          </div>

          {/* Highlight POG Player crown box */}
          {pogPlayer && pogTeam && (
            <div className="bg-gradient-to-br from-card/60 to-amber-900/10 border border-amber-500/20 p-3 rounded-xl relative overflow-hidden flex flex-col justify-between h-[135px] shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              
              {/* Crown back glow watermark */}
              <Star size={50} className="absolute -right-3 -bottom-3 text-amber-500/5 select-none rotate-12" />

              <div>
                <span className="inline-flex items-center gap-1 text-[8.5px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black font-mono px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
                  🏆 Player of the Game (POG)
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl bg-background shadow-inner shadow-black/50 p-1.5 rounded-xl border border-border">{pogTeam.logo}</span>
                  <div>
                    <h3 className="font-extrabold text-foreground drop-shadow-sm flex items-center gap-1 text-xs bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                      {pogPlayer.summonerName}
                    </h3>
                    <p className="text-[9px] text-muted-foreground font-mono italic">
                      {pogTeam.name} • {pogPlayer.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-border/80 flex justify-between items-center text-[9px] font-mono text-muted-foreground">
                <span>POG MVP SCORE CARD MATCH</span>
                <span className="font-black text-amber-400">RATING OVR: {Math.round((pogPlayer.lanePhase + pogPlayer.mechanics + pogPlayer.macro + pogPlayer.teamfight)/4)}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER OFFICE RESET RESOLVER CTA */}
      <div className="bg-card/40 backdrop-blur-md border border-border px-5 py-3 rounded-xl flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 max-w-xl text-[11px] text-muted-foreground leading-normal font-mono">
          <AlertCircle size={16} className="text-primary hidden md:block drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
          <p>
            경기 결과 보고가 완료되면 수입 정산과 팬 지표, Standings 랭킹 점수가 영구적으로 구단 데이터베이스에 최종 기록됩니다. 감독실 복귀 단계를 밟으십시오.
          </p>
        </div>

        <div>
          <motion.button
            id="btn-return-office"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetToOffice}
            className="px-8 py-3.5 rounded-xl font-black bg-primary hover:brightness-110 text-primary-foreground text-sm shadow-[0_0_20px_rgba(var(--primary),0.4)] cursor-pointer flex items-center gap-2 transition-all font-heading"
          >
            정산 완료하고 감독실(Office) 복귀하기 <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
