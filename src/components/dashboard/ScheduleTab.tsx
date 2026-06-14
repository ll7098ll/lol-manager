import React from 'react';
import { Match, Team } from '../../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from 'lucide-react';

interface ScheduleTabProps {
  schedule: Match[];
  playoffsMatches?: Match[];
  msiMatches?: Match[];
  worldsMatches?: Match[];
  currentWeek: number;
  scheduleFilterWeek: number;
  setScheduleFilterWeek: (week: number) => void;
  playerTeamId: string;
  teams: Team[];
  getTeamName: (id?: string) => string;
  getTeamLogo: (id?: string) => string;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  schedule,
  playoffsMatches = [],
  msiMatches = [],
  worldsMatches = [],
  currentWeek,
  scheduleFilterWeek,
  setScheduleFilterWeek,
  playerTeamId,
  teams,
  getTeamName,
  getTeamLogo,
}) => {
  const combinedSchedule = [
    ...schedule,
    ...playoffsMatches,
    ...msiMatches,
    ...worldsMatches,
  ];

  const maxWeek = combinedSchedule.length > 0 ? Math.max(...combinedSchedule.map(m => m.week)) : 18;

  const getTeamNameSafe = (id: string) => (id === 'TBD' ? '결정 예정 (TBD)' : getTeamName(id));
  const getTeamLogoSafe = (id: string) => (id === 'TBD' ? '❓' : getTeamLogo(id));

  const getMatchTypeName = (type?: string, boFormat?: string) => {
    const formatSuffix = boFormat ? ` (${boFormat})` : '';
    switch (type) {
      case 'SPRING_REGULAR': return `LCK 스프링 정규시즌${formatSuffix}`;
      case 'SUMMER_REGULAR': return `LCK 서머 정규시즌${formatSuffix}`;
      case 'SPRING_PLAYOFFS': return `LCK 스프링 플레이오프${formatSuffix}`;
      case 'SUMMER_PLAYOFFS': return `LCK 서머 플레이오프${formatSuffix}`;
      case 'MSI': return `Mid-Season Invitational (MSI)${formatSuffix}`;
      case 'WORLDS': return `LoL World Championship (월즈)${formatSuffix}`;
      default: return `공식 경기${formatSuffix}`;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 animate-in fade-in-50 duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-black text-cyan-400 flex items-center gap-2">
            📅 시즌 공식 경기 일정 및 구조 (Season Schedule)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            정규 시즌, 플레이오프, MSI 및 월드 챔피언십(월즈)을 아우르는 전체 시즌 주차별 공식 경기 일정입니다.
          </p>
        </div>
        <Badge variant="outline" className="bg-background shadow-inner shadow-black/50 border-cyan-800/40 text-xs font-mono font-bold text-cyan-400 px-3 py-1.5 h-auto">
          시즌 주차: Week {currentWeek} (Current)
        </Badge>
      </div>

      {/* Week Selector Pagination buttons */}
      <div className="bg-muted/5 border border-border p-2.5 rounded-xl flex flex-col md:flex-row gap-2 items-start md:items-center overflow-hidden">
        <span className="text-xs font-bold text-muted-foreground font-mono tracking-wider ml-1 mr-2 uppercase shrink-0">주차 필터 (Week Filter):</span>
        <div className="flex gap-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-muted-foreground/15">
          {Array.from({ length: maxWeek }, (_, i) => i + 1).map((weekNum) => {
            const isFilterActive = scheduleFilterWeek === weekNum;
            const isCurrentRealWeek = currentWeek === weekNum;
            return (
              <Button
                key={weekNum}
                variant="outline"
                size="sm"
                onClick={() => setScheduleFilterWeek(weekNum)}
                className={`h-8 px-3 font-mono font-black text-xs transition-all relative cursor-pointer shrink-0 snap-start ${
                  isFilterActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/35 shadow-md'
                    : 'bg-background shadow-inner shadow-black/55 border-border text-muted-foreground hover:text-foreground drop-shadow-sm'
                }`}
              >
                Week {weekNum}
                {isCurrentRealWeek && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Match Grid of the selected week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {(() => {
          const selectedWeekSchedule = combinedSchedule.filter(m => m.week === scheduleFilterWeek);
          
          if (selectedWeekSchedule.length === 0) {
            return (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground/80">
                <Calendar size={48} className="opacity-20 mb-4 animate-pulse text-cyan-400" />
                <h4 className="font-extrabold text-white text-base">진정된 일정이 없습니다</h4>
                <p className="text-xs mt-1.5 max-w-sm">해당 주차에 공식 경기 매치 일정이 배정되지 않았습니다.</p>
              </div>
            );
          }

          return selectedWeekSchedule.map((match) => {
            const isMyMatch = match.homeTeamId === playerTeamId || match.awayTeamId === playerTeamId;
            return (
              <div 
                key={match.id} 
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative ${
                  match.played 
                    ? 'bg-muted/20 border-border/60 opacity-60' 
                    : isMyMatch
                      ? 'bg-rose-950/15 border-rose-800/40 ring-1 ring-rose-900/30 shadow-md shadow-rose-950/10'
                      : 'bg-card/60 backdrop-blur-md border-border/40 hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2 text-[10px] font-mono text-muted-foreground/80">
                    <span>{match.played ? '🏁 경기 완료 (Finished)' : '⏳ 매치 대기 중 (Scheduled)'}</span>
                    {isMyMatch && <span className="text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded uppercase">MY MATCH DAY</span>}
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2.5 w-5/12 overflow-hidden flex-wrap sm:flex-nowrap">
                      <span className="text-3xl filter drop-shadow">{getTeamLogoSafe(match.homeTeamId)}</span>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-foreground font-extrabold text-xs sm:text-sm">{getTeamNameSafe(match.homeTeamId)}</span>
                        <span className="text-[9px] font-mono font-bold text-muted-foreground/80">Home Team</span>
                      </div>
                    </div>

                    <div className="w-2/12 text-center text-muted-foreground font-mono text-xs">
                      {match.played ? (
                        <div className="text-rose-455 font-bold text-sm bg-rose-500/10 px-2 py-1 rounded border border-rose-900/20">
                          {match.score?.home}:{match.score?.away}
                        </div>
                      ) : (
                        <span className="bg-background shadow-inner shadow-black/50 px-2 py-0.5 rounded border border-border text-muted-foreground font-bold uppercase tracking-tight">VS</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 w-5/12 justify-end overflow-hidden flex-wrap sm:flex-nowrap">
                      <div className="flex flex-col items-end truncate">
                        <span className="truncate text-foreground font-extrabold text-xs sm:text-sm">{getTeamNameSafe(match.awayTeamId)}</span>
                        <span className="text-[9px] font-mono font-bold text-muted-foreground/80">Away Team</span>
                      </div>
                      <span className="text-3xl filter drop-shadow">{getTeamLogoSafe(match.awayTeamId)}</span>
                    </div>
                  </div>
                </div>

                {!match.played && (
                  <div className="pt-2 border-t border-border/50 mt-2 flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground/80 font-mono">
                      {getMatchTypeName(match.matchType, match.boFormat)}
                    </span>
                    {isMyMatch ? (
                      <Badge variant="outline" className="text-[10px] text-rose-450 font-black bg-rose-500/10 border-rose-500/20 px-2 py-0.5 uppercase tracking-wide">
                        밴픽룸 진입 대기
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/60 font-mono">가상 AI 시뮬레이션 점검</span>
                    )}
                  </div>
                )}

                {match.played && match.winnerId && (
                  <div className="pt-2 border-t border-border mt-2 text-[10px] font-mono text-muted-foreground/80 flex justify-between items-center">
                    <span>{getMatchTypeName(match.matchType, match.boFormat)}</span>
                    <span>우승 구단: <strong className="text-foreground/90 font-black">{getTeamNameSafe(match.winnerId)}</strong></span>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};
