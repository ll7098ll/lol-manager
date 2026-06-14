import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CHAMPIONS } from '../data/initialData';
import { solveOptimalRoles } from '../utils/draft';
import { simulateLoLMatch } from '../utils/matchEngine';
import { Trophy, AlertCircle, CheckCircle, Zap, ShieldAlert, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  const blueTeam = teams.find(t => t.id === draftState.blueTeamId)!;
  const redTeam = teams.find(t => t.id === draftState.redTeamId)!;

  const isPlayerBlue = draftState.blueTeamId === playerTeamId;
  const playerTeamColor = isPlayerBlue ? blueTeam.color : redTeam.color;

  const currentTurn = draftState.currentTurn;
  const isBlueTurn = currentTurn.startsWith('BLUE');
  const isRedTurn = currentTurn.startsWith('RED');
  const isBanTurn = currentTurn.includes('BAN');

  const isPlayerTurn = (isBlueTurn && isPlayerBlue) || (isRedTurn && !isPlayerBlue);

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

  const getSlotRoleLabel = (idx: number) => {
    return ROLE_ORDER[idx] || 'SUB';
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
    <div className="min-h-screen xl:h-screen xl:overflow-hidden bg-background text-foreground flex flex-col justify-between font-sans relative p-3 md:p-4 gap-3 selection:bg-primary/30 selection:text-primary">
      
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-transparent to-red-500 opacity-60" />

      {/* HEADER SECTION */}
      <div className="grid grid-cols-3 items-center bg-card/40 backdrop-blur-md border border-border rounded-xl px-4 py-2 shadow-lg mb-2">
        {/* Blue Side Team info */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{blueTeam.logo}</span>
          <div>
            <h3 className="font-black text-foreground text-xs flex items-center gap-1.5 text-blue-400 font-heading">
              {blueTeam.name}
              <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded font-mono shadow-[0_0_5px_rgba(59,130,246,0.2)]">BLUE</span>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">OVR POWER: {blueTeam.tier} Tier</p>
          </div>
        </div>

        {/* Current status display */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 mb-1 text-[9px] font-mono tracking-widest uppercase bg-background border border-border px-2.5 py-0.5 rounded-full text-muted-foreground shadow-inner shadow-black/40">
            <Zap size={10} className="text-amber-400 animate-pulse drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]" /> CHAMPION SELECT PRO
          </div>
          <p className="text-xs font-bold text-foreground drop-shadow-md truncate max-w-[280px]">
            {getTurnMessage()}
          </p>
        </div>

        {/* Red Side Team info */}
        <div className="flex items-center gap-3 justify-end text-right">
          <div>
            <h3 className="font-black text-foreground text-xs flex items-center gap-1.5 justify-end text-red-400 font-heading">
              <span className="text-[9px] bg-red-500/20 text-red-500 border border-red-500/30 px-1 py-0.5 rounded font-mono shadow-[0_0_5px_rgba(239,68,68,0.2)]">RED</span>
              {redTeam.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">OVR POWER: {redTeam.tier} Tier</p>
          </div>
          <span className="text-3xl">{redTeam.logo}</span>
        </div>
      </div>

      {/* CORE BOARD DRAFT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch mb-2">
        
        {/* BLUE TEAM PICKS (Col Left: 3 spans) */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full min-h-0 bg-background/50 border border-border p-1 rounded-xl shadow-inner shadow-black/20">
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
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors h-[48px] ${
                    champ 
                      ? 'bg-primary/10 border-primary/40 shadow-[inset_0_0_10px_rgba(var(--primary),0.1)]' 
                      : 'bg-background/80 border-border/70 border-dashed animate-pulse'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-primary bg-primary/20 px-1.5 py-0.5 rounded border border-primary/40">
                      {slotLabel}
                    </span>
                    {champ ? (
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground leading-tight">{champ.name}</h4>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide">
                          STYLE: {champ.style}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">CHOOSING PRESET...</span>
                    )}
                  </div>
                  {champ && <span className="text-base">{getLaneEmoji(isDraftComplete ? role : (champ.lane[0] || 'MID'))}</span>}
                </div>
              );
            })}
          </div>

          {/* Blue Bans Bar */}
          <div className="bg-background/30 border border-border p-2 rounded-lg mt-2 shadow-inner shadow-black/30">
            <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider mb-1">BLUE BANS</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(idx => {
                const banId = draftState.blueBans[idx];
                const champ = banId ? getChampionOfId(banId) : null;
                return (
                  <div key={idx} className="w-1/5 aspect-square rounded bg-background border border-border flex items-center justify-center text-[10px] text-muted-foreground truncate" title={champ?.name}>
                    {champ ? (
                      <span className="text-destructive font-bold overflow-hidden select-none text-[8px] truncate max-w-[32px] drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]">
                        🚫 {champ.id === 'ksante' ? '크산' : champ.id === 'azir' ? '아지' : champ.id === 'yone' ? '요네' : champ.id === 'zeri' ? '제리' : champ.id.substring(0,2)}
                      </span>
                    ) : 'B'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHAMPION GRID SELECTOR (Col Center: 6 spans) */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-card/30 backdrop-blur-md border border-border p-3 rounded-xl h-full min-h-0 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          
          {currentTurn === 'COMPLETE' ? (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="text-center p-3 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold rounded-full mb-1 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                  <CheckCircle size={12} /> DRAFT PHASE COMPLETED
                </div>
                <h3 className="text-sm font-black text-foreground drop-shadow-md font-heading">
                  소환사 배치 및 라인 스왑 단계
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                  금지 및 선택이 모두 완료되었습니다! 각 슬롯의 챔피언을 감독 전술에 맞춰 최종 스왑할 수 있습니다.
                </p>
              </div>

              {/* Roles Assignment Board */}
              <div className="flex-1 overflow-y-auto space-y-2 bg-background/50 border border-border/80 p-3 rounded-xl shadow-inner scrollbar-thin max-h-[360px] xl:max-h-[calc(100vh-320px)]">
                <div className="flex justify-between items-center px-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-wider uppercase">
                    포지션 및 챔피언 조합 설정
                  </span>
                  <button
                    onClick={() => {
                      const bSolved = solveOptimalRoles(draftState.bluePicks);
                      const rSolved = solveOptimalRoles(draftState.redPicks);
                      setBlueRoleMap(bSolved);
                      setRedRoleMap(rSolved);
                    }}
                    className="text-[9px] px-2 py-1 rounded bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 font-bold transition-all cursor-pointer"
                  >
                    ⚙️ AI 최적 배치 복구
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
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                        isNative 
                          ? 'bg-card/60 border-border/80' 
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Position Icon / Badge */}
                        <span className="text-sm font-black font-mono w-20 text-center py-1 rounded bg-background border border-border shadow-inner text-muted-foreground flex justify-center items-center gap-1 text-[10px]">
                          {getLaneEmoji(role)} {role}
                        </span>
                        
                        <div>
                          {assignedChamp ? (
                            <>
                              <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5 leading-tight">
                                {assignedChamp.name}
                                {isNative ? (
                                  <span className="text-[8px] px-1 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold font-mono">주라인</span>
                                ) : (
                                  <span className="text-[8px] px-1 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold font-mono animate-pulse">타라인</span>
                                )}
                              </h4>
                              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider block mt-0.5">
                                SCALING: {assignedChamp.scaling} • STYLE: {assignedChamp.style}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">미선택</span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Selector to switch */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] text-muted-foreground mr-1 hidden sm:inline-block font-mono">챔피언 스왑:</span>
                        <select
                          value={assignedChampId || ''}
                          onChange={(e) => handleRoleSelectChange(role, e.target.value as any)}
                          className="bg-background text-foreground text-xs font-bold border border-border px-2 py-1.5 rounded-lg shadow-inner shadow-black/40 focus:outline-none focus:border-primary cursor-pointer text-[11px]"
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
              <div className="bg-background/40 border border-border p-3 rounded-xl mt-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center text-muted-foreground gap-2">
                <div className="flex items-start gap-2">
                  <Trophy size={14} className="text-rose-400 opacity-80 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block text-[11px] uppercase font-mono tracking-wider">적장 AI 감독의 라인 배치 완료</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">적 AI도 밴픽 시너지와 카운터 가속을 감안하여 최적의 오프포지션을 계산해 배치했습니다.</p>
                  </div>
                </div>
                
                <div className="flex gap-1 self-end sm:self-auto">
                  {ROLE_ORDER.map(role => {
                    const oppChampId = isPlayerBlue ? redRoleMap[role] : blueRoleMap[role];
                    const oppChamp = getChampionOfId(oppChampId);
                    return (
                      <div 
                        key={`opp-prev-${role}`} 
                        className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-mono font-bold flex flex-col items-center gap-0.5"
                        title={`${role}: ${oppChamp?.name || '미지정'}`}
                      >
                        <span className="text-muted-foreground text-[8px]">{role.substring(0,3)}</span>
                        <span className="text-rose-400">{oppChamp?.name.split(' ')[0] || 'Lulu'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Quick Helper HUD indicator */}
              <div className={`p-2 rounded-xl border text-center text-xs font-bold mb-2.5 shadow-inner shadow-black/20 ${activeTurnColorClass}`}>
                {isPlayerTurn ? '🌟 지금은 감독님의 전술 지시 밴&픽 턴입니다! 결정할 챔피언 카드를 클릭하세요.' : '🔒 상대방 AI 감독이 전술을 구상하는 중입니다. 잠시만 대기해주십시오.'}
              </div>

              {/* Lane & Tier Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-background p-1 rounded-xl border border-border mb-2.5 shadow-inner shadow-black/30">
                {([
                  { id: 'ALL', label: '전체 (ALL)' },
                  { id: 'TOP', label: '🛡️ 탑' },
                  { id: 'JUNGLE', label: '🌿 정글' },
                  { id: 'MID', label: '🔥 미드' },
                  { id: 'ADC', label: '🎯 원딜' },
                  { id: 'SUPPORT', label: '🌊 서폿' },
                  { id: 'OP', label: '✨ OP티어' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id)}
                    className={`flex-1 text-[10px] font-black py-1 px-1.5 rounded-lg transition-all cursor-pointer text-center whitespace-nowrap border ${
                      roleFilter === tab.id
                        ? 'bg-primary/20 text-primary border-primary/40 shadow-[inset_0_0_10px_rgba(var(--primary),0.2)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Grid of Champions */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 overflow-y-auto pr-1 flex-1 xl:max-h-[calc(100vh-320px)] scrollbar-thin">
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
                      whileHover={{ scale: isUsed ? 1 : 1.05 }}
                      whileTap={{ scale: isUsed ? 1 : 0.95 }}
                      className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-between h-[80px] cursor-pointer transition-all ${
                        isUsed 
                          ? 'opacity-20 bg-background border-border brightness-50 grayscale' 
                          : isPlayerTurn
                            ? 'bg-background/60 border-border hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                            : 'bg-background/20 border-border'
                      }`}
                    >
                      <span className="text-[9px] font-mono bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground shadow-inner shadow-black/40">
                        Tier {champ.tier}
                      </span>
                      <span className="font-extrabold text-[10px] text-foreground truncate w-full mt-0.5">
                        {champ.name.split(' ')[0]}
                      </span>
                      <div className="flex gap-1 mt-0.5">
                        {champ.lane.map(l => (
                          <span key={l} className="text-[7.5px] px-1 bg-background border border-border rounded text-muted-foreground font-mono font-bold leading-none shadow-inner shadow-black/50">
                            {l}
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
            <div className="bg-background/80 p-2.5 rounded-lg border border-border mt-2 min-h-[66px] flex items-center justify-between text-xs shadow-inner shadow-black/40">
              {hoveredChamp ? (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <h4 className="font-black text-xs text-primary flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
                      {hoveredChamp.name}
                      <span className="text-[9px] font-mono uppercase tracking-wide bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded shadow-inner shadow-black/20">
                        {hoveredChamp.style} STYLE
                      </span>
                    </h4>
                    <p className="text-[9px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">
                      SCALING: {hoveredChamp.scaling} • LANES: {hoveredChamp.lane.join(', ')}
                    </p>
                  </div>

                  <div className="text-right space-y-0.5 text-[9px] font-mono">
                    <div className="text-destructive drop-shadow-[0_0_2px_rgba(var(--destructive),0.5)]">COUNTER: {hoveredChamp.counterIds.map(id => getChampionOfId(id)?.name.split(' ')[0]).join(', ') || 'N/A'}</div>
                    <div className="text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">SYNERGY: {hoveredChamp.synergyIds.map(id => getChampionOfId(id)?.name.split(' ')[0]).join(', ') || 'N/A'}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground mx-auto font-mono text-[9px] uppercase tracking-wider">
                  <AlertCircle size={12} className="text-primary/70" /> Hover a champion to examine style, metadata counters, and synergies in real-time.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RED TEAM PICKS (Col Right: 3 spans) */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full min-h-0 bg-background/50 border border-border p-1 rounded-xl shadow-inner shadow-black/20">
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
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors h-[48px] ${
                    champ 
                      ? 'bg-destructive/10 border-destructive/40 shadow-[inset_0_0_10px_rgba(var(--destructive),0.1)]' 
                      : 'bg-background/80 border-border/70 border-dashed animate-pulse'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-destructive bg-destructive/20 px-1.5 py-0.5 rounded border border-destructive/40">
                      {slotLabel}
                    </span>
                    {champ ? (
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground leading-tight">{champ.name}</h4>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide">
                          STYLE: {champ.style}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">CHOOSING PRESET...</span>
                    )}
                  </div>
                  {champ && <span className="text-base">{getLaneEmoji(isDraftComplete ? role : (champ.lane[0] || 'MID'))}</span>}
                </div>
              );
            })}
          </div>

          {/* Red Bans Bar */}
          <div className="bg-background/30 border border-border p-2 rounded-lg mt-2 shadow-inner shadow-black/30">
            <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider mb-1">RED BANS</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(idx => {
                const banId = draftState.redBans[idx];
                const champ = banId ? getChampionOfId(banId) : null;
                return (
                  <div key={idx} className="w-1/5 aspect-square rounded bg-background border border-border flex items-center justify-center text-[10px] text-muted-foreground truncate" title={champ?.name}>
                    {champ ? (
                      <span className="text-primary font-bold overflow-hidden select-none text-[8px] truncate max-w-[32px] drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
                        🚫 {champ.id === 'ksante' ? '크산' : champ.id === 'azir' ? '아지' : champ.id === 'yone' ? '요네' : champ.id === 'zeri' ? '제리' : champ.id.substring(0,2)}
                      </span>
                    ) : 'B'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER ACTION PANEL & START MATCH RED TRIGGER BUTTON */}
      <div className="bg-card/40 backdrop-blur-md border border-border px-4 py-2.5 rounded-xl flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5 max-w-xl text-xs text-muted-foreground">
          <Wand2 size={24} className="text-amber-400 hidden md:block drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
          <div>
            <p className="font-bold text-foreground">구단 인게임 드래프트 전술 보너스</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              챔피언 간의 카운터(Counter) 관계와 시너지(Synergy) 편성을 자동으로 분석해, 매치 시뮬레이션 진입 시 아군 선수단의 전체 라인전 기량 및 한타 집중도 수치에 곱 연산 가중치가 추가 부여됩니다.
            </p>
          </div>
        </div>

        <div>
          {currentTurn === 'COMPLETE' ? (
            <motion.button
              id="btn-draft-complete-launch"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLaunchMatch}
              className="px-8 py-3.5 rounded-xl font-black bg-destructive hover:brightness-110 text-destructive-foreground text-sm shadow-[0_0_20px_rgba(var(--destructive),0.4)] cursor-pointer flex items-center gap-2 transition-all font-heading"
            >
              <Zap size={14} className="animate-pulse" /> 소환사의 협곡 경기 진입하기 (Enter)
            </motion.button>
          ) : (
            <button
              disabled
              className="px-6 py-3.5 rounded-xl font-bold bg-background text-muted-foreground text-xs border border-border cursor-not-allowed opacity-50 shadow-inner shadow-black/50"
            >
              밴픽 단계를 완주해주십시오 ({10 - draftState.bluePicks.length - draftState.blueBans.length + 10 - draftState.redPicks.length - draftState.redBans.length}단계 남음)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
