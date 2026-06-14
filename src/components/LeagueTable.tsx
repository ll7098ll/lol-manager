import React from 'react';
import { Trophy, Star, ShieldAlert } from 'lucide-react';
import { Team, Standing } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeagueTableProps {
  standings: Standing[];
  teams: Team[];
  playerTeamId: string;
  selectedRegionStanding: 'LCK' | 'LPL' | 'LEC' | 'LCS';
  setSelectedRegionStanding: (region: 'LCK' | 'LPL' | 'LEC' | 'LCS') => void;
  mode?: 'full' | 'mini';
}

export const LeagueTable: React.FC<LeagueTableProps> = ({ 
  standings, 
  teams, 
  playerTeamId, 
  selectedRegionStanding, 
  setSelectedRegionStanding,
  mode = 'full'
}) => {
  const sortedStandings = [...standings]
    .filter(stand => {
      const t = teams.find(team => team.id === stand.teamId);
      const reg = t?.region || 'LCK';
      return reg === selectedRegionStanding;
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.gameDiff - a.gameDiff;
    });

  const displayStandings = React.useMemo(() => {
    if (mode === 'full') return sortedStandings;
    
    // For mini mode, find the player's team index
    const myTeamIdx = sortedStandings.findIndex(s => s.teamId === playerTeamId);
    if (myTeamIdx === -1) return sortedStandings.slice(0, 5); // Fallback
    
    // Try to show up to 5 teams, keeping player team centered if possible
    let startIdx = myTeamIdx - 2;
    let endIdx = myTeamIdx + 3;
    
    if (startIdx < 0) {
      endIdx = Math.min(sortedStandings.length, endIdx - startIdx);
      startIdx = 0;
    } else if (endIdx > sortedStandings.length) {
      startIdx = Math.max(0, startIdx - (endIdx - sortedStandings.length));
      endIdx = sortedStandings.length;
    }
    
    return sortedStandings.slice(startIdx, endIdx);
  }, [sortedStandings, mode, playerTeamId]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20';
      case 2:
        return 'bg-primary/20 text-primary border border-primary/30 font-black';
      case 3:
        return 'bg-amber-700/80 text-white font-black';
      default:
        return 'text-muted-foreground font-mono';
    }
  };

  return (
    <Card className="flex-1 min-h-[250px] xl:min-h-0 flex flex-col bg-card/40 backdrop-blur-md border border-border shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 gap-1 space-y-0 relative z-10">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-primary drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]" />
          <CardTitle className="font-extrabold text-xs uppercase font-mono tracking-wider text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">성적 (STANDINGS)</CardTitle>
        </div>
        
        {mode === 'full' && (
          <div className="flex gap-0.5 bg-background p-0.5 rounded border border-border shadow-inner shadow-black/30">
            {(['LCK', 'LPL', 'LEC', 'LCS'] as const).map(reg => (
              <button
                key={reg}
                onClick={() => setSelectedRegionStanding(reg)}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded transition cursor-pointer ${
                  selectedRegionStanding === reg
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-[inset_0_0_5px_rgba(var(--primary),0.2)]'
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:bg-white/5'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0 pb-4 px-4 overflow-hidden relative z-10">
        <ScrollArea className="h-full bg-background/80 rounded-xl border border-border overflow-hidden relative shadow-inner shadow-black/40">
          <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-[9px] font-mono text-muted-foreground font-bold bg-background/90 uppercase sticky top-0 z-10 backdrop-blur-sm border-b border-border shadow-sm">
            <span className="col-span-2 text-center">순위</span>
            <span className="col-span-4 pl-1">구단명 (TEAM)</span>
            <span className="col-span-3 text-center">승-패 (W-L)</span>
            <span className="col-span-3 text-right pr-2">득실차 (DIFF)</span>
          </div>
          
          <div className="divide-y divide-border">
            {displayStandings.map((stand) => {
              const team = teams.find(t => t.id === stand.teamId)!;
              const isMyTeam = team.id === playerTeamId;
              const rank = sortedStandings.findIndex(s => s.teamId === stand.teamId) + 1;
              
              return (
                <div 
                  key={stand.teamId} 
                  className={`grid grid-cols-12 gap-1 px-3 py-2 text-xs items-center transition-colors relative ${
                    isMyTeam 
                      ? 'bg-primary/10 text-primary font-bold shadow-[inset_0_0_10px_rgba(var(--primary),0.1)]' 
                      : 'text-foreground hover:bg-white/5'
                  }`}
                  style={{
                    borderLeft: isMyTeam ? '3px solid hsl(var(--primary))' : undefined
                  }}
                >
                  {/* Rank bullet/badge */}
                  <div className="col-span-2 flex justify-center">
                    <span className={`w-5 h-5 flex items-center justify-center text-[10px] rounded-md ${getRankBadge(rank)}`}>
                      {rank}
                    </span>
                  </div>
                  
                  {/* Team ID and Emblem */}
                  <div className="col-span-4 flex items-center gap-1.5 font-extrabold text-foreground truncate drop-shadow-sm">
                    <span className="text-base select-none">{team.logo}</span>
                    <span className="truncate flex items-center gap-0.5 text-[11px]">
                      <span>{team.name}</span>
                    </span>
                  </div>
                  
                  {/* Wins and Losses count */}
                  <span className="col-span-3 text-center font-mono text-[11px] text-muted-foreground">
                    <strong className={isMyTeam ? 'text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]' : 'text-foreground'}>{stand.wins}</strong>
                    <span className="text-[10px] text-muted-foreground/60 px-0.5">-</span>
                    <span className="text-muted-foreground">{stand.losses}</span>
                  </span>

                  {/* Point differential */}
                  <span className={`col-span-3 text-right pr-2 font-mono text-[11px] font-extrabold ${
                    stand.gameDiff > 0 ? 'text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]' :
                    stand.gameDiff < 0 ? 'text-destructive drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]' :
                    'text-muted-foreground'
                  }`}>
                    {stand.gameDiff > 0 ? `+${stand.gameDiff}` : stand.gameDiff}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
