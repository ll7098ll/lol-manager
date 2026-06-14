import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CHAMPIONS } from '../data/initialData';
import { solveOptimalRoles } from '../utils/draft';
import { simulateLoLMatch } from '../utils/matchEngine';
import { Trophy, AlertCircle, CheckCircle, Zap, ShieldAlert, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../hooks/use-mobile';

// Maps sequential pick slot indices to official eSports positions for robust gameplay
const ROLE_ORDER: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export default function DraftRoom() {
  const {
    playerTeamId,
    activeMatch,
    teams,
    players,
    draftState,
    selectBan,
    selectPick,
    completeMatch
  } = useGameStore();

  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'GRID' | 'STATUS'>('GRID');
  const [hoveredChampId, setHoveredChampId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | 'OP'>('ALL');

  // Role mappings for both teams once draft is complete
  const [blueRoleMap, setBlueRoleMap] = useState<Record<string, string>>({
    TOP: '', JUNGLE: '', MID: '', ADC: '', SUPPORT: ''
  });
  const [redRoleMap, setRedRoleMap] = useState<Record<string, string>>({
    TOP: '', JUNGLE: '', MID: '', ADC: '', SUPPORT: ''
  });

  useEffect(() => {
    if (draftState?.currentTurn === 'COMPLETE') {
      const bSolved = solveOptimalRoles(draftState.bluePicks);
      const rSolved = solveOptimalRoles(draftState.redPicks);
      setBlueRoleMap(bSolved);
      setRedRoleMap(rSolved);
    }
  }, [draftState?.currentTurn, draftState?.bluePicks, draftState?.redPicks]);

  if (!activeMatch || !draftState) return null;

  const blueTeam = teams.find(t => t.id === draftState.blueTeamId)!;
  const redTeam = teams.find(t => t.id === draftState.redTeamId)!;

  const isPlayerBlue = draftState.blueTeamId === playerTeamId;
  const currentTurn = draftState.currentTurn;
  const isBlueTurn = currentTurn.startsWith('BLUE');
  const isRedTurn = currentTurn.startsWith('RED');
  const isBanTurn = currentTurn.includes('BAN');

  const isPlayerTurn = (isBlueTurn && isPlayerBlue) || (isRedTurn && !isPlayerBlue);

  // Auto-focus Champion Grid Tab on mobile when it's player's turn
  useEffect(() => {
    if (isMobile && isPlayerTurn && currentTurn !== 'COMPLETE') {
      setMobileTab('GRID');
    }
  }, [isPlayerTurn, isMobile, currentTurn]);

  const handleRoleSelectChange = (role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT', selectedChampId: string) => {
    const isBlue = draftState.blueTeamId === playerTeamId;
    const currentMap = isBlue ? blueRoleMap : redRoleMap;
    const setMap = isBlue ? setBlueRoleMap : setRedRoleMap;

    // Find which role currently has this champion
    const currentRoleForSelected = (Object.keys(currentMap) as ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[])
      .find(r => currentMap[r] === selectedChampId);

    if (currentRoleForSelected) {
      // Swap them!
      const temp = currentMap[role];
      setMap(prev => ({
        ...prev,
        [role]: selectedChampId,
        [currentRoleForSelected]: temp
      }));
    }
  };

  const getChampionOfId = (id: string) => {
    return CHAMPIONS.find(c => c.id === id);
  };

  const hoveredChamp = hoveredChampId ? getChampionOfId(hoveredChampId) : null;

  const usedChamps = [
    ...draftState.blueBans,
    ...draftState.redBans,
    ...draftState.bluePicks,
    ...draftState.redPicks
  ];

  // Helper to translate draft phase labels
  const getTurnMessage = () => {
    if (currentTurn === 'COMPLETE') return '밴픽 완료! 이제 소환사의 협곡으로 진입합니다.';
    
    const teamName = isBlueTurn ? blueTeam.name : redTeam.name;
    const action = isBanTurn ? '금지(BAN)할 챔피언을 선택 중입니다' : '선택(PICK)할 챔피언을 고르는 중입니다';
    
    return `[${teamName}] ${action}`;
  };

  const getLaneEmoji = (lane: string) => {
    if (lane === 'TOP') return '🛡️';
    if (lane === 'JUNGLE') return '🌿';
    if (lane === 'MID') return '🔥';
    if (lane === 'ADC') return '🎯';
    return '🌊';
  };

  // Run match simulation once drafting completes
  const handleLaunchMatch = () => {
    const bluePlayers = players.filter(p => p.teamId === draftState.blueTeamId);
    const redPlayers = players.filter(p => p.teamId === draftState.redTeamId);

    // Build roster structures sequentially: index 0 mapped to TOP, etc.
    const blueRoster: Record<string, any> = {};
    const redRoster: Record<string, any> = {};

    ROLE_ORDER.forEach((role, idx) => {
      const bPl = bluePlayers.find(p => p.role === role) || bluePlayers[idx];
      const rPl = redPlayers.find(p => p.role === role) || redPlayers[idx];

      const bChampId = blueRoleMap[role] || 'lulu';
      const rChampId = redRoleMap[role] || 'lulu';

      blueRoster[role] = { player: bPl, championId: bChampId };
      redRoster[role] = { player: rPl, championId: rChampId };
    });

    // Run complete match engine simulation
    const result = simulateLoLMatch(blueTeam, blueRoster, redTeam, redRoster);

    // Dispatch victory results and standings update to the Zustand store
    completeMatch(result);
  };

  const activeTurnColorClass = isPlayerTurn 
    ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' 
    : 'text-rose-400 border-rose-500 bg-rose-500/10 animate-pulse';

  return (
    <div className="min-h-screen xl:h-screen xl:overflow-hidden bg-background text-foreground flex flex-col justify-between font-sans relative p-3 md:p-4 gap-2.5 selection:bg-primary/30 selection:text-primary">
      
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-transparent to-red-500 opacity-60" />

      {/* HEADER SECTION */}
      <div className="grid grid-cols-3 items-center bg-card/40 backdrop-blur-md border border-border rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-lg mb-1.5 shrink-0">
        {/* Blue Side Team info */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="text-xl sm:text-3xl shrink-0">{blueTeam.logo}</span>
          <div className="min-w-0">
            <h3 className="font-black text-foreground text-[10px] sm:text-xs flex items-center gap-1 text-blue-400 font-heading truncate">
              <span className="truncate">{blueTeam.name}</span>
              <span className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.2 rounded font-mono shadow-[0_0_5px_rgba(59,130,246,0.2)] shrink-0">B</span>
            </h3>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground font-mono truncate">OVR: {blueTeam.tier}</p>
          </div>
        </div>

        {/* Current status display */}
        <div className="text-center min-w-0">
          <div className="inline-flex items-center gap-1 mb-0.5 text-[8px] sm:text-[9px] font-mono tracking-wider uppercase bg-background border border-border px-1.5 py-0.2 rounded-full text-muted-foreground shadow-inner">
            <Zap size={8} className="text-amber-400 animate-pulse" /> DRAFT PRO
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-foreground drop-shadow-md truncate">
            {getTurnMessage()}
          </p>
        </div>

        {/* Red Side Team info */}
        <div className="flex items-center gap-1.5 sm:gap-3 justify-end text-right min-w-0">
          <div className="min-w-0">
            <h3 className="font-black text-foreground text-[10px] sm:text-xs flex items-center gap-1 justify-end text-red-400 font-heading truncate">
              <span className="text-[8px] bg-red-500/20 text-red-500 border border-red-500/30 px-1 py-0.2 rounded font-mono shadow-[0_0_5px_rgba(239,68,68,0.2)] shrink-0">R</span>
              <span className="truncate">{redTeam.name}</span>
            </h3>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground font-mono truncate">OVR: {redTeam.tier}</p>
          </div>
          <span className="text-xl sm:text-3xl shrink-0">{redTeam.logo}</span>
        </div>
      </div>

      {/* MOBILE ONLY QUICK PROGRESS BAR */}
      {isMobile && currentTurn !== 'COMPLETE' && (
        <div className="bg-card/30 border border-border rounded-xl p-2 flex flex-col gap-1.5 mb-1 shrink-0 select-none text-[10px]">
          <div className="flex justify-between items-center text-[9px] font-bold font-mono text-muted-foreground">
            <span className="text-blue-400">BLUE: {draftState.bluePicks.length}/5</span>
            <span className="uppercase text-foreground font-black bg-muted/60 px-1.5 py-0.5 rounded border border-border">{currentTurn.replace('_', ' ')}</span>
            <span className="text-red-400">RED: {draftState.redPicks.length}/5</span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const pId = draftState.bluePicks[i];
                const champ = pId ? getChampionOfId(pId) : null;
                return (
                  <div
                    key={`b-mini-${i}`}
                    className={`flex-1 aspect-square rounded border text-[8px] font-extrabold flex items-center justify-center truncate ${
                      champ ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-background/80 border-dashed border-border/50'
                    }`}
                    title={champ?.name}
                  >
                    {champ ? champ.name.substring(0, 2) : ''}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const pId = draftState.redPicks[i];
                const champ = pId ? getChampionOfId(pId) : null;
                return (
                  <div
                    key={`r-mini-${i}`}
                    className={`flex-1 aspect-square rounded border text-[8px] font-extrabold flex items-center justify-center truncate ${
                      champ ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-background/80 border-dashed border-border/50'
                    }`}
                    title={champ?.name}
                  >
                    {champ ? champ.name.substring(0, 2) : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TABS TO TOGGLE VIEW */}
      {isMobile && (
        <div className="flex bg-card/40 border border-border rounded-xl p-1 shrink-0 gap-1 mb-1">
          <button
            onClick={() => setMobileTab('GRID')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all text-center cursor-pointer ${
              mobileTab === 'GRID'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[inset_0_0_8px_rgba(34,211,238,0.1)]'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {currentTurn === 'COMPLETE' ? "🔄 라인 배치 (SWAP)" : "🎯 챔피언 선택 그리드"}
          </button>
          <button
            onClick={() => setMobileTab('STATUS')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all text-center cursor-pointer ${
              mobileTab === 'STATUS'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[inset_0_0_8px_rgba(34,211,238,0.1)]'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {currentTurn === 'COMPLETE' ? "📋 밴픽 결과 (DRAFT)" : "📋 상세 픽앤밴 현황"}
          </button>
        </div>
      )}

      {/* CORE BOARD DRAFT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch mb-1.5">
        
        {/* BLUE TEAM PICKS (Col Left: 3 spans) */}
        {(!isMobile || mobileTab === 'STATUS') && (
          <div className="lg:col-span-3 flex flex-col justify-between h-full min-h-0 bg-background/50 border border-border p-2 rounded-xl shadow-inner shadow-black/20">
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 xl:max-h-[calc(100vh-270px)] scrollbar-thin">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-primary tracking-wider mb-1 uppercase drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
                <span>BLUE TEAM PICKS</span>
                <span>{draftState.bluePicks.length} / 5</span>
              </div>
              
              {ROLE_ORDER.map((role, idx) => {
                const isDraftComplete = currentTurn === 'COMPLETE';
                const pickId = isDraftComplete ? blueRoleMap[role] : draftState.bluePicks[idx];
                const champ = pickId ? getChampionOfId(pickId) : null;
                const slotLabel = isDraftComplete ? role : `PICK #${idx + 1}`;
                
                return (
                  <div 
                    key={`blue-pick-${role}`}
                    className={`p-2 rounded-lg border flex items-center justify-between transition-colors h-[44px] ${
                      champ 
                        ? 'bg-primary/10 border-primary/40 shadow-[inset_0_0_10px_rgba(var(--primary),0.05)]' 
                        : 'bg-background/80 border-border/70 border-dashed animate-pulse'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black font-mono text-primary bg-primary/20 px-1 py-0.5 rounded border border-primary/30 shrink-0">
                        {slotLabel}
                      </span>
                      {champ ? (
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[11px] text-foreground leading-tight truncate">{champ.name}</h4>
                          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wide block truncate">
                            STYLE: {champ.style}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground font-mono truncate">선택 대기 중...</span>
                      )}
                    </div>
                    {champ && <span className="text-sm shrink-0">{getLaneEmoji(isDraftComplete ? role : (champ.lane[0] || 'MID'))}</span>}
                  </div>
                );
              })}
            </div>

            {/* Blue Bans Bar */}
            <div className="bg-background/30 border border-border p-1.5 rounded-lg mt-2 shadow-inner">
              <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider mb-1 font-bold">BLUE BANS</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(idx => {
                  const banId = draftState.blueBans[idx];
                  const champ = banId ? getChampionOfId(banId) : null;
                  return (
                    <div key={idx} className="w-1/5 aspect-square rounded bg-background border border-border flex items-center justify-center text-[10px] text-muted-foreground truncate" title={champ?.name}>
                      {champ ? (
                        <span className="text-destructive font-bold overflow-hidden select-none text-[8px] truncate max-w-[40px] drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]">
                          🚫 {champ.id === 'ksante' ? '크산' : champ.id === 'azir' ? '아지' : champ.id === 'yone' ? '요네' : champ.id === 'zeri' ? '제리' : champ.id.substring(0,2)}
                        </span>
                      ) : 'B'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CHAMPION GRID SELECTOR (Col Center: 6 spans) */}
        {(!isMobile || mobileTab === 'GRID') && (
          <div className="lg:col-span-6 flex flex-col justify-between bg-card/30 backdrop-blur-md border border-border p-2.5 sm:p-3.5 rounded-xl h-full min-h-0 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            
            {currentTurn === 'COMPLETE' ? (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="text-center p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 mb-2.5 shadow-sm">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold rounded-full mb-0.5 border border-emerald-500/30">
                    <CheckCircle size={10} /> DRAFT COMPLETED
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-foreground font-heading">
                    소환사 배치 및 라인 스왑 단계
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    최종 라인에 맞춰 챔피언 배치를 조율할 수 있습니다.
                  </p>
                </div>

                {/* Roles Assignment Board */}
                <div className="flex-1 overflow-y-auto space-y-1.5 bg-background/50 border border-border/80 p-2 sm:p-3 rounded-xl shadow-inner scrollbar-thin max-h-[360px] xl:max-h-[calc(100vh-320px)]">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">
                      포지션 및 챔피언 조합 설정
                    </span>
                    <button
                      onClick={() => {
                        const bSolved = solveOptimalRoles(draftState.bluePicks);
                        const rSolved = solveOptimalRoles(draftState.redPicks);
                        setBlueRoleMap(bSolved);
                        setRedRoleMap(rSolved);
                      }}
                      className="text-[8.5px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 font-bold cursor-pointer"
                    >
                      AI 복구
                    </button>
                  </div>

                  {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const).map(role => {
                    const isBlue = draftState.blueTeamId === playerTeamId;
                    const currentMap = isBlue ? blueRoleMap : redRoleMap;
                    const assignedChampId = currentMap[role];
                    const assignedChamp = getChampionOfId(assignedChampId);
                    
                    // Picked champions of player
                    const myPickedChamps = (isBlue ? draftState.bluePicks : draftState.redPicks)
                      .map(id => getChampionOfId(id))
                      .filter(Boolean) as typeof CHAMPIONS;

                    // check if assigned champion is native to this lane
                    const isNative = assignedChamp?.lane.includes(role);

                    return (
                      <div 
                        key={`assign-row-${role}`}
                        className={`p-2 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 ${
                          isNative 
                            ? 'bg-card/60 border-border/80' 
                            : 'bg-amber-500/5 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          {/* Position Icon / Badge */}
                          <span className="text-sm font-black font-mono w-16 sm:w-20 text-center py-0.5 sm:py-1 rounded bg-background border border-border shadow-inner text-muted-foreground flex justify-center items-center gap-1 text-[9px] sm:text-[10px]">
                            {getLaneEmoji(role)} {role}
                          </span>
                          
                          <div>
                            {assignedChamp ? (
                              <>
                                <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1 leading-tight">
                                  {assignedChamp.name}
                                  {isNative ? (
                                    <span className="text-[8px] px-1 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold font-mono">주라인</span>
                                  ) : (
                                    <span className="text-[8px] px-1 py-0.2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold font-mono animate-pulse">타라인</span>
                                  )}
                                </h4>
                                <span className="text-[8.5px] sm:text-[9px] text-muted-foreground font-mono uppercase tracking-wider block mt-0.5">
                                  SCALING: {assignedChamp.scaling} • STYLE: {assignedChamp.style}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">미선택</span>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Selector to switch */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
                          <span className="text-[9.5px] text-muted-foreground sm:mr-1 font-mono">챔피언 스왑:</span>
                          <select
                            value={assignedChampId || ''}
                            onChange={(e) => handleRoleSelectChange(role, e.target.value as any)}
                            className="bg-background text-foreground text-xs font-bold border border-border px-2 py-1 rounded-lg shadow-inner shadow-black/40 focus:outline-none focus:border-primary cursor-pointer text-[11px] flex-1 sm:flex-none"
                          >
                            {myPickedChamps.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name.split(' ')[0]} 
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Opponent's Swapping Preview */}
                <div className="bg-background/40 border border-border p-2.5 rounded-xl mt-2.5 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center text-muted-foreground gap-2">
                  <div className="flex items-start gap-2">
                    <Trophy size={12} className="text-rose-400 opacity-80 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground block text-[10px] uppercase font-mono tracking-wider">적장 AI 감독의 라인 배치 완료</span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">상대 감독 또한 드래프트 시너지를 토대로 배치를 마쳤습니다.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-nowrap gap-1 self-stretch sm:self-auto justify-between sm:justify-start">
                    {ROLE_ORDER.map(role => {
                      const oppChampId = isPlayerBlue ? redRoleMap[role] : blueRoleMap[role];
                      const oppChamp = getChampionOfId(oppChampId);
                      return (
                        <div 
                          key={`opp-prev-${role}`} 
                          className="flex-1 sm:flex-none px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[8px] sm:text-[9px] font-mono font-bold flex flex-col items-center gap-0.5"
                          title={`${role}: ${oppChamp?.name || '미지정'}`}
                        >
                          <span className="text-muted-foreground text-[7px] sm:text-[8px]">{role.substring(0,3)}</span>
                          <span className="text-rose-400 truncate max-w-[40px] sm:max-w-none">{oppChamp?.name.split(' ')[0] || 'Lulu'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Quick Helper HUD indicator */}
                <div className={`p-2 rounded-xl border text-center text-[10px] sm:text-xs font-bold mb-2 shadow-inner ${activeTurnColorClass}`}>
                  {isPlayerTurn ? '🌟 지금은 감독님의 밴&픽 차례입니다! 원하는 챔피언을 터치하십시오.' : '🔒 상대방 AI 감독이 드래프트 설계 중입니다...'}
                </div>

                {/* Lane & Tier Filter Tabs */}
                <div className="flex flex-wrap gap-1 bg-background p-0.5 sm:p-1 rounded-xl border border-border mb-2 shadow-inner overflow-x-auto scrollbar-none">
                  {([
                    { id: 'ALL', label: '전체' },
                    { id: 'TOP', label: '🛡️ 탑' },
                    { id: 'JUNGLE', label: '🌿 정글' },
                    { id: 'MID', label: '🔥 미드' },
                    { id: 'ADC', label: '🎯 원딜' },
                    { id: 'SUPPORT', label: '🌊 서폿' },
                    { id: 'OP', label: '✨ OP' }
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setRoleFilter(tab.id)}
                      className={`flex-1 text-[9.5px] sm:text-[10px] font-black py-1 px-1 sm:px-1.5 rounded-lg transition-all cursor-pointer text-center whitespace-nowrap border ${
                        roleFilter === tab.id
                          ? 'bg-primary/20 text-primary border-primary/40 shadow-inner'
                          : 'text-muted-foreground hover:text-foreground border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Grid of Champions */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 overflow-y-auto pr-1 flex-1 xl:max-h-[calc(100vh-320px)] scrollbar-thin">
                  {CHAMPIONS.filter(champ => {
                    if (roleFilter === 'ALL') return true;
                    if (roleFilter === 'OP') return champ.tier === 1;
                    return champ.lane.includes(roleFilter);
                  }).map(champ => {
                    const isUsed = usedChamps.includes(champ.id);
                    
                    return (
                      <motion.button
                        id={`btn-champ-card-${champ.id}`}
                        key={champ.id}
                        disabled={isUsed || !isPlayerTurn}
                        onMouseEnter={() => setHoveredChampId(champ.id)}
                        onMouseLeave={() => setHoveredChampId(null)}
                        onClick={() => {
                          if (isBanTurn) {
                            selectBan(champ.id, isPlayerBlue ? 'BLUE' : 'RED');
                          } else {
                            selectPick(champ.id, isPlayerBlue ? 'BLUE' : 'RED');
                          }
                        }}
                        whileHover={{ scale: isUsed ? 1 : 1.03 }}
                        whileTap={{ scale: isUsed ? 1 : 0.97 }}
                        className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-between h-[72px] sm:h-[80px] cursor-pointer transition-all ${
                          isUsed 
                            ? 'opacity-20 bg-background border-border brightness-50 grayscale' 
                            : isPlayerTurn
                              ? 'bg-background/60 border-border hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                              : 'bg-background/20 border-border'
                        }`}
                      >
                        <span className="text-[8px] font-mono bg-background px-1 py-0.2 rounded border border-border text-muted-foreground shadow-inner">
                          Tier {champ.tier}
                        </span>
                        <span className="font-extrabold text-[10px] text-foreground truncate w-full mt-0.5">
                          {champ.name.split(' ')[0]}
                        </span>
                        <div className="flex gap-0.5 mt-0.5">
                          {champ.lane.map(l => (
                            <span key={l} className="text-[7px] px-1 bg-background border border-border rounded text-muted-foreground font-mono font-bold leading-none shrink-0 shadow-inner">
                              {l.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expanded HUD: Champion Info Hover Panel */}
            {currentTurn !== 'COMPLETE' && (
              <div className="bg-background/80 p-2 rounded-lg border border-border mt-2 min-h-[58px] flex items-center justify-between text-xs shadow-inner shrink-0">
                {hoveredChamp ? (
                  <div className="flex justify-between items-center w-full min-w-0">
                    <div className="min-w-0 mr-2">
                      <h4 className="font-black text-xs text-primary flex items-center gap-1 sm:gap-1.5 truncate">
                        <span className="truncate">{hoveredChamp.name}</span>
                        <span className="text-[8px] font-mono uppercase tracking-wide bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 rounded shrink-0">
                          {hoveredChamp.style}
                        </span>
                      </h4>
                      <p className="text-[8.5px] sm:text-[9px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide truncate">
                        SCALING: {hoveredChamp.scaling} • LANES: {hoveredChamp.lane.join(', ')}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5 text-[8.5px] sm:text-[9px] font-mono shrink-0">
                      <div className="text-destructive truncate max-w-[120px] sm:max-w-none">CR: {hoveredChamp.counterIds.map(id => getChampionOfId(id)?.name.split(' ')[0]).join(', ') || 'N/A'}</div>
                      <div className="text-emerald-400 truncate max-w-[120px] sm:max-w-none">SY: {hoveredChamp.synergyIds.map(id => getChampionOfId(id)?.name.split(' ')[0]).join(', ') || 'N/A'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground mx-auto font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-center">
                    <AlertCircle size={10} className="text-primary/70 shrink-0" /> 챔피언 카드에 마우스를 대어 상세 카운터/시너지를 확인하십시오.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RED TEAM PICKS (Col Right: 3 spans) */}
        {(!isMobile || mobileTab === 'STATUS') && (
          <div className="lg:col-span-3 flex flex-col justify-between h-full min-h-0 bg-background/50 border border-border p-2 rounded-xl shadow-inner shadow-black/20">
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 xl:max-h-[calc(100vh-270px)] scrollbar-thin">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-destructive tracking-wider mb-1 uppercase drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]">
                <span>RED TEAM PICKS</span>
                <span>{draftState.redPicks.length} / 5</span>
              </div>
              
              {ROLE_ORDER.map((role, idx) => {
                const isDraftComplete = currentTurn === 'COMPLETE';
                const pickId = isDraftComplete ? redRoleMap[role] : draftState.redPicks[idx];
                const champ = pickId ? getChampionOfId(pickId) : null;
                const slotLabel = isDraftComplete ? role : `PICK #${idx + 1}`;
                
                return (
                  <div 
                    key={`red-pick-${role}`}
                    className={`p-2 rounded-lg border flex items-center justify-between transition-colors h-[44px] ${
                      champ 
                        ? 'bg-destructive/10 border-destructive/40 shadow-[inset_0_0_10px_rgba(var(--destructive),0.05)]' 
                        : 'bg-background/80 border-border/70 border-dashed animate-pulse'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black font-mono text-destructive bg-destructive/20 px-1 py-0.5 rounded border border-destructive/30 shrink-0">
                        {slotLabel}
                      </span>
                      {champ ? (
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[11px] text-foreground leading-tight truncate">{champ.name}</h4>
                          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wide block truncate">
                            STYLE: {champ.style}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground font-mono truncate">선택 대기 중...</span>
                      )}
                    </div>
                    {champ && <span className="text-sm shrink-0">{getLaneEmoji(isDraftComplete ? role : (champ.lane[0] || 'MID'))}</span>}
                  </div>
                );
              })}
            </div>

            {/* Red Bans Bar */}
            <div className="bg-background/30 border border-border p-1.5 rounded-lg mt-2 shadow-inner">
              <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider mb-1 font-bold">RED BANS</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(idx => {
                  const banId = draftState.redBans[idx];
                  const champ = banId ? getChampionOfId(banId) : null;
                  return (
                    <div key={idx} className="w-1/5 aspect-square rounded bg-background border border-border flex items-center justify-center text-[10px] text-muted-foreground truncate" title={champ?.name}>
                      {champ ? (
                        <span className="text-primary font-bold overflow-hidden select-none text-[8px] truncate max-w-[40px] drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
                          🚫 {champ.id === 'ksante' ? '크산' : champ.id === 'azir' ? '아지' : champ.id === 'yone' ? '요네' : champ.id === 'zeri' ? '제리' : champ.id.substring(0,2)}
                        </span>
                      ) : 'B'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTION PANEL & START MATCH RED TRIGGER BUTTON */}
      <div className="bg-card/40 backdrop-blur-md border border-border p-3 sm:px-4 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)] gap-3 shrink-0">
        <div className="flex items-center gap-2.5 max-w-xl text-xs text-muted-foreground">
          <Wand2 size={24} className="text-amber-400 hidden md:block shrink-0 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
          <div className="text-center sm:text-left">
            <p className="font-bold text-foreground">구단 인게임 드래프트 전술 보너스</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              챔피언 간의 카운터(Counter) 관계와 시너지(Synergy) 편성을 자동으로 분석해, 매치 시뮬레이션 진입 시 아군 선수단의 전체 라인전 기량 및 한타 집중도 수치에 곱 연산 가중치가 추가 부여됩니다.
            </p>
          </div>
        </div>

        <div className="flex justify-center sm:justify-end">
          {currentTurn === 'COMPLETE' ? (
            <motion.button
              id="btn-draft-complete-launch"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLaunchMatch}
              className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-3.5 rounded-xl font-black bg-destructive hover:brightness-110 text-destructive-foreground text-sm shadow-[0_0_20px_rgba(var(--destructive),0.4)] cursor-pointer flex items-center justify-center gap-2 transition-all font-heading"
            >
              <Zap size={14} className="animate-pulse" /> 소환사의 협곡 경기 진입하기
            </motion.button>
          ) : (
            <button
              disabled
              className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl font-bold bg-background text-muted-foreground text-[10px] sm:text-xs border border-border cursor-not-allowed opacity-50 shadow-inner shadow-black/50 text-center"
            >
              밴픽 단계를 완주해주십시오 ({10 - draftState.bluePicks.length - draftState.blueBans.length + 10 - draftState.redPicks.length - draftState.redBans.length}단계 남음)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
