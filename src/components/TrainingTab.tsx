import React, { useState } from 'react';
import { Player } from '../types';
import { useGameStore } from '../store/useGameStore';
import { Target, Swords, Brain, Move, Zap, Crosshair, Sparkles, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrainingTabProps {
  playerTeamId: string | null;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({ playerTeamId }) => {
  const { players, trainingPoints, allocateTrainingPoints, setPlayerTrainingFocus } = useGameStore();
  const playerRoster = players.filter(p => p.teamId === playerTeamId);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleAllocate = (playerId: string, statType: 'lanePhase' | 'mechanics' | 'macro' | 'teamfight', summonerName: string, statNameKor: string) => {
    const response = allocateTrainingPoints(playerId, statType, 1);
    if (!response.success) {
      showNotification(response.message, 'error');
    } else {
      showNotification(`${summonerName} 선수의 [${statNameKor}] 능력치를 성공적으로 특훈시켰습니다! (+1)`, 'success');
    }
  };

  const handleFocusChange = (playerId: string, summonerName: string, focusValue: string, focusLabel: string) => {
    setPlayerTrainingFocus(playerId, focusValue as any);
    showNotification(`${summonerName} 선수의 집중 훈련 분야를 [${focusLabel}] 코스로 편입 및 전술 배치했습니다.`, 'success');
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold leading-normal shadow-[0_4px_25px_rgba(0,0,0,0.5)] z-50 ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]'
                : 'bg-destructive/10 border-destructive/40 text-destructive shadow-[inset_0_0_15px_rgba(var(--destructive),0.1)]'
            }`}
          >
            {notification.type === 'success' ? <Sparkles size={16} className="drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> : <ShieldAlert size={16} className="drop-shadow-[0_0_5px_rgba(var(--destructive),0.8)]" />}
            <span className="whitespace-pre-wrap">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2 drop-shadow-sm">
            💪 선수 성장 및 특훈 (TRAINING CENTER)
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            소속 구단 선수들의 핵심 능력치를 직접 훈련 포인트를 투자하여 영구적으로 성장시킬 수 있습니다.
          </p>
        </div>
        <div className="bg-background px-4 py-2.5 rounded-xl border border-border text-center shrink-0 min-w-[120px] shadow-inner shadow-black/50">
          <span className="text-[9px] text-muted-foreground font-black block mb-0.5 tracking-wider uppercase">보유 훈련 포인트</span>
          <span className="text-2xl font-mono font-black text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">{trainingPoints} <span className="text-xs uppercase text-muted-foreground/80">PT</span></span>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin pb-4">
        {playerRoster.map(p => {
          const overall = Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight) / 4);
          
          return (
            <div key={p.id} className="bg-card/20 backdrop-blur-sm border border-border p-4 rounded-xl flex flex-col xl:flex-row gap-5 hover:border-primary/50 transition shadow-inner shadow-black/20 hover:shadow-[0_0_15px_rgba(var(--primary),0.15)]">
              
              <div className="flex-shrink-0 xl:w-44 xl:border-r border-border/60 xl:pr-4 flex flex-col justify-center">
                <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded leading-none w-fit border shadow-inner shadow-black/30 ${
                  p.role === 'MID' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                  p.role === 'TOP' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                  p.role === 'JUNGLE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  p.role === 'ADC' ? 'text-destructive bg-destructive/10 border-destructive/20' :
                  'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
                }`}>
                  {p.role}
                </span>
                <h4 className="font-extrabold text-base text-foreground mt-1.5 flex items-baseline gap-1 drop-shadow-sm">
                  {p.summonerName}
                  <span className="text-[10px] text-muted-foreground font-normal">({p.name})</span>
                </h4>
                <div className="mt-2 text-xs font-mono font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded w-fit shadow-inner shadow-black/30 drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">
                  OVR {overall}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                
                {/* TRAINING FOCUS AND PROGRESS SECTOR */}
                <div className="bg-background/80 border border-border p-3.5 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-inner shadow-black/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Target size={13} className="text-primary animate-pulse drop-shadow-[0_0_5px_rgba(var(--primary),0.6)]" />
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        집중 특훈 코스 (Training Focus Schedule)
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 leading-normal max-w-lg">
                      일과가 지나가며 점진적 훈련량이 누적되며, 100% 성장 시 해당 분야 스탯이 영구히 1 증가합니다.
                    </p>
                  </div>

                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full lg:w-auto">
                    {/* Course selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-bold whitespace-nowrap">훈련과정:</span>
                      <select
                        value={p.trainingFocus || 'BALANCED'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const labelMap = {
                            BALANCED: '밸런스 종합 훈련',
                            LANING: '라인전 정밀 디테일',
                            MECHANICS: '피지컬 고강도 솔로랭크',
                            MACRO: '운영 구도 및 맥락 마스터',
                            TEAMFIGHT: '한타 교전 집중 심화',
                            VISION: '시야 장악력 향상',
                            MENTAL: '멘탈 복원력 및 평정심'
                          };
                          handleFocusChange(p.id, p.summonerName, val, labelMap[val as keyof typeof labelMap]);
                        }}
                        className="bg-background/50 border border-border text-foreground text-[11px] font-black py-1.5 px-3 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer shadow-inner shadow-black/30"
                      >
                        <option value="BALANCED">⚖️ 밸런스 종합 훈련 (Balanced)</option>
                        <option value="LANING">🎯 라인전 정밀 디테일 (Laning)</option>
                        <option value="MECHANICS">⚡ 피지컬 고강도 피지컬 (Mechanics)</option>
                        <option value="MACRO">🧠 운영 구도 및 맥락 (Macro)</option>
                        <option value="TEAMFIGHT">⚔️ 한타 교전 집중 심화 (Teamfight)</option>
                        <option value="VISION">👁️ 시야 장악력 향상 (Vision)</option>
                        <option value="MENTAL">❤️ 멘탈 복원력 및 평정심 (Mental)</option>
                      </select>
                    </div>

                    {/* Progress details */}
                    <div className="flex-1 sm:flex-initial sm:w-44 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono leading-none">
                        <span className="text-muted-foreground font-bold">누적 진행 성장도</span>
                        <span className="text-primary font-black drop-shadow-sm">{p.trainingProgress !== undefined ? p.trainingProgress : 0}%</span>
                      </div>
                      <div className="w-full h-3 bg-muted/30 rounded flex overflow-hidden border border-border/50 relative shadow-inner shadow-black/40 gap-0.5 p-0.5">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className={`flex-1 rounded-sm transition-all duration-500 ${(p.trainingProgress || 0) > i * 10 ? 'bg-primary shadow-[0_0_5px_rgba(var(--primary),0.8)]' : 'bg-muted/50'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Lane Phase */}
                <div className="bg-background/60 p-3 rounded-lg border border-border/60 flex flex-col justify-between shadow-inner shadow-black/30">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Crosshair size={12} className="text-blue-400" />
                        <span>라인전 능성 (Laning)</span>
                      </span>
                      <span className="text-xs font-black text-foreground font-mono">{p.lanePhase}</span>
                    </div>
                    <div className="w-full bg-muted/50 h-1 rounded-full overflow-hidden shadow-inner shadow-black/50">
                      <div className="bg-blue-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ width: `${(p.lanePhase / 99) * 100}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAllocate(p.id, 'lanePhase', p.summonerName, '라인전 능력')}
                    disabled={trainingPoints < 1 || p.lanePhase >= 99}
                    className="w-full mt-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500 hover:text-blue-950 text-blue-400 text-[10px] font-black tracking-wider transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]"
                  >
                    +1 능력치 부여 (1 PT)
                  </button>
                </div>

                {/* Mechanics */}
                <div className="bg-background/60 p-3 rounded-lg border border-border/60 flex flex-col justify-between shadow-inner shadow-black/30">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Zap size={12} className="text-emerald-450" />
                        <span>피지컬 포커스 (Physic)</span>
                      </span>
                      <span className="text-xs font-black text-foreground font-mono">{p.mechanics}</span>
                    </div>
                    <div className="w-full bg-muted/50 h-1 rounded-full overflow-hidden shadow-inner shadow-black/50">
                      <div className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]" style={{ width: `${(p.mechanics / 99) * 100}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAllocate(p.id, 'mechanics', p.summonerName, '피지컬 포커스')}
                    disabled={trainingPoints < 1 || p.mechanics >= 99}
                    className="w-full mt-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-emerald-950 text-emerald-400 text-[10px] font-black tracking-wider transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[inset_0_0_8px_rgba(52,211,153,0.1)]"
                  >
                    +1 능력치 부여 (1 PT)
                  </button>
                </div>

                {/* Macro */}
                <div className="bg-background/60 p-3 rounded-lg border border-border/60 flex flex-col justify-between shadow-inner shadow-black/30">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Brain size={12} className="text-amber-500" />
                        <span>운영 마인드 (Macro)</span>
                      </span>
                      <span className="text-xs font-black text-foreground font-mono">{p.macro}</span>
                    </div>
                    <div className="w-full bg-muted/50 h-1 rounded-full overflow-hidden shadow-inner shadow-black/50">
                      <div className="bg-amber-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]" style={{ width: `${(p.macro / 99) * 100}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAllocate(p.id, 'macro', p.summonerName, '운영 마인드')}
                    disabled={trainingPoints < 1 || p.macro >= 99}
                    className="w-full mt-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-amber-950 text-amber-500 text-[10px] font-black tracking-wider transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]"
                  >
                    +1 능력치 부여 (1 PT)
                  </button>
                </div>

                {/* Teamfight */}
                <div className="bg-background/60 p-3 rounded-lg border border-border/60 flex flex-col justify-between shadow-inner shadow-black/30">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Swords size={12} className="text-destructive" />
                        <span>교전 참여력 (Fight)</span>
                      </span>
                      <span className="text-xs font-black text-foreground font-mono">{p.teamfight}</span>
                    </div>
                    <div className="w-full bg-muted/50 h-1 rounded-full overflow-hidden shadow-inner shadow-black/50">
                      <div className="bg-destructive h-full transition-all duration-300 shadow-[0_0_8px_rgba(var(--destructive),0.6)]" style={{ width: `${(p.teamfight / 99) * 100}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAllocate(p.id, 'teamfight', p.summonerName, '교전 참여력')}
                    disabled={trainingPoints < 1 || p.teamfight >= 99}
                    className="w-full mt-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground text-destructive text-[10px] font-black tracking-wider transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[inset_0_0_8px_rgba(var(--destructive),0.1)]"
                  >
                    +1 능력치 부여 (1 PT)
                  </button>
                </div>

              </div>
            </div>
          </div>
          );
        })}

        {playerRoster.length === 0 && (
          <div className="text-center py-10 bg-background/40 border border-border rounded-xl text-muted-foreground/60 text-xs shadow-inner shadow-black/20">
            현재 훈련을 진행할 소속팀 로스터가 등록되어 있지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
};
