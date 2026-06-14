import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Shield, Zap, Sparkles, Target, Swords, HelpCircle, Swords as BattleIcon, Activity, User, Users } from 'lucide-react';
import { Tactics } from '../types';
import { useGameStore } from '../store/useGameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PlayerPerformancePanel } from './PlayerPerformancePanel';
import { Button } from './ui/button';

interface TacticsTabProps {
  tactics: Tactics;
  changeTactics: (newTactics: Partial<Tactics>) => void;
}

export const TacticsTab: React.FC<TacticsTabProps> = ({ tactics, changeTactics }) => {
  const { players, startingLineup, setPlayerPlaystyle } = useGameStore();
  const [activeTab, setActiveTab] = useState('squad');
  const [selectedPlayerRole, setSelectedPlayerRole] = useState<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'>('MID');

  const myRoster = Object.entries(startingLineup).map(([role, playerId]) => {
    const player = players.find(p => p.id === playerId);
    return {
      role: role as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT',
      player
    };
  }).filter((item): item is { role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'; player: NonNullable<typeof item.player> } => item.player !== undefined);

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-background via-background to-primary/10 border border-border rounded-xl p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2 drop-shadow-[0_0_5px_rgba(var(--primary),0.3)]">
              🎯 팀 경기 매니지먼트 전술 보드 (TACTICAL BOARD)
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              드래그 앤 드롭으로 소환사의 협곡 상의 전술을 지시하고, 팀 및 개인 단위의 상세 교전 지침을 하달합니다.<br />
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-inner shadow-black/50 drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]">
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* 5:5 Split Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Pitch View (50%) */}
        <div className="w-full lg:w-1/2 bg-card/40 backdrop-blur-md border border-border rounded-xl p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <Target className="text-primary drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]" size={18} />
              <span className="font-extrabold text-sm uppercase font-mono tracking-wider text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">TACTICAL WHITEBOARD</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">
              초록색 필드는 소환사의 협곡을 형상화합니다.
            </p>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative min-h-[350px]">
            {/* Pitch Visualization */}
            <div className="relative w-full max-w-[320px] aspect-square mx-auto shrink-0 bg-muted/20 border-2 border-border/80 rounded-lg overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center rotate-45 transform-gpu transition-all">
              {/* Base Rift lines */}
              <div className="absolute inset-0 bg-gradient-to-tr from-green-950/40 to-green-900/10 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-full h-full border-t border-r border-primary/20"></div>
              <div className="absolute inset-x-0 h-px bg-primary/20 top-1/2"></div>
              <div className="absolute inset-y-0 w-px bg-primary/20 left-1/2"></div>
              <div className="absolute w-2/3 h-2/3 border border-primary/30 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.1)]"></div>
              
              {/* River */}
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-tr from-transparent via-[#06b6d4]/10 to-transparent w-full h-[80px] top-1/2 -ml-[25px] -mt-[40px] rotate-[-45deg] scale-150 backdrop-blur-sm"></div>

              {/* Focus Role Overlay Areas */}
              {tactics.teamFocusRole === 'TOP' && <div className="absolute top-0 left-0 w-[45%] h-[45%] bg-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.3)] blur-lg rounded-tl-lg"></div>}
              {tactics.teamFocusRole === 'MID' && <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] bg-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.3)] blur-md rounded-full"></div>}
              {tactics.teamFocusRole === 'ADC' && <div className="absolute bottom-0 right-0 w-[45%] h-[45%] bg-destructive/20 shadow-[0_0_40px_rgba(var(--destructive),0.3)] blur-lg rounded-br-lg"></div>}

              {/* Player Chips */}
              <div className="-rotate-45 absolute w-[141%] h-[141%] left-[-20.5%] top-[-20.5%] pointer-events-none">
                {myRoster.map(({ role, player }) => {
                  let posClasses = "";
                  switch(role) {
                    case 'TOP': posClasses = "top-[20%] left-[25%]"; break;
                    case 'JUNGLE': posClasses = "top-[38%] left-[40%]"; break;
                    case 'MID': posClasses = "top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2"; break;
                    case 'ADC': posClasses = "bottom-[20%] right-[30%]"; break;
                    case 'SUPPORT': posClasses = "bottom-[25%] right-[15%]"; break;
                  }
                  const isFocused = tactics.teamFocusRole === role || (tactics.teamFocusRole === 'BALANCED');
                  
                  return (
                    <motion.div 
                      key={role} 
                      drag
                      dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                      whileDrag={{ scale: 1.2, zIndex: 50 }}
                      onClick={() => {
                        setSelectedPlayerRole(role);
                        setActiveTab('player');
                      }}
                      className={`absolute ${posClasses} flex flex-col items-center gap-1.5 transition-all duration-300 pointer-events-auto cursor-grab active:cursor-grabbing ${isFocused ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10' : 'opacity-70 drop-shadow-md z-0 hover:opacity-100'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono font-black text-xs ${isFocused ? 'bg-background border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]' : 'bg-muted border-border text-muted-foreground'}`}>
                        {role[0]}
                      </div>
                      <span className="bg-background/90 px-2 py-0.5 rounded border border-border backdrop-blur-md text-[10px] font-black pointer-events-none whitespace-nowrap shadow-sm">
                        {player.summonerName}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Roster & Settings Views (50%) */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-[500px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-background/60 border border-border w-full p-1 h-auto grid grid-cols-3 shrink-0">
              <TabsTrigger value="squad" className="text-xs font-bold py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Users size={14} className="mr-1.5" /> 스쿼드 폼 확인
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs font-bold py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Swords size={14} className="mr-1.5" /> 팀 단위 지침 설정
              </TabsTrigger>
              <TabsTrigger value="player" className="text-xs font-bold py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <User size={14} className="mr-1.5" /> 선수 디테일 정보
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 relative min-h-0 overflow-y-auto scrollbar-thin">
              {/* Tab 1: Squad List */}
              <TabsContent value="squad" className="h-full m-0 space-y-3 pr-2">
                {myRoster.map(({ role, player }) => {
                  const ovr = Math.round((player.lanePhase + player.mechanics + player.macro + player.teamfight) / 4);
                  const currentPref = player.playstylePreference || 'BALANCED';
                  return (
                    <div key={player.id} className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-4 flex flex-col gap-3 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded shadow-sm bg-primary/10 text-primary border border-primary/20">{role}</span>
                           <div>
                             <h4 className="text-sm font-black text-foreground drop-shadow-sm">{player.summonerName}</h4>
                             <p className="text-[10px] text-muted-foreground font-mono mt-0.5">COND: {Math.round(player.condition)}% | ENERGY: {Math.round(player.energy || 100)}%</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <span className="text-[10px] text-muted-foreground/80 block font-mono font-bold lowercase">ovr</span>
                           <span className="text-lg font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{ovr}</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['AGGRESSIVE', 'BALANCED', 'DEFENSIVE'] as const).map(pref => (
                          <button
                            key={pref}
                            onClick={() => setPlayerPlaystyle(player.id, pref)}
                            className={`py-1.5 px-2 rounded-lg text-[9px] font-black transition-all border ${
                              currentPref === pref
                                ? 'bg-primary/20 border-primary/40 text-primary shadow-[inset_0_0_8px_rgba(var(--primary),0.2)]'
                                : 'bg-background hover:bg-white/5 border-transparent text-muted-foreground'
                            }`}
                          >
                            {pref === 'AGGRESSIVE' ? '⚡ 공격적' : pref === 'DEFENSIVE' ? '🛡️ 수비적' : '⚖️ 중립적'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              {/* Tab 2: Team Instructions */}
              <TabsContent value="team" className="h-full m-0 space-y-6 pr-2">
                {/* MATCH TEMPO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Flame className="text-primary" size={16} />
                    <span className="font-bold text-xs uppercase font-mono tracking-wider text-primary">경기 템포 (GAME TEMPO)</span>
                  </div>
                  <div className="grid gap-2">
                    {[
                      { id: 'EARLY_SNOWBALL', label: '초반 초강수 스노우볼', desc: '초반 교전 유발 및 빠른 시간 내 역전 불가 상태 달성', icon: Zap, color: 'destructive' },
                      { id: 'BALANCED', label: '균형적인 전술 밸런스', desc: '선발 선수들의 자체 기량 및 상황 판단에 완전 위임', icon: Sparkles, color: 'primary' },
                      { id: 'LATE_SCALING', label: '후반 풀밸류 고벨류', desc: '안정적 라인전 후 대형 오브젝트 주변 대규모 한타 유도', icon: Shield, color: 'cyan-400' }
                    ].map(tempo => {
                      const isActive = tactics.gameTempo === tempo.id;
                      const Icon = tempo.icon;
                      // Dynamic class assignments via raw literal logic:
                      const colorBadgeBg = tempo.id === 'EARLY_SNOWBALL' ? 'bg-destructive' : tempo.id === 'LATE_SCALING' ? 'bg-cyan-400' : 'bg-primary';
                      const colorBadgeText = tempo.id === 'EARLY_SNOWBALL' ? 'text-destructive-foreground' : tempo.id === 'LATE_SCALING' ? 'text-cyan-950' : 'text-primary-foreground';
                      const colorBg = tempo.id === 'EARLY_SNOWBALL' ? 'bg-destructive/10' : tempo.id === 'LATE_SCALING' ? 'bg-cyan-400/10' : 'bg-primary/10';
                      const colorBorder = tempo.id === 'EARLY_SNOWBALL' ? 'border-destructive/40' : tempo.id === 'LATE_SCALING' ? 'border-cyan-400/40' : 'border-primary/40';
                      const colorIconBase = tempo.id === 'EARLY_SNOWBALL' ? 'text-destructive' : tempo.id === 'LATE_SCALING' ? 'text-cyan-400' : 'text-primary';
                      
                      return (
                        <button
                          key={tempo.id}
                          onClick={() => changeTactics({ gameTempo: tempo.id as any })}
                          className={`p-4 rounded-xl border transition-all flex items-start gap-4 text-left ${
                            isActive
                              ? `${colorBg} ${colorBorder} shadow-inner`
                              : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isActive ? `${colorBg} ${colorIconBase} border ${colorBorder}` : 'bg-background'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1">
                            <span className={`text-xs font-black block mb-1 ${isActive ? colorIconBase : ''}`}>{tempo.label}</span>
                            <span className="text-[10px] opacity-80 font-mono tracking-tight">{tempo.desc}</span>
                          </div>
                          {isActive && <div className={`text-[9px] px-1.5 py-0.5 rounded font-black ${colorBadgeBg} ${colorBadgeText}`}>ACTIVE</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TEAM FOCUS ROLE */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Swords className="text-amber-400" size={16} />
                    <span className="font-bold text-xs uppercase font-mono tracking-wider text-amber-400">포커스 라인 (FOCUS LANE)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['TOP', 'MID', 'ADC', 'BALANCED'] as const).map(focus => {
                      const isActive = tactics.teamFocusRole === focus;
                      return (
                        <button
                          key={focus}
                          onClick={() => changeTactics({ teamFocusRole: focus })}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isActive
                              ? 'bg-amber-400/10 border-amber-400/50 text-amber-400 font-bold shadow-[0_0_10px_rgba(251,191,36,0.1)] ring-1 ring-amber-400/30'
                              : 'bg-card border-border hover:bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <span className="text-xs uppercase font-mono tracking-wider">{focus}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Player Details Panel */}
              <TabsContent value="player" className="h-full m-0 pr-2">
                <PlayerPerformancePanel defaultRole={selectedPlayerRole} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </div>
  );
};
