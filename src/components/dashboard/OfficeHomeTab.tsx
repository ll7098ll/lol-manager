import React, { useState } from 'react';
import { Match, Team, Email, Standing } from '../../types';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Inbox, Building2, DollarSign, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../utils/format';
import { LastMatchReport } from '../LastMatchReport';
import { LeagueTable } from '../LeagueTable';
import { useIsMobile } from '../../hooks/use-mobile';

interface OfficeHomeTabProps {
  schedule: Match[];
  currentWeek: number;
  playerTeamId: string;
  teams: Team[];
  myTeam: Team;
  emails: Email[];
  activeEmailId: string | null;
  setActiveEmailId: (id: string | null) => void;
  readEmail: (id: string) => void;
  respondToOffer: (id: string, accept: boolean) => void;
  standings: Standing[];
  selectedRegionStanding: 'LCK' | 'LPL' | 'LEC' | 'LCS';
  setSelectedRegionStanding: (region: 'LCK' | 'LPL' | 'LEC' | 'LCS') => void;
}

export const OfficeHomeTab: React.FC<OfficeHomeTabProps> = ({
  schedule,
  currentWeek,
  playerTeamId,
  teams,
  myTeam,
  emails,
  activeEmailId,
  setActiveEmailId,
  readEmail,
  respondToOffer,
  standings,
  selectedRegionStanding,
  setSelectedRegionStanding,
}) => {
  const isMobile = useIsMobile();
  const [homeMobileTab, setHomeMobileTab] = useState<'SUMMARY' | 'INBOX' | 'BOARD'>('SUMMARY');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 auto-rows-auto xl:auto-rows-[160px] gap-4 flex-1 min-h-0">
      
      {isMobile && (
        <div className="flex gap-1 bg-background p-1 border border-border rounded-xl mb-2 shadow-inner col-span-full">
          <button
            onClick={() => setHomeMobileTab('SUMMARY')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
              homeMobileTab === 'SUMMARY'
                ? 'bg-primary/20 text-primary border-primary/30 shadow-sm font-black'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            경기 요약
          </button>
          <button
            onClick={() => setHomeMobileTab('INBOX')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
              homeMobileTab === 'INBOX'
                ? 'bg-primary/20 text-primary border-primary/30 shadow-sm font-black'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            메시지함
          </button>
          <button
            onClick={() => setHomeMobileTab('BOARD')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
              homeMobileTab === 'BOARD'
                ? 'bg-primary/20 text-primary border-primary/30 shadow-sm font-black'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            재무/이사회
          </button>
        </div>
      )}

      {/* Top Left: Next Match Info (5 Cols, 2 Rows) */}
      {(!isMobile || homeMobileTab === 'SUMMARY') && (
        <div className="xl:col-span-5 xl:row-span-2 flex flex-col min-h-[340px] xl:min-h-0 md:col-span-2 col-span-1">
          <Card className="flex-1 min-h-0 flex flex-col bg-card/40 backdrop-blur-md border-border shadow-lg p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-primary/20" />
            <h3 className="text-xs font-mono font-black text-primary flex items-center gap-2 mb-4 tracking-wider uppercase drop-shadow-sm shrink-0">
              <Calendar size={16} /> UPCOMING MATCH
            </h3>
            <div className="flex-1 min-h-0 flex flex-col justify-center gap-3">
              {schedule.filter(m => m.week === currentWeek && (m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId)).length > 0 ? (
                schedule.filter(m => m.week === currentWeek && (m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId)).map(match => {
                  const t1 = teams.find(t => t.id === match.homeTeamId);
                  const t2 = teams.find(t => t.id === match.awayTeamId);
                  const isHome = match.homeTeamId === playerTeamId;
                  const opponent = isHome ? t2 : t1;
                  const winRateProb = isHome ? 58 : 42; 
                  
                  return (
                    <div key={match.id} className="flex flex-col h-full justify-around items-center">
                      <div className="flex w-full justify-between items-center px-4">
                        <div className="flex flex-col items-center gap-3 w-2/5">
                          <span className="text-7xl drop-shadow-2xl">{myTeam.logo}</span>
                          <span className="font-black text-lg tracking-tighter text-foreground">{myTeam.name}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/5">
                          <span className="text-2xl font-black font-mono text-muted-foreground/80 italic">VS</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 w-2/5">
                          <span className="text-7xl drop-shadow-2xl">{opponent?.logo}</span>
                          <span className="font-black text-lg tracking-tighter text-foreground">{opponent?.name}</span>
                        </div>
                      </div>
                      
                      <div className="w-full mt-6 bg-background/50 border border-border p-4 rounded-xl flex flex-col justify-center gap-2 z-10">
                        <div className="flex justify-between text-[10px] font-mono font-bold">
                          <span className="text-emerald-400">WIN PROBABILITY</span>
                          <span>{winRateProb}%</span>
                        </div>
                        <Progress value={winRateProb} className="h-2 bg-muted/60" />
                        <p className="text-[10px] text-muted-foreground mt-1 text-center font-sans tracking-tight">전술 시뮬레이션 결과, 상대팀과의 주도권 싸움이 예상됩니다.</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-xs text-muted-foreground/40 border border-border border-dashed rounded-xl bg-background/30 font-mono gap-2">
                  이번 주 공식 일정이 없습니다.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Top Right: Last Match Report Summary (7 Cols, 2 Rows) */}
      {(!isMobile || homeMobileTab === 'SUMMARY') && (
        <div className="xl:col-span-7 xl:row-span-2 flex flex-col min-h-[400px] xl:min-h-0 md:col-span-2 col-span-1">
          <LastMatchReport layoutMode="widget" />
        </div>
      )}

      {/* Bottom Left: League Table Summary (4 Cols, 2 Rows) */}
      {(!isMobile || homeMobileTab === 'SUMMARY') && (
        <div className="xl:col-span-4 xl:row-span-2 flex flex-col min-h-[300px] xl:min-h-0 md:col-span-2 col-span-1">
          <LeagueTable 
            standings={standings} 
            teams={teams}
            playerTeamId={playerTeamId}
            selectedRegionStanding={selectedRegionStanding}
            setSelectedRegionStanding={setSelectedRegionStanding}
            mode="mini" 
          />
        </div>
      )}

      {/* Bottom Center: Inbox / News Carousel (4 Cols, 2 Rows) */}
      {(!isMobile || homeMobileTab === 'INBOX') && (
        <div className="xl:col-span-4 xl:row-span-2 flex flex-col min-h-[300px] xl:min-h-0 md:col-span-2 col-span-1">
          <Card className="flex-1 min-h-0 flex flex-col bg-card/40 backdrop-blur-md border-border shadow-lg p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            <h3 className="text-xs font-mono font-black text-cyan-400 flex items-center gap-2 mb-4 tracking-wider uppercase drop-shadow-sm shrink-0">
              <Inbox size={16} /> CLUB NEWS & INBOX
            </h3>
            <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 flex flex-col gap-3 py-1">
                {emails.slice().reverse().map(email => (
                  <button 
                    key={email.id}
                    onClick={() => {
                      setActiveEmailId(email.id === activeEmailId ? null : email.id);
                      if (!email.read) readEmail(email.id);
                    }}
                    className={`w-full shrink-0 text-left p-4 rounded-xl border transition-all flex flex-col gap-2 relative z-10 overflow-hidden ${
                      activeEmailId === email.id
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-foreground shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/30'
                        : email.read 
                          ? 'bg-background/60 shadow-inner shadow-black/30 border-border/80 text-muted-foreground hover:bg-card'
                          : 'bg-card border-border text-foreground drop-shadow-md font-bold hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-muted-foreground tracking-tight bg-background px-2 py-0.5 rounded shadow-sm border border-border">{email.sender}</span>
                      {!email.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse" />}
                    </div>
                    <span className="text-xs my-1 leading-relaxed font-black">{email.title}</span>
                    <AnimatePresence mode="popLayout">
                      {activeEmailId === email.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[10px] font-sans text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-border/60 pt-3 mt-1">
                          {email.content}
                          {email.type === 'OFFER' && email.offerDetails?.playerId && !email.read && (
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); respondToOffer(email.id, true); }} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-emerald-950 font-bold text-[10px] h-7">수락</Button>
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); respondToOffer(email.id, false); }} className="border-destructive/30 text-destructive hover:bg-destructive/10 text-[10px] h-7">거절</Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
                {emails.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 text-xs font-mono">
                    <Mail size={32} className="mb-3 opacity-20" />
                    도착한 메시지가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Right: Board & Finance (4 Cols, 2 Rows) */}
      {(!isMobile || homeMobileTab === 'BOARD') && (
        <div className="xl:col-span-4 xl:row-span-2 flex flex-col min-h-[300px] xl:min-h-0 z-10 relative md:col-span-2 col-span-1">
          <Card className="flex-1 flex flex-col bg-card/40 backdrop-blur-md border-border shadow-lg p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mb-10 -mr-10 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
            <h3 className="text-xs font-mono font-black text-amber-400 flex items-center gap-2 mb-4 tracking-wider uppercase drop-shadow-sm">
              <Building2 size={16} /> BOARD & FINANCES
            </h3>
            <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
              <div className="bg-background/50 border border-border p-4 rounded-xl shadow-inner">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-foreground">보드진 신뢰도 (Confidence)</span>
                  <span className="text-lg font-black text-amber-400 font-mono drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">82%</span>
                </div>
                <Progress value={82} className="h-1.5 bg-muted/60" />
                <p className="text-[9px] text-muted-foreground mt-2 font-sans tracking-tight">구단 운영 성과 및 재무 건전성에 대한 임원진 평가입니다.</p>
              </div>
              
              <div className="bg-background/50 border border-border p-4 rounded-xl shadow-inner">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-foreground">이적 예산 (Budget)</span>
                  <span className="text-lg font-black text-emerald-400 font-mono drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] flex items-center gap-0.5">
                    <DollarSign size={16} className="-mt-0.5" /> {formatCurrency(myTeam.budget)}
                  </span>
                </div>
                <Progress value={Math.min(100, (myTeam.budget/1000000)*100)} className="h-1.5 bg-muted/60" />
                <p className="text-[9px] text-muted-foreground mt-2 font-sans tracking-tight">선수 연봉 및 영입 비용으로 즉시 시용 가능한 구단 보유 자금입니다.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};
