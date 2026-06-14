import React from 'react';
import { Standing, Team } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface StandingsTabProps {
  standings: Standing[];
  teams: Team[];
  playerTeamId: string;
  selectedRegionStanding: 'LCK' | 'LPL' | 'LEC' | 'LCS';
  setSelectedRegionStanding: (region: 'LCK' | 'LPL' | 'LEC' | 'LCS') => void;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({
  standings,
  teams,
  playerTeamId,
  selectedRegionStanding,
  setSelectedRegionStanding,
}) => {
  return (
    <Card className="flex flex-col flex-1 min-h-0 bg-muted/20 border-border shadow-md overflow-hidden p-0 border-0 rounded-none md:rounded-xl">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-border pb-4 mb-0 pt-4 px-4 md:px-6">
        <div>
          <CardTitle className="text-xl font-black text-rose-455 flex items-center gap-2">
            🏆 리그 통합 순위표 (STANDINGS)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            정규 리그에서 진행되는 실시간 경기 시뮬레이션 및 경기 매치 결과에 따라 다채로운 순위 데이터가 즉각 산출됩니다.
          </CardDescription>
        </div>
        
        <Tabs value={selectedRegionStanding} onValueChange={(v) => setSelectedRegionStanding(v as any)} className="w-full md:w-auto">
          <TabsList className="bg-background shadow-inner shadow-black/50 border border-border p-1 w-full md:w-auto flex">
            {(['LCK', 'LPL', 'LEC', 'LCS'] as const).map(reg => (
              <TabsTrigger
                key={reg}
                value={reg}
                className="text-xs font-black px-4 flex-1 md:flex-none data-[state=active]:bg-rose-600/25 data-[state=active]:text-rose-450 data-[state=active]:shadow-inner"
              >
                {reg}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-w-[650px] m-4 md:m-6 bg-background/80 shadow-inner shadow-black/40 rounded-2xl border border-border overflow-hidden shadow-lg relative">
            
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-6 py-4 text-xs font-mono text-muted-foreground font-bold bg-card/45 uppercase border-b border-border sticky top-0 z-10 backdrop-blur-sm">
              <span className="col-span-1 text-center">순위</span>
              <span className="col-span-4 pl-2">구단 (TEAM)</span>
              <span className="col-span-1 text-center font-bold">승</span>
              <span className="col-span-1 text-center font-bold">패</span>
              <span className="col-span-2 text-center">승률 (WR)</span>
              <span className="col-span-1 text-center font-bold">득실차</span>
              <span className="col-span-2 text-center">최근 5경기 (FORM)</span>
            </div>

            <div className="divide-y divide-border">
              {(() => {
                const regionFiltered = [...standings]
                  .filter(stand => {
                    const t = teams.find(team => team.id === stand.teamId);
                    return (t?.region || 'LCK') === selectedRegionStanding;
                  })
                  .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    if (a.losses !== b.losses) return a.losses - b.losses;
                    return b.gameDiff - a.gameDiff;
                  });

                if (regionFiltered.length === 0) {
                  return (
                    <div className="text-center py-16 text-muted-foreground/80 text-sm font-mono">
                      이 지역 리그에는 순위 정보가 없습니다.
                    </div>
                  );
                }

                return regionFiltered.map((stand, idx) => {
                  const team = teams.find(t => t.id === stand.teamId)!;
                  const isMyTeam = team.id === playerTeamId;
                  const form: string[] = [];
                  const streak: string = '-';
                  const totalPlayed = stand.wins + stand.losses;
                  const winRatio = totalPlayed > 0 
                    ? ((stand.wins / totalPlayed) * 100).toFixed(1) + '%' 
                    : '0.0%';

                  return (
                    <motion.div
                      key={stand.teamId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`grid grid-cols-12 gap-2 px-6 py-4 text-sm items-center transition-all ${
                        isMyTeam 
                          ? 'bg-rose-950/15 border-l-2 border-rose-500 text-rose-200 font-bold' 
                          : 'hover:bg-muted/20 text-muted-foreground'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center font-mono font-black flex justify-center items-center">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-md ${
                          idx === 0 ? 'bg-amber-500/10 text-amber-400 font-extrabold text-sm border border-amber-500/20' :
                          idx === 1 ? 'bg-primary/20 text-primary font-extrabold border border-primary/30' :
                          idx === 2 ? 'bg-amber-700/10 text-amber-600 font-extrabold border border-amber-800/20' :
                          'text-muted-foreground/80 font-bold'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Team logo & Name */}
                      <div className="col-span-4 flex items-center gap-3 font-bold text-foreground pl-2">
                        <span className="text-2xl drop-shadow-md select-none">{team.logo}</span>
                        <div className="flex flex-col truncate">
                          <span className="truncate flex items-center gap-1.5 font-extrabold tracking-wide text-foreground drop-shadow-sm">
                            {team.name}
                            {isMyTeam && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-455 border border-rose-500/35 px-1.5 py-0.2 rounded font-sans scale-90">
                                MY TEAM
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-bold tracking-tight">TIER {team.tier} • FANS {(team.fans / 10000).toLocaleString()}만</span>
                        </div>
                      </div>

                      {/* Wins */}
                      <span className="col-span-1 text-center font-mono font-extrabold text-white text-base">
                        {stand.wins}
                      </span>

                      {/* Losses */}
                      <span className="col-span-1 text-center font-mono text-muted-foreground">
                        {stand.losses}
                      </span>

                      {/* Win Rate */}
                      <div className="col-span-2 text-center font-mono text-xs flex flex-col items-center max-w-[80%] mx-auto">
                        <span className="font-bold text-foreground/90">{winRatio}</span>
                        {totalPlayed > 0 && (
                          <Progress value={(stand.wins / totalPlayed) * 100} className="mt-1 h-1 bg-card" />
                        )}
                      </div>

                      {/* Game Points Diff */}
                      <span className={`col-span-1 text-center font-mono font-extrabold text-xs ${
                        stand.gameDiff > 0 ? 'text-cyan-400' :
                        stand.gameDiff < 0 ? 'text-rose-400' :
                        'text-muted-foreground/80'
                      }`}>
                        {stand.gameDiff > 0 ? `+${stand.gameDiff}` : stand.gameDiff}
                      </span>

                      {/* Recent 5 matches Form & Streak */}
                      <div className="col-span-2 flex items-center justify-center gap-1.5">
                        <div className="flex gap-1">
                          {form.map((res, i) => (
                            <span 
                              key={i} 
                              className={`w-4 h-4 rounded text-[9px] font-mono font-black flex items-center justify-center border ${
                                res === 'W' 
                                  ? 'bg-emerald-950/40 text-emerald-450 border-emerald-850/30' 
                                  : 'bg-rose-955/40 text-rose-455 border-rose-850/30'
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                          {form.length === 0 && (
                            <span className="text-[10px] text-muted-foreground/50 font-mono">-</span>
                          )}
                        </div>

                        {streak !== '-' && (
                          <span className={`ml-1.5 text-[9px] font-black font-mono px-1.5 py-0.5 rounded ${
                            streak.includes('W') 
                              ? 'bg-emerald-500/10 text-emerald-455 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {streak}
                          </span>
                        )}
                      </div>

                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
