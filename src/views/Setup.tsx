import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { INITIAL_TEAMS, INITIAL_PLAYERS } from '../data/initialData';
import { Trophy, Users, Landmark, ChevronRight, Zap, Target, Shield, Flame, Swords, Sparkles, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../hooks/use-mobile';

export default function Setup() {
  const [selectedId, setSelectedId] = useState('t1');
  const [mobileStep, setMobileStep] = useState<'LIST' | 'DETAILS'>('LIST');
  const isMobile = useIsMobile();
  const initializeGame = useGameStore(state => state.initializeGame);

  const activeTeam = INITIAL_TEAMS.find(t => t.id === selectedId)!;
  const teamPlayers = INITIAL_PLAYERS.filter(p => p.teamId === selectedId);

  // Calculate team average stats
  const avgStat = (statName: 'lanePhase' | 'mechanics' | 'macro' | 'teamfight') => {
    const sum = teamPlayers.reduce((acc, p) => acc + p[statName], 0);
    return Math.round(sum / teamPlayers.length);
  };

  const currentYear = 2026;

  // Render a customized rating emblem grade (S, A, B...)
  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'S': return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'A': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'B': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 md:p-6 lg:p-8 font-sans relative selection:bg-primary/30 selection:text-primary">
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full filter blur-[200px] opacity-[0.15] transition-all duration-1000 pointer-events-none"
        style={{ backgroundColor: activeTeam.color }}
      />

      {/* Decorative Matrix grid style background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="inline-flex items-center gap-2 mb-2.5 bg-secondary border border-border px-4 py-1.5 rounded-full text-xs font-mono tracking-wider text-primary uppercase shadow-lg shadow-black/40">
          <Zap size={14} className="animate-pulse text-primary" />
          <span>eSPORTS TACTICS ENGINE v1.25</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase font-heading">
          <span className="bg-gradient-to-br from-white to-muted-foreground bg-clip-text text-transparent">LoL MANAGER</span>{' '}
          <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.4)]">2026</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          당신의 최고 존엄한 구단 지휘관 전설이 시작됩니다. 최고의 밴픽 모의전과 실시간 주간 트레이너 워크숍을 가동하여 전설적인 전당에 영구 소유팀을 장식하십시오.
        </p>
      </motion.header>

      {/* Main Selector */}
      <div className="my-4 xl:my-2 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10 flex-1 min-h-0">
        
        {/* Teams List (Column Left) */}
        {(!isMobile || mobileStep === 'LIST') && (
          <div className="lg:col-span-5 space-y-2 w-full flex flex-col min-h-0">
            <div className="flex justify-between items-center px-1 mb-1.5">
              <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">원하시는 구단을 선택하십시오</p>
              <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground font-mono">10 구단 준비 완료</span>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 xl:max-h-[calc(100vh-240px)] scrollbar-thin">
              {INITIAL_TEAMS.map((team, idx) => {
                const isSelected = team.id === selectedId;
                return (
                  <motion.button
                    key={team.id}
                    id={`btn-select-team-${team.id}`}
                    onClick={() => {
                      setSelectedId(team.id);
                      if (isMobile) {
                        setMobileStep('DETAILS');
                      }
                    }}
                    whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between border transition-all cursor-pointer backdrop-blur-sm ${
                      isSelected 
                        ? 'bg-card border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.15)] ring-1 ring-primary/30' 
                        : 'bg-card/40 border-border hover:border-primary/50'
                    }`}
                    style={{
                      borderLeftWidth: isSelected ? '5px' : '1px',
                      borderLeftColor: isSelected ? team.color : undefined
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <span 
                        className="text-3xl p-1.5 rounded-lg bg-background border border-border"
                        style={{ boxShadow: isSelected ? `0 0 20px ${team.color}40` : undefined }}
                      >
                        {team.logo}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                          {team.name}
                          <span className={`text-[9px] px-1.5 rounded font-black font-mono leading-relaxed ${getTierBadgeClass(team.tier)}`}>
                            {team.tier} TIER
                          </span>
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2 font-mono">
                          <span>팬 <strong className="text-foreground">{(team.fans / 10000).toLocaleString()}만명</strong></span>
                          <span className="text-border">•</span>
                          <span>예산 <strong className="text-emerald-400">{(team.budget / 10000).toFixed(1)}억원</strong></span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isSelected ? 'translate-x-1 text-primary' : ''}`} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Team details card (Column Right) */}
        {(!isMobile || mobileStep === 'DETAILS') && (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTeam.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.18 }}
              className="lg:col-span-7 bg-card/60 border border-border rounded-2xl p-6 flex flex-col justify-between h-auto backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              {/* Subtle giant logo watermark in background */}
              <span className="absolute -right-10 -bottom-10 text-[180px] select-none opacity-5 pointer-events-none filter grayscale animate-[pulse_6s_infinite]">
                {activeTeam.logo}
              </span>

              {isMobile && (
                <button
                  onClick={() => setMobileStep('LIST')}
                  className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono font-bold border border-border bg-background px-3 py-1.5 rounded-lg cursor-pointer transition-colors w-fit shrink-0 relative z-10"
                >
                  ← 다른 구단 선택하기
                </button>
              )}

              <div>
                {/* Team Branding Banner Area */}
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border/60">
                  <span className="text-5xl p-2.5 rounded-2xl bg-background border border-border text-center shadow-lg">
                    {activeTeam.logo}
                  </span>
                  <div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                      <Crown size={10} className="text-primary" />
                      <span>LCK OFFICIAL ROSTER & DEPLOYMENT</span>
                    </div>
                    <h2 className="text-3xl font-black text-foreground mt-1 leading-tight flex items-center gap-2 font-heading">
                      {activeTeam.name}
                    </h2>
                  </div>
                </div>

                {/* Grid Core Stats with beautiful border glows */}
                <div className="grid grid-cols-3 gap-3.5 mb-5">
                  <div className="bg-background/80 p-3 rounded-xl border border-border shadow-inner shadow-black/40 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Trophy size={13} className="text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                      <span className="text-[10px] font-extrabold font-mono tracking-wide">구단 인지도</span>
                    </div>
                    <div className="text-2xl font-black text-primary font-mono mt-1.5 flex items-baseline gap-1 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                      {activeTeam.tier}
                      <span className="text-[10px] font-sans font-normal text-muted-foreground drop-shadow-none">Tier</span>
                    </div>
                  </div>

                  <div className="bg-background/80 p-3 rounded-xl border border-border shadow-inner shadow-black/40 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users size={13} className="text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]" />
                      <span className="text-[10px] font-extrabold font-mono tracking-wide">대표 연고팬 수</span>
                    </div>
                    <div className="text-xl font-black text-foreground font-mono mt-1.5">
                      {(activeTeam.fans / 10000).toLocaleString()}<span className="text-xs text-muted-foreground ml-0.5 font-sans font-normal">만명</span>
                    </div>
                  </div>

                  <div className="bg-background/80 p-3 rounded-xl border border-border shadow-inner shadow-black/40 flex flex-col justify-between" style={{ borderColor: `${activeTeam.color}40`, boxShadow: `inset 0 2px 10px rgba(0,0,0,0.5), inset 0 0 20px ${activeTeam.color}15` }}>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Landmark size={13} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                      <span className="text-[10px] font-extrabold font-mono tracking-wide">가용 시작 예산</span>
                    </div>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-1.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                      {(activeTeam.budget / 10000).toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5 font-sans font-normal drop-shadow-none">억원</span>
                    </div>
                  </div>
                </div>

                {/* Team Attributes / Roster Details */}
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between items-center pl-1">
                    <h4 className="text-[10px] font-mono tracking-widest text-primary uppercase drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]">LINE ROSTER & POWER LEVEL</h4>
                    <span className="text-[10px] text-muted-foreground font-mono font-bold">평균 전술 레벨</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                    {[
                      { label: 'LANING', value: avgStat('lanePhase'), color: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/5' },
                      { label: 'PHYSICAL', value: avgStat('mechanics'), color: 'text-destructive border-destructive/30 bg-destructive/5' },
                      { label: 'MACRO', value: avgStat('macro'), color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
                      { label: 'TEAMFIGHT', value: avgStat('teamfight'), color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' }
                    ].map((stat, i) => (
                      <div key={i} className={`p-2 rounded-lg border text-center ${stat.color} shadow-inner shadow-black/20`}>
                        <span className="opacity-70 block text-[9px] tracking-tight">{stat.label}</span>
                        <span className="font-black text-base leading-none block mt-1 drop-shadow-md">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Roster Listing */}
                  <div className="grid grid-cols-5 gap-1 xs:gap-2 pt-1">
                    {teamPlayers.map(p => (
                      <div key={p.id} className="bg-background p-1.5 xs:p-2 rounded-xl text-center border border-border flex flex-col justify-between h-full hover:border-primary/40 transition hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] cursor-default shadow-inner shadow-black/20">
                        <span className={`text-[7px] xs:text-[8.5px] font-mono font-black mx-auto px-1 xs:px-1.5 py-0.5 rounded border ${
                          p.role === 'MID' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          p.role === 'TOP' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          p.role === 'JUNGLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          p.role === 'ADC' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          {p.role}
                        </span>
                        <p className="font-extrabold text-[9px] xs:text-xs mt-1.5 text-foreground truncate max-w-full" title={p.name}>{p.summonerName}</p>
                        <p className="text-[8px] xs:text-[9px] text-muted-foreground font-mono mt-0.5">OVR {Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight)/4)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-4">
                <motion.button
                  id="btn-confirm-team"
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => initializeGame(activeTeam.id)}
                  className="w-full py-3.5 rounded-xl font-extrabold text-white text-center cursor-pointer transition text-sm relative overflow-hidden group shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] ring-1 ring-white/20"
                  style={{ 
                    backgroundColor: activeTeam.color,
                  }}
                >
                  {/* Visual shine animate effect */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{activeTeam.name} 구단 감독 임명 수락하기</span>
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-[10px] text-muted-foreground font-mono mt-3 opacity-60">
        © {currentYear} LCK MANAGER SIMULATOR. PROUDLY DEVELOPED IN HIGH-FIDELITY INTERACTION FOR ESPORTS SUPPORTERS.
      </footer>
    </div>
  );
}
