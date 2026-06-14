import { formatCurrency } from "../utils/format";
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Award, 
  UserPlus, 
  DollarSign, 
  ShieldAlert,
  Dumbbell
} from 'lucide-react';

export const SpotlightCarousel: React.FC = () => {
  const { players, teams, playerTeamId, buyPlayer } = useGameStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter possible spotlight players: Free Agents or other region star players
  const spotlightCandidates = React.useMemo(() => {
    // Top active recruit recommendations
    const faPlayers = players.filter(p => p.teamId === 'FA');
    const globalStars = players.filter(p => p.teamId !== playerTeamId && p.teamId !== 'FA' && ['blg', 'g2', 'c9'].includes(p.teamId));
    
    // Sort combined pool by overall rating descending
    const candidates = [...faPlayers, ...globalStars].sort((a, b) => {
      const overallA = Math.round((a.lanePhase + a.mechanics + a.macro + a.teamfight) / 4);
      const overallB = Math.round((b.lanePhase + b.mechanics + b.macro + b.teamfight) / 4);
      return overallB - overallA;
    });

    return candidates.slice(0, 5); // top 5 players for the carousel billboard
  }, [players, playerTeamId]);

  // Handle slide transition next and back
  const handleNext = () => {
    setSlideDirection('right');
    setCurrentIndex((prev) => (prev + 1) % spotlightCandidates.length);
  };

  const handlePrev = () => {
    setSlideDirection('left');
    setCurrentIndex((prev) => (prev - 1 + spotlightCandidates.length) % spotlightCandidates.length);
  };

  // Auto layout scroll logic: slide every 8 seconds unless interacted
  useEffect(() => {
    if (spotlightCandidates.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 8500);
    return () => clearInterval(interval);
  }, [spotlightCandidates.length]);

  if (spotlightCandidates.length === 0) return null;

  const currentPlayer = spotlightCandidates[currentIndex];
  const overall = Math.round(
    (currentPlayer.lanePhase + currentPlayer.mechanics + currentPlayer.macro + currentPlayer.teamfight) / 4
  );

  // Get current owner team
  const currentTeam = teams.find(t => t.id === currentPlayer.teamId);
  const currentTeamName = currentPlayer.teamId === 'FA' ? '자유계약 (FA)' : (currentTeam?.name || '해외 영입');
  const currentTeamLogo = currentPlayer.teamId === 'FA' ? '✨' : (currentTeam?.logo || '🛡️');

  // Calculate recruit buyout fee
  const isFreeAgent = currentPlayer.teamId === 'FA';
  const buyoutFee = isFreeAgent ? Math.floor(currentPlayer.salary * 0.5) : Math.floor(currentPlayer.salary * 1.5);

  const handleBuyout = () => {
    const result = buyPlayer(currentPlayer.id);
    if (result.success) {
      setSuccessMsg(result.message);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(result.message);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Color theme mapping depending on player's role for glowing accents
  const getRoleColors = (role: string) => {
    switch (role) {
      case 'TOP':
        return {
          glow: 'rgba(59, 130, 246, 0.25)', // Blue
          border: 'border-blue-500/30',
          text: 'text-blue-400 bg-blue-500/10',
          accent: 'blue'
        };
      case 'JUNGLE':
        return {
          glow: 'rgba(16, 185, 129, 0.25)', // Emerald
          border: 'border-emerald-500/30',
          text: 'text-emerald-400 bg-emerald-500/10',
          accent: 'emerald'
        };
      case 'MID':
        return {
          glow: 'rgba(249, 115, 22, 0.25)', // Orange
          border: 'border-orange-500/30',
          text: 'text-orange-400 bg-orange-500/10',
          accent: 'orange'
        };
      case 'ADC':
        return {
          glow: 'rgba(220, 38, 38, 0.25)', // Destructive
          border: 'border-destructive/30',
          text: 'text-destructive bg-destructive/10',
          accent: 'destructive'
        };
      case 'SUPPORT':
        return {
          glow: 'rgba(34, 211, 238, 0.25)', // Cyan
          border: 'border-cyan-500/30',
          text: 'text-cyan-400 bg-cyan-400/10',
          accent: 'cyan'
        };
      default:
        return {
          glow: 'rgba(220, 38, 38, 0.25)',
          border: 'border-border',
          text: 'text-muted-foreground',
          accent: 'slate'
        };
    }
  };

  const themeColors = getRoleColors(currentPlayer.role);

  return (
    <div className="relative overflow-hidden bg-card/40 backdrop-blur-md border border-border rounded-xl p-4 shadow-inner shadow-black/20 flex flex-col justify-between h-full min-h-[340px] xl:h-auto select-none">
      
      {/* Background radial spotlight match */}
      <div 
        className="absolute -right-20 -top-20 w-56 h-56 rounded-full filter blur-[80px] opacity-20 pointer-events-none transition-all duration-500 z-0"
        style={{ backgroundColor: themeColors.glow }}
      />

      <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary animate-pulse drop-shadow-[0_0_5px_rgba(var(--primary),0.6)]" size={16} />
          <h3 className="font-extrabold text-xs md:text-sm uppercase font-mono tracking-wider text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.6)]">
            실시간 FA 및 특급 이적시장 추천 (RECOMMENDED STARS)
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">
            {currentIndex + 1} / {spotlightCandidates.length}
          </span>
        </div>
      </div>

      {/* Slide body with Animation */}
      <div className="relative flex-1 flex flex-col min-h-0 justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, x: slideDirection === 'right' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection === 'right' ? -30 : 30 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col md:grid md:grid-cols-12 gap-4 items-stretch h-full relative z-10"
          >
            {/* Player Main Bio (Grid 5/12) */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded leading-none border shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] ${themeColors.border} ${themeColors.text}`}>
                    {currentPlayer.role}
                  </span>
                  <span className="text-[9px] font-semibold bg-background border border-border/80 text-muted-foreground px-2 py-0.5 rounded-sm uppercase tracking-wide shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]">
                    {currentPlayer.age}세 • {currentPlayer.potential ? `잠재 OVR ${currentPlayer.potential}` : '성장 완성형'}
                  </span>
                </div>
                
                <h4 className="text-2xl font-black text-foreground leading-tight flex items-baseline gap-1.5 drop-shadow-sm">
                  {currentPlayer.summonerName}
                  <span className="text-xs text-muted-foreground font-normal font-sans">({currentPlayer.name})</span>
                </h4>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-bold">
                    <span>소속:</span>
                    <span className="text-foreground flex items-center gap-1">
                      <span>{currentTeamLogo}</span>
                      <span>{currentTeamName}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-bold">
                    <span className="font-mono">연봉:</span>
                    <span className="text-primary font-mono font-black drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
                      {formatCurrency(currentPlayer.salary)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-bold">
                    <span>영입 비용:</span>
                    <span className="text-emerald-400 font-mono font-black drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">
                      {formatCurrency(buyoutFee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recruitment Notification Overlay if processed */}
              <div className="mt-4">
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-2 py-1.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] rounded-lg font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                    {successMsg}
                  </motion.div>
                )}
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-2 py-1.5 bg-destructive/20 border border-destructive/50 text-destructive text-[10px] rounded-lg font-bold leading-normal flex items-start gap-1 shadow-[0_0_15px_rgba(var(--destructive),0.2)]">
                    <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
                
                {(!successMsg && !errorMsg) && (
                  <button
                    id={`btn-carousel-recruit-${currentPlayer.id}`}
                    onClick={handleBuyout}
                    className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                  >
                    <UserPlus size={14} />
                    <span>이 선수 즉시 영입하기 (체결 계약)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Player Detailed attributes & Bar Charts (Grid 7/12) */}
            <div className="md:col-span-7 flex flex-col justify-center bg-background/60 p-3 rounded-xl border border-border font-mono shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider">CORE ABILITY SPECS</span>
                <div className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded text-xs font-black shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]">
                  <Award size={12} />
                  <span>OVR {overall}</span>
                </div>
              </div>

              {/* Custom bars */}
              <div className="space-y-2.5">
                {[
                  { label: '라인전 능력 (LANING)', value: currentPlayer.lanePhase, color: 'from-amber-600 to-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' },
                  { label: '물리 피지컬 (PHYSICAL)', value: currentPlayer.mechanics, color: 'from-destructive to-destructive shadow-[0_0_5px_rgba(var(--destructive),0.5)]' },
                  { label: '운영 마인드 (MACRO)', value: currentPlayer.macro, color: 'from-emerald-600 to-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' },
                  { label: '교전 합류타 (TEAMFIGHT)', value: currentPlayer.teamfight, color: 'from-blue-600 to-blue-500 shadow-[0_0_5px_rgba(37,99,235,0.5)]' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/80">
                      <span>{stat.label}</span>
                      <span className="text-foreground/80 font-extrabold drop-shadow-sm">{stat.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dialog Master Mastery block */}
              <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground/80 font-bold block">조커 스페셜리스트 마스터리 챔피언군</span>
                <div className="flex gap-1">
                  {Object.keys(currentPlayer.championPool).slice(0, 3).map((id) => (
                    <span key={id} className="text-[9px] font-bold bg-background border border-border px-2 py-0.5 rounded text-foreground/80 uppercase shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Dots & Arrow Buttons */}
      <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-3 shrink-0 relative z-10">
        <div className="flex gap-1">
          {spotlightCandidates.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSlideDirection(idx > currentIndex ? 'right' : 'left');
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer shadow-inner ${
                currentIndex === idx 
                  ? 'bg-primary w-3 shadow-[0_0_8px_rgba(var(--primary),0.8)]' 
                  : 'bg-muted-foreground/30 hover:bg-primary/50'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={handlePrev}
            className="p-1 px-2.5 rounded-lg bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shadow-[inset_0_0_8px_rgba(0,0,0,0.2)]"
            aria-label="Previous player"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            className="p-1 px-2.5 rounded-lg bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shadow-[inset_0_0_8px_rgba(0,0,0,0.2)]"
            aria-label="Next player"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
