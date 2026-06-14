import { formatCurrency } from "../utils/format";
import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowUpDown, 
  UserPlus, 
  UserMinus, 
  DollarSign, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Compass, 
  Coins, 
  TrendingUp, 
  UserCheck, 
  UserX,
  RefreshCw,
  TrendingDown,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface TransferMarketProps {
  playerTeamId: string;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({ playerTeamId }) => {
  const { 
    players, 
    teams, 
    buyPlayer, 
    renewContract, 
    sellPlayer, 
    updateStartingLineup, 
    startingLineup,
    negotiateContractSuccess
  } = useGameStore();

  // State
  const [selectedScoutRole, setSelectedScoutRole] = useState<'ALL' | 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'>('ALL');
  const [selectedScoutRegion, setSelectedScoutRegion] = useState<'ALL' | 'LCK' | 'LPL' | 'LEC' | 'LCS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'OVR_DESC' | 'OVR_ASC' | 'COST_DESC' | 'COST_ASC' | 'AGE_ASC' | 'POTENTIAL_DESC'>('OVR_DESC');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Contract negotiation state machine
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const [negYears, setNegYears] = useState<number>(1);
  const [negSalary, setNegSalary] = useState<number>(0);
  const [negBonus, setNegBonus] = useState<number>(0);
  const [negPatience, setNegPatience] = useState<number>(5);
  const [negMood, setNegMood] = useState<'NEUTRAL' | 'HAPPY' | 'INTERESTED' | 'SKEPTICAL' | 'INSULTED' | 'SIGNED' | 'WALKED_AWAY'>('NEUTRAL');
  const [negMessage, setNegMessage] = useState<string>('');
  const [negIsRenewal, setNegIsRenewal] = useState<boolean>(false);
  const [demandSalary, setDemandSalary] = useState<number>(0);
  const [demandBonus, setDemandBonus] = useState<number>(0);

  // Helper: Show toast notification instead of alert()
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper: Calculate OVR
  const getOvr = (p: Player) => {
    return Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight) / 4);
  };

  const getOvrColor = (ovr: number) => {
    if (ovr >= 88) return 'text-amber-400 bg-amber-500/5 border-amber-500/20';
    if (ovr >= 80) return 'text-purple-400 bg-purple-500/5 border-purple-500/20';
    if (ovr >= 72) return 'text-blue-400 bg-blue-500/5 border-blue-500/20';
    return 'text-muted-foreground bg-muted border-border/50';
  };

  // Helper: Calculate exact buyout fee (stores buyout logic)
  const getBuyoutFee = (p: Player) => {
    const isFreeAgent = p.teamId === 'FA';
    return isFreeAgent ? Math.floor(p.salary * 0.5) : Math.floor(p.salary * 1.5);
  };

  // Current Team and financials
  const myTeam = useMemo(() => teams.find(t => t.id === playerTeamId), [teams, playerTeamId]);
  const playerRoster = useMemo(() => players.filter(p => p.teamId === playerTeamId), [players, playerTeamId]);
  
  // Calculate average OVR of the starting lineup
  const startingStats = useMemo(() => {
    const starters = Object.values(startingLineup)
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => !!p);
    
    if (starters.length === 0) return { avgOvr: 0, totalSalary: 0 };
    const sumOvr = starters.reduce((sum, p) => sum + getOvr(p), 0);
    const totalSal = playerRoster.reduce((sum, p) => sum + p.salary, 0);
    return {
      avgOvr: Math.round(sumOvr / starters.length),
      totalSalary: totalSal
    };
  }, [startingLineup, players, playerRoster]);

  // Handle player contract negotiations
  const startNegotiation = (p: Player, isRenewal: boolean) => {
    const multiplier = isRenewal ? 1.05 : 1.25;
    const initialSalaryDemand = Math.floor(p.salary * multiplier);
    const initialBonusDemand = Math.floor(p.salary * 0.1);
    
    setNegotiatingPlayer(p);
    setNegIsRenewal(isRenewal);
    setNegYears(p.contractYears === 0 ? 1 : Math.max(1, p.contractYears));
    setNegSalary(Math.floor(p.salary * 0.95));
    setNegBonus(0);
    setNegPatience(5);
    setDemandSalary(initialSalaryDemand);
    setDemandBonus(initialBonusDemand);
    setNegMood('NEUTRAL');
    setNegMessage(
      isRenewal 
        ? `안녕하세요 감독님. 제 계약이 끝을 향해가고 있네요. 조건만 만족스럽다면 이 명문 구단 ${myTeam?.name || ''}에서 계속 뛰고 싶습니다.` 
        : `러브콜을 주셔서 대단히 영광입니다. 제 실력과 가치에 부합하는 합리적인 제안과 대우를 기대하겠습니다.`
    );
  };

  const submitOffer = () => {
    if (!negotiatingPlayer) return;

    const bonusAdjustment = negBonus - demandBonus;
    const salaryDiscount = bonusAdjustment > 0 ? Math.floor(bonusAdjustment * 0.15) : 0;
    const adjustedDemandSalary = Math.max(
      Math.floor(negotiatingPlayer.salary * 0.45),
      demandSalary - salaryDiscount
    );

    const buyoutFee = (negIsRenewal || negotiatingPlayer.teamId === 'FA') ? 0 : Math.floor(negotiatingPlayer.salary * 1.5);
    const totalCashNeeded = negBonus + buyoutFee;
    if (myTeam && myTeam.budget < totalCashNeeded) {
      showToast('구단 예산 규모를 초과하여 제안을 송신할 수 없습니다!', 'error');
      return;
    }

    if (negSalary >= adjustedDemandSalary) {
      setNegMood('SIGNED');
      setNegMessage(`정말 정직하고 화끈한 제안이군요! 기쁘게 서명하겠습니다. 감독님의 가르침 아래 리그의 새 역사를 세워보고 싶습니다!`);
    } else {
      const newPatience = negPatience - 1;
      setNegPatience(newPatience);

      if (newPatience <= 0) {
        setNegMood('WALKED_AWAY');
        setNegMessage(`죄송하지만 제가 존중받지 못하는 것 같군요. 성의가 느껴지지 않는 제안에 시간 낭비는 질색입니다. 협상을 파기하겠습니다.`);
      } else {
        const isInsulting = negSalary < adjustedDemandSalary * 0.75;
        if (isInsulting) {
          setNegMood('INSULTED');
          const doubledPatience = Math.max(1, newPatience - 1);
          setNegPatience(doubledPatience);
          setNegMessage(`아무리 샐러리 캡이 급하시더라도 이 가격은 저를 믿고 경기장에 보낼 생각이 없다는 뜻 같군요. 심사숙고 부탁드립니다.`);
        } else {
          setNegMood(negSalary >= adjustedDemandSalary * 0.9 ? 'INTERESTED' : 'SKEPTICAL');
          const difference = adjustedDemandSalary - negSalary;
          const counterNewSalary = Math.max(
            Math.floor(negotiatingPlayer.salary * 0.45),
            Math.floor(adjustedDemandSalary - difference * 0.25)
          );
          setDemandSalary(counterNewSalary);
          setNegMessage(`제안은 감사히 받아 검토했으나, 조금 더 보완이 요구됩니다. 연봉 ${formatCurrency(counterNewSalary)} 선을 보증해주신다면 긍정적으로 마감 지을 가치가 생기겠습니다.`);
        }
      }
    }
  };

  const confirmNegotiationSuccess = () => {
    if (!negotiatingPlayer) return;
    const result = negotiateContractSuccess(
      negotiatingPlayer.id,
      negYears,
      negSalary,
      negBonus,
      negIsRenewal
    );
    if (result.success) {
      showToast(result.message, 'success');
      setNegotiatingPlayer(null);
    } else {
      showToast(result.message, 'error');
    }
  };

  // Filter and sort the transfer pool
  const filteredAndSortedPlayers = useMemo(() => {
    return players
      .filter(p => p.teamId !== playerTeamId) // exclude player's own team
      .filter(p => selectedScoutRole === 'ALL' || p.role === selectedScoutRole)
      .filter(p => {
        if (selectedScoutRegion === 'ALL') return true;
        const otherTeam = teams.find(t => t.id === p.teamId);
        return otherTeam?.region === selectedScoutRegion;
      })
      .filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.summonerName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const ovrA = getOvr(a);
        const ovrB = getOvr(b);
        const costA = getBuyoutFee(a);
        const costB = getBuyoutFee(b);

        switch (sortBy) {
          case 'OVR_DESC':
            return ovrB - ovrA;
          case 'OVR_ASC':
            return ovrA - ovrB;
          case 'COST_DESC':
            return costB - costA;
          case 'COST_ASC':
            return costA - costB;
          case 'AGE_ASC':
            return a.age - b.age;
          case 'POTENTIAL_DESC':
            return (b.potential || 0) - (a.potential || 0);
          default:
            return ovrB - ovrA;
        }
      });
  }, [players, teams, playerTeamId, selectedScoutRole, selectedScoutRegion, searchQuery, sortBy]);

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10, x: 10 }}
            className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.5)] border flex items-center gap-3 backdrop-blur-md max-w-md ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]' 
                : 'bg-destructive/10 border-destructive/40 text-destructive shadow-[inset_0_0_15px_rgba(var(--destructive),0.1)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="text-emerald-400 shrink-0 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" size={20} />
            ) : (
              <AlertCircle className="text-destructive shrink-0 drop-shadow-[0_0_5px_rgba(var(--destructive),0.8)]" size={20} />
            )}
            <div className="text-xs font-semibold leading-tight font-mono whitespace-pre-wrap">{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTBALL MANAGER Roster & Budget Dashboard Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-card/40 backdrop-blur-md border border-border p-3 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="bg-background p-3 rounded-lg border border-border flex justify-between items-center shadow-inner shadow-black/50">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-mono block uppercase">구단 예산</span>
            <span className="text-sm font-black text-emerald-400 font-mono drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">
              {myTeam ? formatCurrency(myTeam.budget) : formatCurrency(0)}
            </span>
          </div>
          <Coins className="text-emerald-500/80 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]" size={18} />
        </div>

        <div className="bg-background p-3 rounded-lg border border-border flex justify-between items-center shadow-inner shadow-black/50">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-mono block uppercase">선수단 규모 (Roster)</span>
            <span className="text-sm font-black text-foreground font-mono">
              {playerRoster.length} / 10 <span className="text-[10px] text-muted-foreground font-normal">선수</span>
            </span>
          </div>
          <UserCheck className="text-blue-500/80 drop-shadow-[0_0_3px_rgba(59,130,246,0.5)]" size={18} />
        </div>

        <div className={`bg-background p-3 rounded-lg border flex justify-between items-center shadow-inner shadow-black/50 ${startingStats.totalSalary > 500000 ? 'border-destructive/40 bg-destructive/10' : 'border-border'}`}>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-mono block uppercase">연봉 총액 / 샐러리 캡</span>
            <span className={`text-sm font-black font-mono ${startingStats.totalSalary > 500000 ? 'text-destructive drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]' : 'text-amber-500 drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]'}`}>
              {(startingStats.totalSalary / 10000).toFixed(1)}억 / 5.0억원
            </span>
          </div>
          <DollarSign className={startingStats.totalSalary > 500000 ? 'text-destructive drop-shadow-[0_0_3px_rgba(var(--destructive),0.5)]' : 'text-amber-500/80 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]'} size={18} />
        </div>

        <div className="bg-background p-3 rounded-lg border border-border flex justify-between items-center shadow-inner shadow-black/50">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-mono block uppercase">주전 평균 전투력</span>
            <span className="text-sm font-black text-cyan-400 font-mono drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">
              OVR {startingStats.avgOvr}
            </span>
          </div>
          <Award className="text-cyan-500/80 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start flex-1 min-h-0 overflow-visible">
        
        {/* LEFT COMPONENT: Global Transfer Scout Pool (col-span-8) */}
        <div className="xl:col-span-8 flex flex-col gap-3 h-full min-h-0 bg-card/40 backdrop-blur-md border border-border rounded-xl p-4 pb-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
            <div>
              <h3 className="text-sm font-extrabold text-cyan-400 flex items-center gap-1.5 font-mono drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">
                🤝 글로벌 이적시장 라이브 홀 (SCOUT DIRECTORY)
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono tracking-tight">FA 및 타지역 이적 매물을 조회하고 영입 타협안을 수립해 스쿼드를 보강하십시오.</p>
            </div>
          </div>

          {/* Detailed Filtering & Search Control Bar */}
          <div className="bg-background p-2.5 rounded-xl border border-border space-y-2.5 shrink-0 shadow-inner shadow-black/50">
            
            <div className="flex flex-col md:flex-row gap-2 items-stretch">
              
              {/* Search bar */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="선수 아이디 또는 본명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground font-mono focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-background/50 border border-border px-2 rounded-lg shrink-0">
                <ArrowUpDown size={12} className="text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-[11px] text-foreground font-bold font-mono focus:outline-none cursor-pointer pr-1 py-1"
                >
                  <option value="OVR_DESC" className="bg-background text-foreground">최고 전투력 순 (Highest OVR)</option>
                  <option value="POTENTIAL_DESC" className="bg-background text-foreground">최대 성숙 잠재력 순 (Potential)</option>
                  <option value="COST_ASC" className="bg-background text-foreground">최저 비용 순 (Lowest Cost)</option>
                  <option value="COST_DESC" className="bg-background text-foreground">최고 이적료 순 (Highest Cost)</option>
                  <option value="AGE_ASC" className="bg-background text-foreground">최연소 유망주 순 (Youngest)</option>
                  <option value="OVR_ASC" className="bg-background text-foreground">최저 기량 순 (Lowest OVR)</option>
                </select>
              </div>

            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-[10px]">
              
              {/* Role filter */}
              <div className="flex items-center gap-1 bg-background/50 p-0.5 rounded-lg border border-border">
                <span className="text-[9px] text-muted-foreground font-mono uppercase px-1.5 font-bold">라인:</span>
                {(['ALL', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedScoutRole(role)}
                    className={`px-2 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-colors ${
                      selectedScoutRole === role
                        ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40 shadow-inner shadow-black/40'
                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Region filter */}
              <div className="flex items-center gap-1 bg-background/50 p-0.5 rounded-lg border border-border">
                <span className="text-[9px] text-muted-foreground font-mono uppercase px-1.5 font-bold">지역:</span>
                {(['ALL', 'LCK', 'LPL', 'LEC', 'LCS'] as const).map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setSelectedScoutRegion(reg)}
                    className={`px-2 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-colors ${
                      selectedScoutRegion === reg
                        ? 'bg-primary/20 text-primary border border-primary/40 shadow-inner shadow-black/40'
                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* Player List Grid container with relative sizing for scroll */}
          <div className="flex-1 overflow-y-auto scrollbar-thin overflow-x-auto space-y-0 relative border border-border/50 rounded-lg bg-background/20 scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
            <table className="w-full text-left text-[11px] font-mono whitespace-nowrap min-w-[595px]">
              <thead className="bg-background/90 sticky top-0 z-20 shadow-sm border-b border-border/80">
                <tr className="text-[10px] uppercase text-muted-foreground">
                  <th className="py-2 px-1.5 font-black tracking-tight w-12 text-center">포지션</th>
                  <th className="py-2 px-1.5 font-black tracking-tight">선수명</th>
                  <th className="py-2 px-1.5 font-black tracking-tight max-w-[124px]">소속팀</th>
                  <th className="py-2 px-1 font-black tracking-tight w-8 text-center border-l border-border/20">나이</th>
                  <th className="py-2 px-1 font-black tracking-tight w-8 text-center border-l border-border/20">POT</th>
                  <th className="py-2 px-1.5 font-black tracking-tight w-24 text-center border-l border-border/20">능력치 (L/M/O/T)</th>
                  <th className="py-2 px-1.5 font-black tracking-tight w-16 text-center border-l border-border/20">OVR (편차)</th>
                  <th className="py-2 px-2 font-black tracking-tight text-right border-l border-border/20">이적료/보증금</th>
                  <th className="py-2 px-1.5 font-black tracking-tight w-14 text-center border-l border-border/20">협상</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAndSortedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="h-full flex flex-col items-center justify-center p-12 text-muted-foreground/60 font-mono text-center">
                        <Compass size={40} className="text-muted-foreground/40 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-muted-foreground">매칭되는 이적시장 대상 선수가 없습니다.</p>
                        <p className="text-[10px] mt-1 text-muted-foreground/80">기타 포지션 필터 또는 지역 검색 명단을 변경해 확인하십시오.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPlayers.map((p) => {
                    const otherTeam = teams.find(t => t.id === p.teamId);
                    const currentOverall = getOvr(p);
                    const buyoutCost = getBuyoutFee(p);
                    
                    const starterId = startingLineup[p.role];
                    const starter = players.find(s => s.id === starterId);
                    const starterOvrValue = starter ? getOvr(starter) : 0;
                    const ovrDiff = starter ? currentOverall - starterOvrValue : null;

                    return (
                      <tr key={p.id} className="bg-background/40 hover:bg-muted/30 transition-colors group">
                        <td className="py-1.5 px-1.5 text-center">
                          <span className={`text-[9px] font-black px-1 py-0.5 w-[46px] inline-block text-center rounded border shadow-inner shadow-black/50 ${
                            p.role === 'MID' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            p.role === 'TOP' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            p.role === 'JUNGLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            p.role === 'ADC' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                            'bg-cyan-400/10 text-cyan-400 border-cyan-400/20'
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="py-1.5 px-1.5">
                          <div className="font-extrabold text-foreground flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 shadow-sm group-hover:text-primary transition-colors">
                            <span>{p.summonerName}</span>
                            <span className="text-[9px] text-muted-foreground font-normal">({p.name})</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-1.5 max-w-[124px] truncate">
                          <div className="flex items-center gap-1 text-[10px] truncate" title={otherTeam?.name || '자유계약(FA)'}>
                            {otherTeam ? (
                              <>
                                <span className="shrink-0">{otherTeam.logo}</span>
                                <span className="text-foreground truncate">{otherTeam.name}</span>
                              </>
                            ) : (
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/25">FA</span>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-1 text-center text-muted-foreground border-l border-border/10">{p.age}</td>
                        <td className="py-1.5 px-1 text-center border-l border-border/10">
                           <span className="text-[10px] font-bold text-emerald-400">{p.potential || 85}</span>
                        </td>
                        <td className="py-1.5 px-1.5 text-center text-[10px] text-muted-foreground font-mono tracking-tight border-l border-border/10">
                          <span className="text-foreground/80">{p.lanePhase}</span>/<span className="text-foreground/80">{p.mechanics}</span>/<span className="text-foreground/80">{p.macro}</span>/<span className="text-foreground/80">{p.teamfight}</span>
                        </td>
                        <td className="py-1.5 px-1.5 text-center border-l border-border/10">
                          <div className="flex items-center justify-center gap-1.5">
                             <span className={`font-black text-xs ${
                               currentOverall >= 88 ? 'text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]' :
                               currentOverall >= 80 ? 'text-purple-400' :
                               currentOverall >= 72 ? 'text-blue-400' : 'text-foreground'
                             }`}>{currentOverall}</span>
                             {ovrDiff !== null && (
                               <span className={`text-[8px] font-black shrink-0 ${
                                 ovrDiff > 0 ? 'text-cyan-400' : ovrDiff < 0 ? 'text-destructive' : 'text-muted-foreground'
                               }`}>
                                  {ovrDiff > 0 ? `+${ovrDiff}` : ovrDiff < 0 ? `${ovrDiff}` : '='}
                               </span>
                             )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right border-l border-border/10">
                          <div className="flex flex-col items-end justify-center select-none leading-tight">
                            <span className="font-black text-[10px] text-primary">{buyoutCost.toLocaleString()}만</span>
                            <span className="text-[7.5px] text-muted-foreground/70">{p.teamId === 'FA' ? '보증금' : '바이아웃'}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-1.5 text-center border-l border-border/10">
                          <button
                            onClick={() => startNegotiation(p, false)}
                            className="bg-cyan-500/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-black px-2 py-0.5 rounded transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm"
                          >
                            협상
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Transfer market guidelines info */}
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-[10px] text-muted-foreground font-mono flex items-start gap-2 leading-relaxed shrink-0 select-none shadow-[inset_0_0_10px_rgba(var(--primary),0.05)]">
            <ShieldAlert size={14} className="text-primary/70 shrink-0 mt-0.5" />
            <div>
              <span className="text-primary font-bold block drop-shadow-sm mb-0.5">이적시장 성사 수칙 및 규정 (Transfer Policy)</span>
              자유계약선수(FA)는 원본 연봉 스펙의 <strong className="text-foreground">50% 계약 보증비</strong>만 소모하나, 이미 활성 구단에 입단한 선수를 차출 시 계약 가중 보증서로 인해 원 연봉의 <strong className="text-foreground">150%에 상응하는 바이아웃 보상액</strong>이 집행됩니다. 영입 시 즉시 벤치 라우터 로스터에 편입됩니다.
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: Owned Club Roster management (col-span-4) */}
        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 bg-card/40 backdrop-blur-md border border-border rounded-xl p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
          
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-sm font-extrabold text-cyan-400 flex items-center gap-1.5 font-mono drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">
              👥 아군 구단 활성 로스터 (SQUAD LIST)
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">현 로스터 라인업 관리, 재계약 협상 및 방출 제반을 수립합니다.</p>
          </div>

          {/* Player Roster container list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2.5">
            {playerRoster.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground/60 text-center font-mono">
                <UserX size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-xs">현재 등록된 소속 구단 선수가 없습니다.</p>
              </div>
            ) : (
              playerRoster.map((p) => {
                const isStarting = Object.values(startingLineup).includes(p.id);
                const assignedRole = Object.keys(startingLineup).find(
                  key => startingLineup[key as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'] === p.id
                ) as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | undefined;
                const currentOverall = getOvr(p);

                return (
                  <div key={p.id} className="bg-background/60 p-3.5 rounded-xl border border-border space-y-3 relative overflow-hidden shadow-inner shadow-black/30">
                    
                    {/* Upper segment */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-foreground text-xs font-mono drop-shadow-sm">
                            {p.summonerName}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-normal">({p.name})</span>
                        </div>

                        {/* Starting/Sub designation info */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {isStarting ? (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/40 font-mono shadow-[0_0_5px_rgba(34,211,238,0.2)]">
                              주전선수 • {assignedRole}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-background text-muted-foreground border border-border font-mono shadow-inner shadow-black/40">
                              벤치후보 (SUB)
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground/80 font-mono">
                            {p.age}세
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span className="text-xs font-mono font-black text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">OVR {currentOverall}</span>
                        <div className="flex gap-1 text-[8px] text-muted-foreground font-mono mt-0.5">
                          <span>L <strong className="text-foreground/80">{p.lanePhase}</strong></span>
                          <span>M <strong className="text-foreground/80">{p.mechanics}</strong></span>
                          <span>O <strong className="text-foreground/80">{p.macro}</strong></span>
                          <span>T <strong className="text-foreground/80">{p.teamfight}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="text-[9px] font-mono text-muted-foreground flex justify-between bg-background/40 px-2 py-1 rounded border border-border/60 leading-none select-none shadow-inner shadow-black/20">
                      <span>급료 청구액: <strong className="text-foreground">{p.salary}만원</strong></span>
                      <span>남은 기간: <strong className="text-destructive drop-shadow-sm">{p.contractYears}년</strong></span>
                    </div>

                    {/* Management and interactive buttons */}
                    <div className="space-y-1.5 pt-1.5 border-t border-border/60">
                      
                      {/* Starter designation selector line */}
                      <div className="bg-background p-1 rounded-lg border border-border flex items-center justify-between gap-1 shadow-inner shadow-black/30">
                        <span className="text-[8px] font-mono font-extrabold text-muted-foreground pl-1 select-none">포지션 변경:</span>
                        <div className="flex gap-0.5">
                          {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const).map((role) => (
                            <button
                              key={role}
                              onClick={() => {
                                updateStartingLineup(role, p.id);
                                showToast(`${p.summonerName} 선수를 ${role} 선발로 명명했습니다.`, 'success');
                              }}
                              className={`text-[8.5px] font-mono font-black py-0.5 px-1.5 rounded cursor-pointer transition-all ${
                                assignedRole === role
                                  ? 'bg-primary text-primary-foreground font-black shadow-[0_0_10px_rgba(var(--primary),0.5)]'
                                  : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                              }`}
                            >
                              {role[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Contract and release actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startNegotiation(p, true)}
                          className="py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-400/20 text-[10px] font-bold rounded-lg cursor-pointer transition-all border border-cyan-400/30 font-mono active:scale-95 shadow-[inset_0_0_8px_rgba(34,211,238,0.1)] hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        >
                          📋 계약 재협상
                        </button>

                        <button
                          onClick={() => {
                            const result = sellPlayer(p.id);
                            if (result.success) {
                              showToast(result.message, 'success');
                            } else {
                              showToast(result.message, 'error');
                            }
                          }}
                          className="py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-bold rounded-lg cursor-pointer transition-all border border-destructive/30 font-mono active:scale-95 shadow-[inset_0_0_8px_rgba(var(--destructive),0.1)] hover:shadow-[0_0_10px_rgba(var(--destructive),0.2)]"
                        >
                          💸 이적시장 방출
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* 🤝 INTERACTIVE CONTRACT NEGOTIATION MODAL */}
      {negotiatingPlayer && (() => {
        const p = negotiatingPlayer;
        const ovr = getOvr(p);
        const buyoutFee = (negIsRenewal || p.teamId === 'FA') ? 0 : Math.floor(p.salary * 1.5);
        const projectPayrollAfter = startingStats.totalSalary + (negIsRenewal ? (negSalary - p.salary) : negSalary);
        const isProjectCapExceeded = projectPayrollAfter > 500000;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-background border border-border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono text-foreground relative before:absolute before:inset-0 before:pointer-events-none before:shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
              
              {/* Modal Header */}
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between select-none relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold flex items-center justify-center shadow-inner shadow-black/20">
                    <UserCheck size={20} className="animate-pulse text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 drop-shadow-sm">
                      {negIsRenewal ? '📋 소속 선수 재계약 합의' : '🤝 신규 외부선수 영입 계약협상'}
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                      연봉 총액 샐러리 캡(50억 원) 및 구단 예산을 확인하여 최적의 대우 조건에 타결하십시오.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setNegotiatingPlayer(null)} 
                  className="text-muted-foreground/70 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted text-xs font-black"
                >
                  ✕ 닫기
                </button>
              </div>

              {/* Player Mini-Profile Slate */}
              <div className="bg-background px-6 py-4 border-b border-border/60 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center select-none relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shadow-inner shadow-black/40 ${getOvrColor(ovr)}`}>
                    {ovr}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-foreground drop-shadow-sm">{p.summonerName}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({p.name})</span>
                      <span className="text-[9px] bg-background text-cyan-400 border border-cyan-500/30 font-black px-1.5 py-0.2 rounded uppercase shadow-inner shadow-black/30">
                        {p.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      나이: {p.age}세 • 소속팀: {p.teamId === 'FA' ? '자유계약(FA)' : p.teamId} • 기존 연봉: {formatCurrency(p.salary)}
                    </div>
                  </div>
                </div>

                {/* Financial Status Tracker */}
                <div className="text-right text-[10px] bg-background/50 p-2.5 rounded-lg border border-border min-w-[200px] shadow-inner shadow-black/20">
                  <div className="flex justify-between gap-3 text-[10px] text-muted-foreground">
                    <span>구단 보유 예산:</span>
                    <strong className="text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">{(myTeam?.budget || 0).toLocaleString()}만 원</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-[10px] text-muted-foreground mt-1">
                    <span>예상 총 연봉액:</span>
                    <strong className={isProjectCapExceeded ? 'text-destructive font-bold animate-pulse drop-shadow-sm' : 'text-amber-500 drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]'}>
                      {projectPayrollAfter.toLocaleString()} / {formatCurrency(500000)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Interactive Negotiation Board */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed relative z-10">
                
                {/* Left Column: Player Mood & Message */}
                <div className="flex flex-col gap-4 bg-background/60 p-4 rounded-xl border border-border shadow-inner shadow-black/30">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-[10.5px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      🗣️ 선수 피드백 (Player Sentiment)
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-muted-foreground">인내도:</span>
                      <div className="flex gap-0.5 animate-pulse">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2.5 h-1.5 rounded-full shadow-inner shadow-black/50 ${
                              i < negPatience 
                                ? negPatience <= 2 ? 'bg-amber-500' : 'bg-emerald-500' 
                                : 'bg-muted'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Character visual feedback / Portrait Emoji */}
                  <div className="flex items-center gap-4 py-1 select-none">
                    <div className="text-4xl bg-background p-3 h-16 w-16 border border-border shadow-inner shadow-black/30 rounded-2xl flex items-center justify-center">
                      {negMood === 'SIGNED' ? '🤩' :
                       negMood === 'WALKED_AWAY' ? '😡' :
                       negMood === 'INSULTED' ? '🤬' :
                       negMood === 'SKEPTICAL' ? '😒' :
                       negMood === 'INTERESTED' ? '🙂' : '😐'}
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-black leading-none mb-1">상태 정보</span>
                      <strong className={`text-xs drop-shadow-sm ${
                        negMood === 'SIGNED' ? 'text-emerald-400' :
                        negMood === 'WALKED_AWAY' ? 'text-destructive font-black' :
                        negMood === 'INSULTED' ? 'text-destructive/80' :
                        negMood === 'SKEPTICAL' ? 'text-muted-foreground' :
                        negMood === 'INTERESTED' ? 'text-cyan-400' : 'text-muted-foreground'
                      }`}>
                        {negMood === 'SIGNED' ? '계약에 합의함' :
                         negMood === 'WALKED_AWAY' ? '협상 결렬' :
                         negMood === 'INSULTED' ? '제의에 극도로 실망함' :
                         negMood === 'SKEPTICAL' ? '회의적인 태도' :
                         negMood === 'INTERESTED' ? '제의에 매력 느낌' : '반응 대기 중'}
                      </strong>
                    </div>
                  </div>

                  {/* Speech bubble */}
                  <div className="bg-muted/20 border border-border p-3 rounded-lg text-muted-foreground text-xs italic relative flex-1 shadow-inner shadow-black/20">
                    <div className="absolute top-3 -left-1.5 w-3 h-3 bg-muted/20 border-l border-b border-border rotate-45" />
                    "{negMessage}"
                  </div>

                  {/* Target demand summary for debugging / hint */}
                  {negMood !== 'SIGNED' && negMood !== 'WALKED_AWAY' && (
                    <div className="bg-background p-2.5 rounded border border-border text-[10px] text-muted-foreground space-y-1 shadow-inner shadow-black/20">
                      <div className="flex justify-between select-none">
                        <span>요구 최소 연봉치:</span>
                        <strong className="text-foreground/80">{formatCurrency(demandSalary)} / 년</strong>
                      </div>
                      <div className="flex justify-between select-none">
                        <span>인정 계약금 하한선:</span>
                        <strong className="text-foreground/80">{formatCurrency(demandBonus)} (사이닝 보너스)</strong>
                      </div>
                      <p className="text-[9px] leading-relaxed text-muted-foreground/80 pt-1 border-t border-border/60">
                        * 팁: 요구 계약금보다 대단한 보너스(사이닝)를 꽂아주면 선수가 흥미를 느껴 연봉 요구액을 약간 깎아주기도 합니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Offer Editor */}
                <div className="space-y-4">
                  <h4 className="text-[10.5px] font-bold text-muted-foreground uppercase pb-2 border-b border-border/60">
                    💼 구단 연봉 제안 정보 (Offer parameters)
                  </h4>

                  {/* Contract Years Button Group */}
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1.5">계약 연장 기간 (Contract Years)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((years) => (
                        <button
                          key={years}
                          type="button"
                          disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                          onClick={() => setNegYears(years)}
                          className={`py-2 rounded-lg text-xs font-bold font-mono transition-colors border cursor-pointer shadow-inner ${
                            negYears === years
                              ? 'bg-primary/20 border-primary text-primary shadow-black/30'
                              : 'bg-background border-border text-muted-foreground hover:text-foreground shadow-black/50'
                          }`}
                        >
                          {years} 년 계약
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Auto-Match Preset */}
                  {negMood !== 'SIGNED' && negMood !== 'WALKED_AWAY' && (
                    <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-lg flex items-center justify-between select-none">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-primary/80 font-black block">💡 원클릭 제안 프리셋</span>
                        <span className="text-[9px] text-muted-foreground block">선수가 요구하는 최소 기준에 정확히 조율 조준합니다.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNegSalary(demandSalary);
                          setNegBonus(demandBonus);
                        }}
                        className="px-3 py-1.5 bg-primary/20 hover:bg-primary/35 text-primary border border-primary/40 rounded-md text-[10px] font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_8px_rgba(var(--primary),0.15)]"
                      >
                        ⚡ 선수 요구조건 즉시 일치시킴
                      </button>
                    </div>
                  )}

                  {/* Annual Salary input with fine-tune buttons */}
                  <div className="bg-background/40 p-3 rounded-lg border border-border/80">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-2 leading-none select-none">
                      <span className="font-bold flex items-center gap-1">💰 제시 연간 연봉 (Annual Salary)</span>
                      <strong className="text-primary text-xs drop-shadow-[0_0_2px_rgba(var(--primary),0.5)] font-black">
                        {formatCurrency(negSalary)}
                      </strong>
                    </div>
                    
                    {/* Direct Input & Selector */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                          min={Math.floor(p.salary * 0.4)}
                          max={Math.floor(p.salary * 2.5)}
                          value={negSalary}
                          onChange={(e) => setNegSalary(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-background/80 shadow-inner border border-border/80 py-1.5 pl-3 pr-10 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-primary/50 text-foreground"
                          placeholder="연봉 입력"
                        />
                        <span className="absolute right-3 top-2 text-[9px] text-muted-foreground font-bold">만 원</span>
                      </div>
                      <button
                        type="button"
                        disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                        onClick={() => setNegSalary(demandSalary)}
                        className="bg-background/60 shadow-sm border border-border hover:bg-muted/50 px-2 h-[30px] rounded-lg text-[9px] font-bold text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title="요구치 자동 적용"
                      >
                        요구치 적용
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1 mt-2.5">
                      {[
                        { label: '+1억', val: 10000 },
                        { label: '+5000만', val: 5000 },
                        { label: '+1000만', val: 1000 },
                        { label: '-1000만', val: -1000 },
                        { label: '-5000만', val: -5000 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                          onClick={() => setNegSalary(Math.max(1000, negSalary + item.val))}
                          className="bg-background shadow-inner shadow-black/30 hover:bg-muted/50 border border-border py-1 px-0.5 rounded text-[9px] text-muted-foreground hover:text-foreground font-black transition-all font-sans"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Signing Bonus input with fine-tune buttons */}
                  <div className="bg-background/40 p-3 rounded-lg border border-border/80">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-2 leading-none select-none">
                      <span className="font-bold flex items-center gap-1">✨ 사이닝 보너스 (signing Bonus)</span>
                      <strong className="text-emerald-400 text-xs drop-shadow-[0_0_2px_rgba(52,211,153,0.5)] font-black">
                        {formatCurrency(negBonus)}
                      </strong>
                    </div>

                    {/* Direct Input & Selector */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                          min={0}
                          max={Math.floor((myTeam?.budget || 100000) * 0.95)}
                          value={negBonus}
                          onChange={(e) => setNegBonus(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-background/80 shadow-inner border border-border/80 py-1.5 pl-3 pr-10 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-emerald-500/50 text-foreground"
                          placeholder="계약 보너스 입력"
                        />
                        <span className="absolute right-3 top-2 text-[9px] text-muted-foreground font-bold">만 원</span>
                      </div>
                      <button
                        type="button"
                        disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                        onClick={() => setNegBonus(demandBonus)}
                        className="bg-background/60 shadow-sm border border-border hover:bg-muted/50 px-2 h-[30px] rounded-lg text-[9px] font-bold text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        title="요구치 자동 적용"
                      >
                        요구치 적용
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1 mt-2.5">
                      {[
                        { label: '+5000만', val: 5000 },
                        { label: '+1000만', val: 1000 },
                        { label: '+500만', val: 500 },
                        { label: '-1000만', val: -1000 },
                        { label: '0원', val: 0 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          disabled={negMood === 'SIGNED' || negMood === 'WALKED_AWAY'}
                          onClick={() => {
                            if (item.val === 0) {
                              setNegBonus(0);
                            } else {
                              setNegBonus(Math.max(0, Math.min((myTeam?.budget || 100000), negBonus + item.val)));
                            }
                          }}
                          className="bg-background shadow-inner shadow-black/30 hover:bg-muted/50 border border-border py-1 px-0.5 rounded text-[9px] text-muted-foreground hover:text-foreground font-black transition-all font-sans"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buyout summary details */}
                  {buyoutFee > 0 && (
                    <div className="bg-background shadow-inner shadow-black/20 border border-border p-2.5 rounded-lg text-[9px] text-muted-foreground leading-relaxed">
                      구단 소속 이적 보상료: <strong className="text-foreground/80">{formatCurrency(buyoutFee)}</strong>이 추가 청구되어 소속 구단 금고로 타행 송금됩니다.
                    </div>
                  )}

                </div>

              </div>

              {/* Action buttons footer */}
              <div className="bg-muted/30 px-6 py-4 border-t border-border flex flex-wrap gap-3 items-center justify-between relative z-10">
                <div>
                  {negMood === 'SIGNED' ? (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1 drop-shadow-sm">
                      ✓ 협상 합의 완료!
                    </span>
                  ) : negMood === 'WALKED_AWAY' ? (
                    <span className="text-[10px] font-bold text-destructive uppercase flex items-center gap-1 animate-pulse drop-shadow-sm">
                      ✗ 선수가 이적 회담장 밖으로 이탈함
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground uppercase">
                      계상 소모 예산: <strong className="text-foreground">{(negBonus + buyoutFee).toLocaleString()}만 원</strong>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {negMood === 'SIGNED' ? (
                    <button
                      onClick={confirmNegotiationSuccess}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 shadow-[0_0_15px_rgba(52,211,153,0.4)] rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      🖋️ 구단 직인 최종 서명 (Sign Contract)
                    </button>
                  ) : negMood === 'WALKED_AWAY' ? (
                    <button
                      onClick={() => setNegotiatingPlayer(null)}
                      className="px-5 py-2.5 bg-muted hover:bg-muted/80 active:bg-muted text-foreground rounded-xl text-xs font-bold cursor-pointer transition-all shadow-inner shadow-black/20"
                    >
                      협상 종료 및 닫기
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setNegotiatingPlayer(null)}
                        className="px-4 py-2.5 bg-background shadow-inner shadow-black/20 hover:bg-muted/50 border border-border text-muted-foreground hover:text-foreground text-xs font-black rounded-xl cursor-pointer transition-colors"
                      >
                        철회 (Withdraw)
                      </button>
                      <button
                        onClick={submitOffer}
                        className="px-5 py-2.5 bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1"
                      >
                        📬 정식 제안서 제출 (Submit Offer)
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
