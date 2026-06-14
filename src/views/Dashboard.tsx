import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { TacticsTab } from '../components/TacticsTab';
import { StaffTab } from '../components/StaffTab';
import { TrainingTab } from '../components/TrainingTab';
import { TransferMarket } from '../components/TransferMarket';
import { formatCurrency } from "../utils/format";
import { 
  Trophy, 
  Calendar, 
  User, 
  ChevronRight, 
  ArrowUp, 
  Zap, 
  Dumbbell, 
  Building2,
  DollarSign, 
  Sparkles,
  AlertCircle,
  Globe,
  Crown,
  Medal,
  Flag,
  BookOpen,
  Users,
  Activity,
  FastForward,
  Scale,
  Layers,
  BarChart2,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../hooks/use-mobile';
import { LastMatchReport } from '../components/LastMatchReport';
import { PlayerPerformancePanel } from '../components/PlayerPerformancePanel';
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Imported split subcomponents
import { OfficeHomeTab } from '../components/dashboard/OfficeHomeTab';
import { RosterTab } from '../components/dashboard/RosterTab';
import { ScheduleTab } from '../components/dashboard/ScheduleTab';
import { StandingsTab } from '../components/dashboard/StandingsTab';
import { BracketTab } from '../components/dashboard/BracketTab';
import { ArchiveTab } from '../components/dashboard/ArchiveTab';

export default function Dashboard() {
  const { 
    players, teams, schedule, currentWeek, currentDate,
    playerTeamId, setGameState, activeMatch, startDraft,
    emails, readEmail, respondToOffer, 
    seasonPhase, playoffsMatches, msiMatches, worldsMatches,
    standings, restRoster,
    trainingPoints, trainPlayerIndividual, coachingActionsLeft,
    simulateBracketMatchDirectly, tactics, changeTactics, coachingStaff, activeStaff,
    academyRookies, hireStaff, fireStaff, hireAcademyRookie, startNextSeason, proceedToNextDay, skipToMatchDay
  } = useGameStore();

  const [officeSubTab, setOfficeSubTab] = useState<'HOME' | 'ROSTER' | 'SCHEDULE' | 'STANDINGS' | 'BRACKET' | 'STOVE_LEAGUE' | 'TACTICS' | 'STAFF' | 'TRAINING' | 'LAST_MATCH' | 'TRENDS' | 'ARCHIVE'>('HOME');
  const [archiveSubTab, setArchiveSubTab] = useState<'WORLDS'|'MSI'|'LCK'|'HALL_OF_FAME'>('WORLDS');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  const [scheduleFilterWeek, setScheduleFilterWeek] = useState(currentWeek);
  const [selectedRegionStanding, setSelectedRegionStanding] = useState<'LCK' | 'LPL' | 'LEC' | 'LCS'>('LCK');
  const [trainingFeedback, setTrainingFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [trainingLoader, setTrainingLoader] = useState<{
    playerId: string;
    programId: string;
    status: 'idle' | 'loading' | 'success' | 'error';
  } | null>(null);
  const [showCapExceededErrorModal, setShowCapExceededErrorModal] = useState(false);
  const [showExpiredWarningModal, setShowExpiredWarningModal] = useState(false);
  const [selectedFamousTeamName, setSelectedFamousTeamName] = useState<string | null>(null);
  const [selectedFamousPlayerName, setSelectedFamousPlayerName] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isMobile = useIsMobile();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [leagueMobileTab, setLeagueMobileTab] = useState<'STANDINGS' | 'SCHEDULE' | 'BRACKET'>('STANDINGS');

  useEffect(() => {
    if (['STANDINGS', 'SCHEDULE', 'BRACKET'].includes(officeSubTab)) {
      setLeagueMobileTab(officeSubTab as any);
    }
  }, [officeSubTab]);

  const myTeam = teams.find(t => t.id === playerTeamId);
  const playerRoster = players.filter(p => p.teamId === playerTeamId);
  const totalRosterSalary = playerRoster.reduce((sum, p) => sum + (p.salary || 0), 0);
  const expiredPlayers = playerRoster.filter(p => p.contractYears <= 0);

  const handleStartNextSeasonClick = () => {
    if (totalRosterSalary > 50000) { // 50억 limit (50,000만)
      setShowCapExceededErrorModal(true);
      return;
    }
    const expired = playerRoster.filter(p => p.contractYears <= 0);
    if (expired.length > 0) {
      setShowExpiredWarningModal(true);
      return;
    }
    startNextSeason();
  };

  useEffect(() => {
    if (playerRoster.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(playerRoster[0].id);
    }
  }, [playerRoster, selectedPlayerId]);

  useEffect(() => {
    setScheduleFilterWeek(currentWeek);
  }, [currentWeek]);

  if (!myTeam) return <div className="text-white p-10 font-bold">오류: 소속팀을 찾을 수 없습니다.</div>;

  const getTeamName = (id?: string) => teams.find(t => t.id === id)?.name || 'Unknown';
  const getTeamLogo = (id?: string) => teams.find(t => t.id === id)?.logo || '🛡️';

  const NavItem = ({ id, icon: Icon, label, alert }: { id: typeof officeSubTab, icon: any, label: string, alert?: boolean }) => (
    <SidebarMenuItem>
      <SidebarMenuButton 
        onClick={() => setOfficeSubTab(id)} 
        isActive={officeSubTab === id}
        className={`transition-all ${officeSubTab === id ? 'bg-primary/20 text-primary font-bold shadow-inner' : 'hover:bg-muted/50 text-muted-foreground'}`}
      >
        <Icon size={18} className={officeSubTab === id ? "drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" : ""} />
        <span className="tracking-wide text-xs">{label}</span>
        {alert && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden w-full selection:bg-rose-500/30">
        
        {/* Floating Training/Coaching Toast Notification */}
        <AnimatePresence>
          {trainingFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 p-4 rounded-xl border flex items-center gap-3 text-xs font-bold leading-normal shadow-[0_8px_30px_rgba(0,0,0,0.6)] z-50 min-w-[320px] max-w-[480px] backdrop-blur-md ${
                trainingFeedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[inset_0_0_20px_rgba(52,211,153,0.15)]'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-450 shadow-[inset_0_0_20px_rgba(244,63,94,0.15)]'
              }`}
            >
              <div className="p-1 rounded-md bg-white/5 shrink-0">
                {trainingFeedback.success ? (
                  <Sparkles size={16} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                ) : (
                  <AlertCircle size={16} className="text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
                )}
              </div>
              <span className="whitespace-pre-wrap flex-1 leading-relaxed">{trainingFeedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SIDEBAR NAVIGATION */}
        {!isMobile && (
          <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50 bg-card/40 backdrop-blur-xl shadow-xl z-20">
            <SidebarHeader className="border-b border-border/50 p-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-rose-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(var(--primary),0.4)] shrink-0">
                  {myTeam.logo}
                </div>
                <div className="flex flex-col truncate group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 transition-all">
                  <span className="font-extrabold text-sm truncate tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{myTeam.name}</span>
                  <span className="text-[9px] font-mono font-medium text-muted-foreground mt-0.5 tracking-widest uppercase flex items-center gap-1">
                    <Globe size={9} /> {myTeam.region} ESPORTS
                  </span>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3 scrollbar-hide">
              <SidebarGroup>
                <div className="mb-2 px-2 text-[10px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest group-data-[collapsible=icon]:hidden">
                  COMMAND CENTER
                </div>
                <SidebarMenu className="gap-1.5">
                  <NavItem id="HOME" icon={Activity} label="지휘 통제실 (Dashboard)" />
                  <NavItem id="ROSTER" icon={Users} label="선수단 주간 훈련 (Roster)" />
                  <NavItem id="TACTICS" icon={Layers} label="팀 매니지먼트 보드 (Tactics)" />
                  <NavItem id="STAFF" icon={User} label="코칭 스태프 (Staff)" />
                  <NavItem id="TRAINING" icon={Dumbbell} label="집중 특훈 코스 (Training)" />
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup className="mt-4">
                <div className="mb-2 px-2 text-[10px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest group-data-[collapsible=icon]:hidden">
                  LEAGUE & OPERATIONS
                </div>
                <SidebarMenu className="gap-1.5">
                  <NavItem id="SCHEDULE" icon={Calendar} label="시즌 경기 일정 (Schedule)" />
                  <NavItem id="STANDINGS" icon={Trophy} label="정규 리그 순위 (Standings)" />
                  <NavItem id="BRACKET" icon={Crown} label="결선 플레이오프 (Brackets)" />
                  <NavItem id="STOVE_LEAGUE" icon={DollarSign} label="이적 시장 & 협상 (Transfer)" />
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/50 p-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 shadow-inner">
                      <User size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex flex-col truncate group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 transition-all">
                      <span className="font-bold text-xs truncate">나 (Manager)</span>
                      <span className="text-[10px] font-mono text-primary font-bold">LV.1 ROOKIE</span>
                    </div>
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        )}

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background via-background to-muted/20">
          
          {/* TOP ACTION BAR */}
          <header className="h-16 shrink-0 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              {!isMobile && (
                <>
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                  <div className="h-4 w-px bg-border/60"></div>
                </>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none mb-1">
                  <strong className="text-xs font-mono text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded shadow-sm">
                    {currentDate.getFullYear()} {seasonPhase.includes('SPRING') ? 'SPRING' : 'SUMMER'} SPLIT
                  </strong>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase flex items-center gap-1">
                    <ChevronRight size={10} /> Week {currentWeek}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground/80 flex items-center gap-1.5">
                  <Globe size={10} /> {seasonPhase.includes('PLAYOFFS') ? '결선 토너먼트 진행 중' : '정규 시즌 진행 중 (Regular Season)'} | {currentDate.toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-0.5">구단 보유 예산</span>
                <span className="text-sm font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] flex items-center gap-1">
                  <DollarSign size={14} /> {formatCurrency(myTeam.budget)}
                </span>
              </div>

              {/* Mobile-only compact budget badge */}
              <div className="flex sm:hidden items-center gap-0.5 text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shadow-sm shrink-0">
                <DollarSign size={10} className="shrink-0" />
                <span>{formatCurrency(myTeam.budget).replace(' 만원', '만')}</span>
              </div>

              {!activeMatch && seasonPhase !== 'STOVE_LEAGUE' && (
                <Button
                  variant="outline"
                  disabled={isAdvancing}
                  onClick={() => {
                    if (isAdvancing) return;
                    setIsAdvancing(true);
                    setTimeout(() => {
                      skipToMatchDay();
                      setIsAdvancing(false);
                    }, 400);
                  }}
                  className="h-10 px-4 sm:px-5 font-black font-mono border-border/80 text-foreground hover:bg-muted/50 hover:text-primary hover:border-primary/40 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 text-xs flex items-center gap-1.5 bg-card/30"
                >
                  <FastForward size={14} className="text-primary animate-pulse" />
                  <span>경기일 즉시진행</span>
                </Button>
              )}
              
              <Button 
                disabled={isAdvancing}
                onClick={() => {
                  if (isAdvancing) return;
                  if (activeMatch) {
                    startDraft();
                  } else if (seasonPhase === 'STOVE_LEAGUE') {
                    handleStartNextSeasonClick();
                  } else {
                    setIsAdvancing(true);
                    setTimeout(() => {
                      proceedToNextDay();
                      setIsAdvancing(false);
                    }, 300);
                  }
                }}
                className={`h-10 px-6 sm:px-8 font-black font-mono transition-all rounded-xl cursor-pointer hover:scale-105 active:scale-95 group relative overflow-hidden shrink-0 text-white
                  ${isAdvancing ? 'opacity-80 scale-95 pointer-events-none' : ''}
                  ${activeMatch 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]' 
                    : seasonPhase === 'STOVE_LEAGUE'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.4)]'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(5,150,105,0.4)]'
                  }
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-wider">
                  {isAdvancing ? (
                    <><Activity size={16} className="animate-spin" /> 진행 중...</>
                  ) : activeMatch ? (
                    <><Zap size={16} className="animate-bounce" /> 밴픽 룸 (DRAFT)</>
                  ) : seasonPhase === 'STOVE_LEAGUE' ? (
                    <>🚀 시즌 시작 (START)</>
                  ) : (
                    <>CONTINUE <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </Button>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className={`flex-1 overflow-auto p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent ${isMobile ? 'pb-24' : ''}`}>
            {isMobile && ['STANDINGS', 'SCHEDULE', 'BRACKET'].includes(officeSubTab) && (
              <div className="flex gap-1 bg-background p-1 border border-border rounded-xl mb-4 shadow-inner">
                <button
                  onClick={() => {
                    setOfficeSubTab('STANDINGS');
                    setLeagueMobileTab('STANDINGS');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                    officeSubTab === 'STANDINGS'
                      ? 'bg-rose-500/15 text-rose-450 border-rose-500/25 shadow-sm font-black'
                      : 'text-muted-foreground border-transparent'
                  }`}
                >
                  순위표
                </button>
                <button
                  onClick={() => {
                    setOfficeSubTab('SCHEDULE');
                    setLeagueMobileTab('SCHEDULE');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                    officeSubTab === 'SCHEDULE'
                      ? 'bg-rose-500/15 text-rose-450 border-rose-500/25 shadow-sm font-black'
                      : 'text-muted-foreground border-transparent'
                  }`}
                >
                  경기일정
                </button>
                <button
                  onClick={() => {
                    setOfficeSubTab('BRACKET');
                    setLeagueMobileTab('BRACKET');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                    officeSubTab === 'BRACKET'
                      ? 'bg-rose-500/15 text-rose-450 border-rose-500/25 shadow-sm font-black'
                      : 'text-muted-foreground border-transparent'
                  }`}
                >
                  플레이오프
                </button>
              </div>
            )}
            {officeSubTab !== 'ARCHIVE' ? (
              <>
                {/* ---------- HOME DASHBOARD TILE ---------- */}
                {officeSubTab === 'HOME' && (
                  <OfficeHomeTab
                    schedule={schedule}
                    currentWeek={currentWeek}
                    playerTeamId={playerTeamId!}
                    teams={teams}
                    myTeam={myTeam}
                    emails={emails}
                    activeEmailId={activeEmailId}
                    setActiveEmailId={setActiveEmailId}
                    readEmail={readEmail}
                    respondToOffer={respondToOffer}
                    standings={standings}
                    selectedRegionStanding={selectedRegionStanding}
                    setSelectedRegionStanding={setSelectedRegionStanding}
                  />
                )}

                {/* ---------- ROSTER TAB ---------- */}
                {officeSubTab === 'ROSTER' && (
                  <RosterTab
                    playerRoster={playerRoster}
                    selectedPlayerId={selectedPlayerId}
                    setSelectedPlayerId={setSelectedPlayerId}
                    restRoster={restRoster}
                    coachingActionsLeft={coachingActionsLeft}
                    trainPlayerIndividual={trainPlayerIndividual}
                    trainingLoader={trainingLoader}
                    setTrainingLoader={setTrainingLoader}
                    setTrainingFeedback={setTrainingFeedback}
                  />
                )}

                {/* ---------- SCHEDULE TAB ---------- */}
                {officeSubTab === 'SCHEDULE' && (
                  <ScheduleTab
                    schedule={schedule}
                    currentWeek={currentWeek}
                    scheduleFilterWeek={scheduleFilterWeek}
                    setScheduleFilterWeek={setScheduleFilterWeek}
                    playerTeamId={playerTeamId!}
                    teams={teams}
                    getTeamName={getTeamName}
                    getTeamLogo={getTeamLogo}
                  />
                )}

                {/* ---------- STANDINGS TAB ---------- */}
                {officeSubTab === 'STANDINGS' && (
                  <StandingsTab
                    standings={standings}
                    teams={teams}
                    playerTeamId={playerTeamId!}
                    selectedRegionStanding={selectedRegionStanding}
                    setSelectedRegionStanding={setSelectedRegionStanding}
                  />
                )}

                {/* ---------- BRACKET TAB ---------- */}
                {officeSubTab === 'BRACKET' && (
                  <BracketTab
                    seasonPhase={seasonPhase}
                    playoffsMatches={playoffsMatches}
                    msiMatches={msiMatches}
                    worldsMatches={worldsMatches}
                    playerTeamId={playerTeamId!}
                    teams={teams}
                    getTeamName={getTeamName}
                    getTeamLogo={getTeamLogo}
                    simulateBracketMatchDirectly={simulateBracketMatchDirectly}
                  />
                )}

                {/* ---------- STOVE LEAGUE TAB ---------- */}
                {officeSubTab === 'STOVE_LEAGUE' && (
                  <TransferMarket playerTeamId={playerTeamId!} />
                )}

                {/* ---------- TACTICS TAB ---------- */}
                {officeSubTab === 'TACTICS' && (
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                    <TacticsTab tactics={tactics} changeTactics={changeTactics} />
                  </div>
                )}

                {/* ---------- STAFF TAB ---------- */}
                {officeSubTab === 'STAFF' && (
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                    <StaffTab
                      coachingStaff={coachingStaff}
                      activeStaff={activeStaff}
                      academyRookies={academyRookies}
                      playerTeam={myTeam}
                      hireStaff={hireStaff}
                      fireStaff={fireStaff}
                      hireAcademyRookie={hireAcademyRookie}
                    />
                  </div>
                )}

                {/* ---------- TRAINING TAB ---------- */}
                {officeSubTab === 'TRAINING' && (
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                    <TrainingTab playerTeamId={playerTeamId!} />
                  </div>
                )}

                {/* ---------- LAST MATCH TAB ---------- */}
                {officeSubTab === 'LAST_MATCH' && (
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                    <LastMatchReport />
                  </div>
                )}

                {/* ---------- TRENDS TAB ---------- */}
                {officeSubTab === 'TRENDS' && (
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin animate-in fade-in-50 duration-200">
                    <PlayerPerformancePanel />
                  </div>
                )}
              </>
            ) : (
              <ArchiveTab
                archiveSubTab={archiveSubTab}
                setArchiveSubTab={setArchiveSubTab}
                selectedFamousPlayerName={selectedFamousPlayerName}
                setSelectedFamousPlayerName={setSelectedFamousPlayerName}
                selectedFamousTeamName={selectedFamousTeamName}
                setSelectedFamousTeamName={setSelectedFamousTeamName}
                getTeamName={getTeamName}
                getTeamLogo={getTeamLogo}
              />
            )}
          </main>
        </div>
      </div>

      {/* ⚠️ SALARY CAP EXCEED ERROR MODAL */}
      {showCapExceededErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 font-mono select-none">
            <div className="flex items-center gap-2 text-rose-500">
              <Scale size={20} className="animate-bounce" />
              <h3 className="text-xs font-black uppercase tracking-wider">LCK 샐러리 캡 규정 위반</h3>
            </div>
            
            <p className="text-xs text-foreground/90 leading-relaxed">
              현재 구단 선수단의 총 연봉 합산 금액이 LCK 샐러리 캡 공식 한계치인 <strong className="text-rose-450">{formatCurrency(500000)}</strong>을 초과하였습니다!
            </p>

            <div className="p-3 bg-background shadow-inner shadow-black/50 rounded-lg border border-border text-xs">
              <div className="flex justify-between mb-1 text-muted-foreground text-[10px]">
                <span>현재 아군 선수단 총 연봉:</span>
                <strong className="text-rose-400">{formatCurrency(totalRosterSalary)}</strong>
              </div>
              <div className="flex justify-between text-muted-foreground text-[10px]">
                <span>LCK 샐러리 캡 상한선:</span>
                <strong className="text-muted-foreground/80">{formatCurrency(500000)}</strong>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/80 leading-normal">
              이 한도를 초과하면 LCK 사무국에 의해 다음 시즌 로스터 정합성 승인이 보류됩니다. 이적시장에서 고주급 선수를 즉시 방출하거나, 급여가 더 낮고 역량이 탁월한 선수들로 계약 재협상을 거쳐 연봉 총액을 조정해야 진행이 승인됩니다.
            </p>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setShowCapExceededErrorModal(false)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs py-2 cursor-pointer"
              >
                규정 수칙 확인 (확인)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ EXPIRED CONTRACT WARNING MODAL */}
      {showExpiredWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 font-mono select-none">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertCircle size={20} className="animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider">선수단 계약 만료 예정 경고</h3>
            </div>
            
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              시즌 개막 시 계약 연도가 1년 이하로 유지되어 계약이 소급 종료되는 만료 대상 선수가 존재합니다!
            </p>

            <div className="p-3 bg-background shadow-inner shadow-black/50 rounded-lg border border-border/80">
              <span className="text-[10px] text-muted-foreground/80 block mb-1.5 uppercase font-bold">계약 만료 및 FA 전환 예정의 선수 목록:</span>
              <div className="flex flex-wrap gap-1.5">
                {expiredPlayers.map(p => (
                  <span key={p.id} className="px-2 py-0.5 bg-card border border-rose-900 text-rose-400 text-xs rounded font-bold">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal">
              이 선수들을 현재 비시즌 스토브리그 단계에서 재계약 조인하지 않고 그대로 진행할 경우, 공식 일정 출발과 동시에 <strong className="text-rose-400 font-bold">자유계약선수(FA) 신분으로 탈바꿈하여 즉시 구단에서 탈퇴(방출)</strong>하게 됩니다. 계속 시즌 시작을 추진하시겠습니까?
            </p>

            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={() => setShowExpiredWarningModal(false)}
                className="flex-1 bg-background shadow-inner shadow-black/50 hover:bg-card border border-border text-muted-foreground text-[10px] font-bold py-2 rounded-xl cursor-pointer"
              >
                협상하러 가기
              </Button>
              <Button
                onClick={() => {
                  setShowExpiredWarningModal(false);
                  startNextSeason();
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black py-2 rounded-xl cursor-pointer"
              >
                무시하고 시즌 시작
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-30 px-2 shadow-2xl">
          {/* Home */}
          <button
            onClick={() => {
              setOfficeSubTab('HOME');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
              officeSubTab === 'HOME' ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Activity size={18} className={officeSubTab === 'HOME' ? 'drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]' : ''} />
            <span className="text-[10px]">지휘실</span>
          </button>

          {/* Roster */}
          <button
            onClick={() => {
              setOfficeSubTab('ROSTER');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
              officeSubTab === 'ROSTER' ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Users size={18} className={officeSubTab === 'ROSTER' ? 'drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]' : ''} />
            <span className="text-[10px]">선수단</span>
          </button>

          {/* Tactics */}
          <button
            onClick={() => {
              setOfficeSubTab('TACTICS');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
              officeSubTab === 'TACTICS' ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Layers size={18} className={officeSubTab === 'TACTICS' ? 'drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]' : ''} />
            <span className="text-[10px]">전술판</span>
          </button>

          {/* League */}
          <button
            onClick={() => {
              setOfficeSubTab(leagueMobileTab);
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
              ['STANDINGS', 'SCHEDULE', 'BRACKET'].includes(officeSubTab) ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Trophy size={18} className={['STANDINGS', 'SCHEDULE', 'BRACKET'].includes(officeSubTab) ? 'drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]' : ''} />
            <span className="text-[10px]">리그</span>
          </button>

          {/* More */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
              isMoreMenuOpen || ['STAFF', 'TRAINING', 'STOVE_LEAGUE', 'LAST_MATCH', 'TRENDS', 'ARCHIVE'].includes(officeSubTab) ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Menu size={18} className={isMoreMenuOpen || ['STAFF', 'TRAINING', 'STOVE_LEAGUE', 'LAST_MATCH', 'TRENDS', 'ARCHIVE'].includes(officeSubTab) ? 'drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]' : ''} />
            <span className="text-[10px]">더보기</span>
          </button>
        </div>
      )}

      {/* MOBILE MORE MENU DRAWER */}
      <AnimatePresence>
        {isMobile && isMoreMenuOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card border-t border-border rounded-t-3xl p-6 pb-8 space-y-4 max-w-md shadow-2xl relative"
            >
              {/* Pull handle */}
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-2" />

              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-black text-foreground font-heading">🔧 구단 운영 상세 메뉴</h3>
                <button onClick={() => setIsMoreMenuOpen(false)} className="text-muted-foreground hover:text-foreground text-xs font-mono font-bold">✕ 닫기</button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <button
                  onClick={() => {
                    setOfficeSubTab('STAFF');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    officeSubTab === 'STAFF' ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted/30 border-border'
                  }`}
                >
                  <User size={16} /> 코칭 스태프
                </button>

                <button
                  onClick={() => {
                    setOfficeSubTab('TRAINING');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    officeSubTab === 'TRAINING' ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted/30 border-border'
                  }`}
                >
                  <Dumbbell size={16} /> 집중 특훈 코스
                </button>

                <button
                  onClick={() => {
                    setOfficeSubTab('STOVE_LEAGUE');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    officeSubTab === 'STOVE_LEAGUE' ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted/30 border-border'
                  }`}
                >
                  <DollarSign size={16} /> 이적 시장 & 협상
                </button>

                <button
                  onClick={() => {
                    setOfficeSubTab('LAST_MATCH');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    officeSubTab === 'LAST_MATCH' ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted/30 border-border'
                  }`}
                >
                  <Activity size={16} /> 최근 경기 결과
                </button>

                <button
                  onClick={() => {
                    setOfficeSubTab('TRENDS');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    officeSubTab === 'TRENDS' ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted/30 border-border'
                  }`}
                >
                  <BarChart2 size={16} /> 선수 성장 지표
                </button>

                <button
                  onClick={() => {
                    setOfficeSubTab('ARCHIVE');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    officeSubTab === 'ARCHIVE' ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted/30 border-border'
                  }`}
                >
                  <BookOpen size={16} /> 역대 기록 보관소
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SidebarProvider>
  );
}
