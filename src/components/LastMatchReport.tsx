import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Activity, Eye, DollarSign, Target, Shield, Compass, Swords, Loader2, Sparkles, Flame } from 'lucide-react';
import { motion } from 'motion/react';

export const LastMatchReport: React.FC<{ layoutMode?: 'widget' | 'full' }> = ({ layoutMode = 'full' }) => {
  const { lastMatchResult, teams, players } = useGameStore();

  if (!lastMatchResult) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card/40 backdrop-blur-md border border-border rounded-2xl text-muted-foreground font-mono text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] h-full">
        <div className="relative mb-4">
          <Activity size={40} className="text-primary/70 animate-pulse drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
          <Compass size={20} className="text-primary/50 absolute -top-1 -right-2 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <p className="font-extrabold text-sm text-foreground">데이터를 분석하는 중입니다...</p>
        <p className="text-[10px] mt-1.5 text-muted-foreground">일정을 진행하여 새로운 공식 경기 결과를 산출해주십시오.</p>
      </div>
    );
  }

  const { homeTeamId, awayTeamId, winnerId, score, homeStats, awayStats, pogPlayerId } = lastMatchResult;
  const homeTeam = teams.find(t => t.id === homeTeamId);
  const awayTeam = teams.find(t => t.id === awayTeamId);
  const pogPlayer = players.find(p => p.id === pogPlayerId);

  const homeWon = winnerId === homeTeamId;
  const awayWon = winnerId === awayTeamId;

  // Compute total stats
  const homeKills = homeStats.reduce((sum: number, s: any) => sum + s.kills, 0);
  const awayKills = awayStats.reduce((sum: number, s: any) => sum + s.kills, 0);
  
  const homeGold = homeStats.reduce((sum: number, s: any) => sum + s.gold, 0);
  const awayGold = awayStats.reduce((sum: number, s: any) => sum + s.gold, 0);

  const isWidget = layoutMode === 'widget';

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-4 md:p-5 flex flex-col gap-5 h-full overflow-y-auto scrollbar-thin shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/60 pb-3 gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 px-2.5 bg-primary/20 text-primary border border-primary/30 rounded font-mono text-xs font-black shadow-[inset_0_0_5px_rgba(var(--primary),0.2)]">
            REPORT
          </div>
          <h2 className="text-xs sm:text-sm font-black font-mono tracking-wider text-foreground drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
            인게임 모의전 정밀 분석 보고서{isWidget && <br />} {!isWidget && <br className="sm:hidden" />} (MATCH REPORT)
          </h2>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono font-bold shrink-0">UTC SERVER LIVE</span>
      </div>

      {/* Main Score Board */}
      <div className={`bg-background/80 p-4 sm:p-6 rounded-2xl border border-border relative overflow-hidden flex ${isWidget ? 'flex-col gap-4' : 'flex-col lg:flex-row gap-4'} justify-between items-center shadow-inner shadow-black/50`}>
        {/* Ambient Winner background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.05)_0%,transparent_80%)] pointer-events-none" />

        {/* Home Team */}
        <div className={`flex items-center gap-4 flex-1 ${isWidget ? 'justify-between w-full' : 'justify-center lg:justify-end w-full lg:w-auto'} text-right lg:pr-4`}>
          <div className="space-y-1">
            <h3 className={`font-black text-foreground text-base flex flex-wrap items-center gap-1.5 ${isWidget ? 'justify-start text-left' : 'justify-end'}`}>
              {homeTeam?.name}
              {homeWon && (
                <span className="bg-primary/20 text-primary text-[10px] border border-primary/40 font-black px-2 py-0.5 rounded uppercase font-mono tracking-tight shadow-[0_0_10px_rgba(var(--primary),0.3)] shrink-0">
                  WIN
                </span>
              )}
            </h3>
            <p className={`text-[10px] text-muted-foreground font-mono ${isWidget ? 'text-left' : ''}`}>구단 전투력: {homeTeam?.tier} Tier</p>
            <p className={`text-[10px] text-muted-foreground/80 font-mono ${isWidget ? 'text-left' : ''}`}>시너지 격돌률: 100%</p>
          </div>
          <span className="text-4xl p-2 bg-background rounded-xl border border-border shadow-inner shadow-black/50 select-none shrink-0">
            {homeTeam?.logo}
          </span>
        </div>

        {/* Center Versum Scoreboard */}
        <div className={`flex flex-col items-center px-4 md:px-8 text-center shrink-0 ${isWidget ? 'border-y border-border/50 py-4 w-full' : 'border-y lg:border-y-0 lg:border-x border-border/50 py-3 lg:py-0 w-full lg:w-auto'} z-10`}>
          <span className="text-[9px] text-muted-foreground font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
            <Flame size={10} className="text-primary drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]" /> FINAL MATCH SCORE
          </span>
          <div className="flex items-center gap-4 text-3xl font-black font-mono">
            <span className={homeWon ? 'text-primary font-black scale-105 drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]' : 'text-muted-foreground font-bold'}>{score.home}</span>
            <span className="text-muted-foreground/50 text-xl font-normal">:</span>
            <span className={awayWon ? 'text-primary font-black scale-105 drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]' : 'text-muted-foreground font-bold'}>{score.away}</span>
          </div>
          {pogPlayer && (
            <div className="mt-2.5 inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-tight leading-none shadow-[0_0_5px_rgba(251,191,36,0.2)] max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              <Trophy size={9} className="shrink-0" /> {pogPlayer.summonerName} (POG)
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center gap-4 flex-1 ${isWidget ? 'justify-between w-full flex-row-reverse' : 'justify-center lg:justify-start w-full lg:w-auto text-left lg:pl-4'}`}>
          <div className="space-y-1 text-right lg:text-left">
            <h3 className={`font-black text-foreground text-base flex flex-wrap items-center gap-1.5 ${isWidget ? 'justify-end' : 'justify-start'}`}>
              {awayWon && (
                <span className="bg-primary/20 text-primary text-[10px] border border-primary/40 font-black px-2 py-0.5 rounded uppercase font-mono tracking-tight shadow-[0_0_10px_rgba(var(--primary),0.3)] shrink-0">
                  WIN
                </span>
              )}
              {awayTeam?.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">구단 전투력: {awayTeam?.tier} Tier</p>
            <p className="text-[10px] text-muted-foreground/80 font-mono">시너지 격돌률: 100%</p>
          </div>
          <span className="text-4xl p-2 bg-background rounded-xl border border-border shadow-inner shadow-black/50 select-none shrink-0">
            {awayTeam?.logo}
          </span>
        </div>
      </div>

      {/* Aggregate Match Highlights mini bar */}
      <div className="grid grid-cols-2 gap-4 bg-background/50 border border-border rounded-xl p-3 text-xs font-mono shadow-inner shadow-black/20">
        <div className="flex flex-col gap-1 items-center justify-center border-r border-border/50">
          <span className="text-[9px] text-muted-foreground uppercase font-black drop-shadow-sm">TOTAL SCRIM KILLS</span>
          <div className="flex items-center gap-3 font-black text-sm">
            <span className="text-foreground">{homeKills}</span>
            <span className="text-muted-foreground/60 text-xs font-normal">vs</span>
            <span className="text-foreground">{awayKills}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-center justify-center">
          <span className="text-[9px] text-muted-foreground uppercase font-black font-mono drop-shadow-sm">TOTAL ACCUMULATED GOLD</span>
          <div className="flex items-center gap-3 font-black text-sm text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]">
            <span>{(homeGold / 1000).toFixed(1)}k</span>
            <span className="text-muted-foreground/60 text-xs font-normal">vs</span>
            <span>{(awayGold / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      {/* Duel statistics lists */}
      <div className={`grid grid-cols-1 ${isWidget ? '' : 'xl:grid-cols-2'} gap-5 flex-1 min-h-0`}>
        
        {/* Home Team Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h4 className="text-xs font-mono font-black text-primary uppercase flex items-center gap-1.5 drop-shadow-[0_0_2px_rgba(var(--primary),0.5)] truncate">
              <span className="truncate">{homeTeam?.name} INDIVIDUAL REELS</span>
            </h4>
            <span className="text-[9px] text-muted-foreground font-mono shrink-0">Blue Side</span>
          </div>

          <div className="space-y-2.5">
            {homeStats.map((stat: any) => {
              const isPog = pogPlayerId === stat.playerId;
              const kda = stat.deaths === 0 ? (stat.kills + stat.assists) * 1.5 : parseFloat(((stat.kills + stat.assists) / stat.deaths).toFixed(2));
              
              const getKdaColor = (val: number) => {
                if (val >= 5) return 'text-primary font-extrabold drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]';
                if (val >= 3) return 'text-emerald-400 font-extrabold drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]';
                return 'text-muted-foreground/80';
              };

              return (
                <div 
                  key={stat.playerId} 
                  className={`p-3 rounded-xl border transition-all ${
                    isPog 
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]' 
                      : 'bg-background/80 border-border shadow-inner shadow-black/20'
                  }`}
                >
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-border/50 flex-nowrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span className={`text-[9px] font-black w-14 shrink-0 text-center py-0.5 rounded font-mono ${
                        stat.role === 'MID' ? 'bg-primary/20 text-primary border border-primary/40' :
                        stat.role === 'TOP' ? 'bg-primary/20 text-primary border border-primary/40' :
                        stat.role === 'JUNGLE' ? 'bg-primary/20 text-primary border border-primary/40' :
                        stat.role === 'ADC' ? 'bg-primary/20 text-primary border border-primary/40' :
                        'bg-primary/20 text-primary border border-primary/40'
                      } shadow-inner shadow-black/40`}>
                        {stat.role}
                      </span>
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-xs text-foreground flex items-center gap-1 truncate w-full">
                          <span className="truncate">{stat.summonerName}</span>
                          {isPog && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black px-1.5 py-0.2 rounded-sm uppercase tracking-wide drop-shadow-[0_0_2px_rgba(251,191,36,0.5)] shrink-0">
                              MVP
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase font-semibold truncate">{stat.championName}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-muted-foreground block uppercase font-mono font-bold tracking-tight">KDA</span>
                      <span className={`text-xs font-mono font-bold ${getKdaColor(kda)}`}>
                        {stat.kills} / {stat.deaths} / {stat.assists}
                      </span>
                    </div>
                  </div>

                  {/* Attributes and progress values */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="bg-background/90 p-1.5 rounded border border-border flex flex-col justify-between shadow-inner shadow-black/20">
                      <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-0.5"><DollarSign size={8} /> Golden</span>
                      <b className="text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]">{(stat.gold / 1000).toFixed(1)}k</b>
                    </div>
                    <div className="bg-background/90 p-1.5 rounded border border-border flex flex-col justify-between shadow-inner shadow-black/20">
                      <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-0.5"><Eye size={8} /> Vision</span>
                      <b className="text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">{stat.visionScore}</b>
                    </div>
                    <div className="bg-background/90 p-1.5 rounded border border-border flex flex-col justify-between shadow-inner shadow-black/20">
                      <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-0.5"><Target size={8} /> Minions</span>
                      <b className="text-foreground">{stat.cs} CS</b>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Away Team Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-destructive/30 pb-2">
             <h4 className="text-xs font-mono font-black text-destructive uppercase flex items-center gap-1.5 drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)] truncate">
              <span className="truncate">{awayTeam?.name} INDIVIDUAL REELS</span>
            </h4>
            <span className="text-[9px] text-muted-foreground font-mono shrink-0">Red Side</span>
          </div>

          <div className="space-y-2.5">
            {awayStats.map((stat: any) => {
              const isPog = pogPlayerId === stat.playerId;
              const kda = stat.deaths === 0 ? (stat.kills + stat.assists) * 1.5 : parseFloat(((stat.kills + stat.assists) / stat.deaths).toFixed(2));
              
              const getKdaColor = (val: number) => {
                if (val >= 5) return 'text-destructive font-extrabold drop-shadow-[0_0_5px_rgba(var(--destructive),0.8)]';
                if (val >= 3) return 'text-emerald-400 font-extrabold drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]';
                return 'text-muted-foreground/80';
              };

              return (
                <div 
                  key={stat.playerId} 
                  className={`p-3 rounded-xl border transition-all ${
                    isPog 
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]' 
                      : 'bg-background/80 border-border shadow-inner shadow-black/20'
                  }`}
                >
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-border/50 flex-nowrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span className={`text-[9px] font-black w-14 shrink-0 text-center py-0.5 rounded font-mono ${
                          stat.role === 'MID' ? 'bg-destructive/20 text-destructive border border-destructive/40' :
                          stat.role === 'TOP' ? 'bg-destructive/20 text-destructive border border-destructive/40' :
                          stat.role === 'JUNGLE' ? 'bg-destructive/20 text-destructive border border-destructive/40' :
                          stat.role === 'ADC' ? 'bg-destructive/20 text-destructive border border-destructive/40' :
                          'bg-destructive/20 text-destructive border border-destructive/40'
                        } shadow-inner shadow-black/40`}>
                        {stat.role}
                      </span>
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-xs text-foreground flex items-center gap-1 truncate w-full">
                          <span className="truncate">{stat.summonerName}</span>
                          {isPog && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black px-1.5 py-0.2 rounded-sm uppercase tracking-wide drop-shadow-[0_0_2px_rgba(251,191,36,0.5)] shrink-0">
                              MVP
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase font-semibold truncate">{stat.championName}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-muted-foreground block uppercase font-mono font-bold tracking-tight">KDA</span>
                      <span className={`text-xs font-mono font-bold ${getKdaColor(kda)}`}>
                        {stat.kills} / {stat.deaths} / {stat.assists}
                      </span>
                    </div>
                  </div>

                  {/* Attributes and progress values */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="bg-background/90 p-1.5 rounded border border-border flex flex-col justify-between shadow-inner shadow-black/20">
                      <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-0.5"><DollarSign size={8} /> Golden</span>
                      <b className="text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]">{(stat.gold / 1000).toFixed(1)}k</b>
                    </div>
                    <div className="bg-background/90 p-1.5 rounded border border-border flex flex-col justify-between shadow-inner shadow-black/20">
                      <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-0.5"><Eye size={8} /> Vision</span>
                      <b className="text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">{stat.visionScore}</b>
                    </div>
                    <div className="bg-background/90 p-1.5 rounded border border-border flex flex-col justify-between shadow-inner shadow-black/20">
                      <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-0.5"><Target size={8} /> Minions</span>
                      <b className="text-foreground">{stat.cs} CS</b>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};


