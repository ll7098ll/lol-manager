import React from 'react';
import { Match, Team, SeasonPhase } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy } from 'lucide-react';

interface BracketTabProps {
  seasonPhase: SeasonPhase;
  playoffsMatches: Match[];
  msiMatches: Match[];
  worldsMatches: Match[];
  playerTeamId: string;
  teams: Team[];
  getTeamName: (id?: string) => string;
  getTeamLogo: (id?: string) => string;
  simulateBracketMatchDirectly: (matchId: string) => void;
  simulateRemainingTournament: () => void;
}

export const BracketTab: React.FC<BracketTabProps> = ({
  seasonPhase,
  playoffsMatches,
  msiMatches,
  worldsMatches,
  playerTeamId,
  teams,
  getTeamName,
  getTeamLogo,
  simulateBracketMatchDirectly,
  simulateRemainingTournament,
}) => {
  const getTeamNameSafe = (id: string) => (id === 'TBD' ? '결정 예정 (TBD)' : getTeamName(id));
  const getTeamLogoSafe = (id: string) => (id === 'TBD' ? '⏳' : getTeamLogo(id));

  const [activeSwissRound, setActiveSwissRound] = React.useState<number>(1);

  const rounds = [1, 2, 3, 4, 5];
  const availableRounds = rounds.filter(r => worldsMatches.some(m => m.id.startsWith(`worlds_swiss_r${r}_`)));
  const latestRound = availableRounds.length > 0 ? Math.max(...availableRounds) : 1;

  React.useEffect(() => {
    if (latestRound > 1) {
      setActiveSwissRound(latestRound);
    }
  }, [latestRound]);

  const getSwissRecords = () => {
    const records: Record<string, { wins: number; losses: number }> = {};
    worldsMatches.forEach(m => {
      if (m.id.startsWith('worlds_swiss_')) {
        if (m.homeTeamId && m.homeTeamId !== 'TBD') {
          records[m.homeTeamId] = { wins: 0, losses: 0 };
        }
        if (m.awayTeamId && m.awayTeamId !== 'TBD') {
          records[m.awayTeamId] = { wins: 0, losses: 0 };
        }
      }
    });
    worldsMatches.forEach(m => {
      if (m.id.startsWith('worlds_swiss_') && m.played && m.winnerId) {
        const loserId = m.winnerId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
        if (records[m.winnerId]) {
          records[m.winnerId].wins++;
        }
        if (loserId && records[loserId]) {
          records[loserId].losses++;
        }
      }
    });
    return records;
  };

  const swissRecords = getSwissRecords();
  const sortedSwissTeams = Object.keys(swissRecords)
    .map(teamId => ({
      teamId,
      wins: swissRecords[teamId].wins,
      losses: swissRecords[teamId].losses,
    }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  const getRoundMatches = (roundNum: number) => {
    return worldsMatches.filter(m => m.id.startsWith(`worlds_swiss_r${roundNum}_`));
  };

  const renderMatchCard = (m: Match, title: string) => {
    if (!m) return null;
    const isPlayerMatch = m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId;
    const homeName = getTeamNameSafe(m.homeTeamId);
    const awayName = getTeamNameSafe(m.awayTeamId);
    const homeLogo = getTeamLogoSafe(m.homeTeamId);
    const awayLogo = getTeamLogoSafe(m.awayTeamId);

    return (
      <div key={m.id} className="bg-card/75 border border-border rounded-xl p-3.5 space-y-2 text-left relative transition-all duration-200 hover:scale-[1.01] hover:border-border-hover shadow">
        <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground">
          <span className="font-bold tracking-wider">{title}</span>
          {isPlayerMatch && (
            <span className="text-rose-450 font-extrabold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px]">
              아군 분석전
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-base">{homeLogo}</span>
              <span className="text-foreground max-w-[130px] truncate">{homeName}</span>
            </div>
            <span className="font-mono font-black text-white">{m.played ? `${m.score?.home}` : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-base">{awayLogo}</span>
              <span className="text-foreground max-w-[130px] truncate">{awayName}</span>
            </div>
            <span className="font-mono font-black text-white">{m.played ? `${m.score?.away}` : '-'}</span>
          </div>
        </div>

        {!m.played && (
          <div className="pt-2 border-t border-border flex justify-end">
            {isPlayerMatch ? (
              <Badge variant="outline" className="text-[9px] text-rose-450 font-bold bg-rose-500/10 border-rose-500/25">사무소 일일 일정에서 밴픽 진행</Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => simulateBracketMatchDirectly(m.id)}
                className="h-5.5 text-[9px] bg-rose-655 hover:bg-rose-500 text-white font-black px-2 py-0 rounded transition-colors"
              >
                AI 시뮬레이션
              </Button>
            )}
          </div>
        )}

        {m.played && m.winnerId && (
          <div className="pt-2 border-t border-border mt-2 text-[10px] font-mono text-muted-foreground/80 flex justify-between items-center">
            <span>구단 전력 점수 가산 합산 완료</span>
            <span>우승 구단: <strong className="text-foreground/90 font-black">{getTeamName(m.winnerId)}</strong></span>
          </div>
        )}
      </div>
    );
  };

  let activeMatches: Match[] = [];
  let tournamentName = '';

  if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
    activeMatches = playoffsMatches;
    tournamentName = seasonPhase === 'SPRING_PLAYOFFS' ? 'LCK Spring Playoffs (더블 엘리미네이션)' : 'LCK Summer Playoffs (더블 엘리미네이션)';
  } else if (seasonPhase === 'MSI') {
    activeMatches = msiMatches;
    tournamentName = 'Mid-Season Invitational (MSI 더블 엘리미네이션)';
  } else if (seasonPhase === 'WORLDS') {
    activeMatches = worldsMatches;
    tournamentName = 'LoL World Championship (Worlds)';
  }

  return (
    <Card className="flex flex-col flex-1 min-h-0 bg-muted/20 border-border shadow-md p-0 overflow-hidden border-0 md:border md:rounded-xl">
      <CardHeader className="flex flex-row flex-wrap gap-4 justify-between items-center border-b border-border pb-4 mb-4 md:mb-6 px-4 md:px-6 pt-4 md:pt-6">
        <div>
          <CardTitle className="text-xl font-black text-rose-455 flex items-center gap-2">
            🏆 실시간 글로벌 토너먼트 대진 홀 (BRACKETS)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">정규 리그의 최정점 순위 경쟁을 거쳐 진출하며, 3판 2선승제 토너먼트를 통해 최종 우승팀을 가립니다.</CardDescription>
        </div>
        <Badge variant="outline" className="bg-background shadow-inner shadow-black/50 border-border text-xs font-mono font-bold text-foreground/90 px-3.5 py-1.5 h-auto">
          CURRENT PHASE: <span className="text-rose-450 font-extrabold uppercase ml-1">{seasonPhase}</span>
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 pb-6">
        {(() => {
          const isPlayerStillInTournament = activeMatches.some(
            m => !m.played && (m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId)
          );

          if (!isPlayerStillInTournament && activeMatches.length > 0) {
            return (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-amber-400 font-mono font-black uppercase tracking-wider block">구단 토너먼트 여정 종결됨</span>
                  <p className="text-xs text-muted-foreground/90 mt-0.5 leading-relaxed">
                    현재 구단은 이번 토너먼트에 참가하지 못했거나 플레이 중 탈락하였습니다. 남은 AI 대진들을 일괄 시뮬레이션하고 다음 시즌(비시즌 스토브리그)으로 스킵 진행할 수 있습니다.
                  </p>
                </div>
                <Button
                  onClick={simulateRemainingTournament}
                  className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0 transition-transform hover:scale-105 active:scale-95"
                >
                  🚀 남은 토너먼트 일괄 진행 (Skip)
                </Button>
              </div>
            );
          }
          return null;
        })()}

        {activeMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/80">
            <Trophy size={48} className="opacity-25 mb-4 animate-bounce text-amber-500" />
            <h4 className="font-extrabold text-white text-base">토너먼트 비활성화 기간</h4>
            <p className="text-xs mt-1.5 max-w-sm">현재 정규시즌 리그전 경기 일정 진행 중입니다. 플레이오프 및 국제전 진출을 위해 달려보세요!</p>
          </div>
        ) : (
          (() => {
            if (seasonPhase === 'SPRING_PLAYOFFS' || seasonPhase === 'SUMMER_PLAYOFFS') {
              const r1m1 = playoffsMatches.find(m => m.id === 'po_r1_m1')!;
              const r1m2 = playoffsMatches.find(m => m.id === 'po_r1_m2')!;
              const r2m1 = playoffsMatches.find(m => m.id === 'po_r2_m1')!;
              const r2m2 = playoffsMatches.find(m => m.id === 'po_r2_m2')!;
              const ubf = playoffsMatches.find(m => m.id === 'po_ub_f')!;
              const lbsf = playoffsMatches.find(m => m.id === 'po_lb_sf')!;
              const lbf = playoffsMatches.find(m => m.id === 'po_lb_f')!;
              const pof = playoffsMatches.find(m => m.id === 'po_f')!;

              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="bg-rose-500/10 text-rose-455 border border-rose-500/30 text-xs font-black px-4 py-1.5 rounded-full inline-block">
                      {tournamentName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-muted/20 p-5 rounded-2xl border border-border">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-mono font-black text-muted-foreground/90 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        1라운드 (포스트시즌 개막전)
                      </h5>
                      {r1m1 && renderMatchCard(r1m1, '준준결승 M1')}
                      {r1m2 && renderMatchCard(r1m2, '준준결승 M2')}
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-mono font-black text-muted-foreground/90 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        2라운드 (더블엘리 개막)
                      </h5>
                      {r2m1 && renderMatchCard(r2m1, '승자조 4강 M1')}
                      {r2m2 && renderMatchCard(r2m2, '승자조 4강 M2')}
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-mono font-black text-muted-foreground/90 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        승자 판막 및 패자 준결승
                      </h5>
                      {ubf && renderMatchCard(ubf, '승자조 결승 (Bo5)')}
                      {lbsf && renderMatchCard(lbsf, '패자조 1라운드(Bo5)')}
                      <div className="pt-4 border-t border-border/40">
                        <h5 className="text-[10px] font-mono font-black text-amber-500 border-b border-border/30 pb-1.5 uppercase tracking-wider text-center mb-3">
                          패자 최종 결선전
                        </h5>
                        {lbf && renderMatchCard(lbf, '패자조 결승 (Bo5)')}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-mono font-black text-amber-500 border-b border-amber-500/30 pb-1.5 uppercase tracking-wider text-center">
                        🏆 그랜드 파이널 🏆
                      </h5>
                      {pof && renderMatchCard(pof, '최종 결승전 (Bo5)')}
                      {pof?.played && pof.winnerId && (
                        <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-4 text-center mt-4">
                          <span className="text-[9px] text-amber-400 font-bold block mb-1">FINAL CHAMPION</span>
                          <span className="text-sm font-black text-white">{getTeamLogo(pof.winnerId)} {getTeamName(pof.winnerId)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (seasonPhase === 'MSI') {
              const findM = (id: string) => msiMatches.find(m => m.id === id);
              const qfs = [findM('msi_qf1'), findM('msi_qf2'), findM('msi_qf3'), findM('msi_qf4')];
              const ubsfs = [findM('msi_ubsf1'), findM('msi_ubsf2')];
              const lbr1s = [findM('msi_lbr1_1'), findM('msi_lbr1_2')];
              const ubf = findM('msi_ubf');
              const lbr2s = [findM('msi_lbr2_1'), findM('msi_lbr2_2')];
              const lbr3 = findM('msi_lbr3');
              const lbf = findM('msi_lbf');
              const f = findM('msi_f');

              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-black px-4 py-1.5 rounded-full inline-block">
                      {tournamentName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="bg-muted/15 p-4 rounded-2xl border border-border space-y-4">
                      <h4 className="text-xs font-black text-indigo-400 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        승자조 대진 (Upper Bracket)
                      </h4>
                      <div className="space-y-3">
                        <span className="text-[10px] text-muted-foreground block font-bold text-center">8강 1라운드 (Bo3)</span>
                        {qfs.map((q, i) => q && renderMatchCard(q, `승자조 8강 - M${i+1}`))}
                      </div>
                      <div className="pt-4 border-t border-border/40 space-y-3">
                        <span className="text-[10px] text-muted-foreground block font-bold text-center">4강 준결승전 (Bo5)</span>
                        {ubsfs.map((ub, i) => ub && renderMatchCard(ub, `승자조 준결승 - M${i+1}`))}
                      </div>
                      <div className="pt-4 border-t border-border/40 space-y-3">
                        <span className="text-[10px] text-indigo-400 block font-bold text-center">승자조 결승전 (Bo5)</span>
                        {ubf && renderMatchCard(ubf, '승자조 결승')}
                      </div>
                    </div>

                    <div className="bg-muted/15 p-4 rounded-2xl border border-border space-y-4">
                      <h4 className="text-xs font-black text-rose-455 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        패자조 대진 (Lower Bracket)
                      </h4>
                      <div className="space-y-3">
                        <span className="text-[10px] text-muted-foreground block font-bold text-center">패자조 1라운드 (Bo3)</span>
                        {lbr1s.map((l1, i) => l1 && renderMatchCard(l1, `패자조 M1 - G${i+1}`))}
                      </div>
                      <div className="pt-4 border-t border-border/40 space-y-3">
                        <span className="text-[10px] text-muted-foreground block font-bold text-center">패자조 2라운드 (Bo5)</span>
                        {lbr2s.map((l2, i) => l2 && renderMatchCard(l2, `패자조 M2 - G${i+1}`))}
                      </div>
                      <div className="pt-4 border-t border-border/40 space-y-3">
                        <span className="text-[10px] text-muted-foreground block font-bold text-center">패자조 3라운드 (Bo5)</span>
                        {lbr3 && renderMatchCard(lbr3, '패자조 3R 결정전')}
                      </div>
                    </div>

                    <div className="bg-muted/15 p-4 rounded-2xl border border-border space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-amber-400 border-b border-border pb-1.5 uppercase tracking-wider text-center mb-4">
                          최종 결정전 (Finals)
                        </h4>
                        <div className="space-y-4">
                          <span className="text-[10px] text-rose-455 block font-black uppercase text-center tracking-widest bg-rose-500/5 py-1 rounded">패자조 최종 결선전 (Bo5)</span>
                          {lbf && renderMatchCard(lbf, '패자 최종 결승전')}
                        </div>
                        <div className="mt-8 pt-6 border-t border-border space-y-4">
                          <span className="text-xs text-amber-400 block font-black uppercase text-center tracking-widest bg-amber-500/5 py-1.5 rounded">👑 MSI 그랜드 파이널 (Bo5) 👑</span>
                          {f && renderMatchCard(f, 'MSI 최종 결승')}
                        </div>
                      </div>

                      {f?.played && f.winnerId && (
                        <div className="bg-gradient-to-tr from-amber-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl p-5 text-center mt-6">
                          <span className="text-[10px] text-amber-300 font-black block uppercase tracking-widest">👑 Mid-Season CHAMPION 👑</span>
                          <span className="text-base font-black text-white mt-1 block">
                            {getTeamLogoSafe(f.winnerId)} {getTeamNameSafe(f.winnerId)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (seasonPhase === 'WORLDS') {
              const qf1 = worldsMatches.find(m => m.id === 'worlds_qf1');
              
              if (!qf1) {
                // Render Swiss Stage Dashboard
                return (
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="bg-rose-500/10 text-rose-455 border border-rose-500/30 text-xs font-black px-4 py-1.5 rounded-full inline-block">
                        월드 챔피언십 스위스 스테이지 (Worlds Swiss Stage - 3승 진출 / 3패 탈락)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left side: Swiss standings table (5 cols) */}
                      <div className="lg:col-span-5 bg-card/45 border border-border p-4 rounded-2xl shadow space-y-3">
                        <h4 className="text-xs font-black text-rose-455 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                          스위스 스테이지 현황판 (Swiss Standings)
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-border text-[9px] font-mono uppercase text-muted-foreground">
                                <th className="py-2 pl-2">순위</th>
                                <th className="py-2">구단</th>
                                <th className="py-2 text-center">승-패</th>
                                <th className="py-2 pr-2 text-right">상태</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {sortedSwissTeams.map((entry, index) => {
                                const team = teams.find(t => t.id === entry.teamId);
                                const isPlayer = entry.teamId === playerTeamId;
                                const status = entry.wins >= 3 
                                  ? 'QUALIFIED' 
                                  : entry.losses >= 3 
                                    ? 'ELIMINATED' 
                                    : 'ACTIVE';

                                return (
                                  <tr key={entry.teamId} className={`hover:bg-muted/10 transition-colors ${isPlayer ? 'bg-primary/5' : ''}`}>
                                    <td className="py-2.5 pl-2 font-mono font-bold">{index + 1}</td>
                                    <td className="py-2.5 font-bold flex items-center gap-1.5 min-w-0">
                                      <span className="text-base shrink-0">{team?.logo || '🛡️'}</span>
                                      <span className="truncate max-w-[100px]">{team?.name || entry.teamId}</span>
                                      {isPlayer && <Badge className="text-[7px] px-1 py-0 bg-primary/20 text-primary border border-primary/30 shrink-0">MY</Badge>}
                                    </td>
                                    <td className="py-2.5 text-center font-mono font-black text-white">{entry.wins}W - {entry.losses}L</td>
                                    <td className="py-2.5 pr-2 text-right">
                                      {status === 'QUALIFIED' && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">8강 진출</span>
                                      )}
                                      {status === 'ELIMINATED' && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">탈락</span>
                                      )}
                                      {status === 'ACTIVE' && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400">경합 중</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right side: Round-by-round pairings (7 cols) */}
                      <div className="lg:col-span-7 bg-card/45 border border-border p-4 rounded-2xl shadow space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-1.5">
                          <h4 className="text-xs font-black text-rose-455 uppercase tracking-wider">
                            라운드별 매치 대진 (Round Pairings)
                          </h4>
                          <div className="flex gap-1 bg-background p-0.5 border border-border rounded text-[9px] font-mono">
                            {availableRounds.map(r => (
                              <button
                                key={`swiss-rd-tab-${r}`}
                                onClick={() => setActiveSwissRound(r)}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                  activeSwissRound === r 
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black' 
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                R{r}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
                          {getRoundMatches(activeSwissRound).length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground/60 text-xs font-mono">
                              대진 생성 대기 중 (WAITING FOR DRAW...)
                            </div>
                          ) : (
                            getRoundMatches(activeSwissRound).map((m, idx) => renderMatchCard(m, `스위스 R${activeSwissRound} - M${idx + 1}`))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const qf2 = worldsMatches.find(m => m.id === 'worlds_qf2');
              const qf3 = worldsMatches.find(m => m.id === 'worlds_qf3');
              const qf4 = worldsMatches.find(m => m.id === 'worlds_qf4');
              const sf1 = worldsMatches.find(m => m.id === 'worlds_sf1');
              const sf2 = worldsMatches.find(m => m.id === 'worlds_sf2');
              const wf = worldsMatches.find(m => m.id === 'worlds_f');

              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="bg-rose-500/10 text-rose-455 border border-rose-500/30 text-xs font-black px-4 py-1.5 rounded-full inline-block">
                      {tournamentName} Knockout Stage (8강 결선 토너먼트)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 p-5 rounded-2xl border border-border">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-mono font-black text-muted-foreground/90 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        8강 준결승 (Quarterfinals - Bo5)
                      </h5>
                      {qf1 && renderMatchCard(qf1, '8강 매치 M1')}
                      {qf2 && renderMatchCard(qf2, '8강 매치 M2')}
                      {qf3 && renderMatchCard(qf3, '8강 매치 M3')}
                      {qf4 && renderMatchCard(qf4, '8강 매치 M4')}
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-mono font-black text-muted-foreground/90 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                        4강 준결승전 (Semifinals - Bo5)
                      </h5>
                      <div className="pt-8 space-y-12">
                        {sf1 && renderMatchCard(sf1, '준결승 4강 M1')}
                        {sf2 && renderMatchCard(sf2, '준결승 4강 M2')}
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-mono font-black text-amber-500 border-b border-border pb-1.5 uppercase tracking-wider text-center">
                          월즈 그랜드 파이널 (Grand Finals)
                        </h4>
                        <div className="pt-24">
                          {wf && renderMatchCard(wf, '월드 챔피언 결정전 (Bo5)')}
                        </div>
                      </div>

                      {wf?.played && wf.winnerId && (
                        <div className="bg-gradient-to-tr from-amber-500/15 to-rose-500/10 border border-amber-500/35 rounded-2xl p-5 text-center mt-6">
                          <Trophy className="mx-auto text-amber-400 animate-bounce mb-2" size={36} />
                          <span className="text-[11px] text-amber-300 font-extrabold block uppercase tracking-widest">🏆 WORLD CHAMPION 🏆</span>
                          <span className="text-lg font-black text-white mt-1.5 block">
                            {getTeamLogoSafe(wf.winnerId)} {getTeamNameSafe(wf.winnerId)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })()
        )}
      </CardContent>
    </Card>
  );
};
