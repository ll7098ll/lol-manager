import React, { useState } from 'react';
import { Player } from '../../types';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, CheckCircle, Loader2, Check, AlertCircle, Dumbbell } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useIsMobile } from '../../hooks/use-mobile';
import { motion, AnimatePresence } from 'motion/react';

interface RosterTabProps {
  playerRoster: Player[];
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  restRoster: () => void;
  coachingActionsLeft: number;
  trainPlayerIndividual: (playerId: string, programId: string) => { success: boolean; message: string } | undefined;
  trainingLoader: {
    playerId: string;
    programId: string;
    status: 'idle' | 'loading' | 'success' | 'error';
  } | null;
  setTrainingLoader: (loader: any) => void;
  setTrainingFeedback: (feedback: any) => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  playerRoster,
  selectedPlayerId,
  setSelectedPlayerId,
  restRoster,
  coachingActionsLeft,
  trainPlayerIndividual,
  trainingLoader,
  setTrainingLoader,
  setTrainingFeedback,
}) => {
  const isMobile = useIsMobile();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const handleIntensiveTraining = (playerId: string, programId: string) => {
    if (trainingLoader) return;
    
    setTrainingLoader({ playerId, programId, status: 'loading' });
    
    setTimeout(() => {
      const res = trainPlayerIndividual(playerId, programId);
      if (res) {
        if (res.success) {
          setTrainingLoader({ playerId, programId, status: 'success' });
          setTimeout(() => {
            setTrainingLoader(null);
          }, 1500);
        } else {
          setTrainingLoader({ playerId, programId, status: 'error' });
          setTimeout(() => {
            setTrainingLoader(null);
          }, 1500);
        }
        setTrainingFeedback({ message: res.message, success: res.success });
        setTimeout(() => {
          setTrainingFeedback(null);
        }, 5000);
      } else {
        setTrainingLoader(null);
      }
    }, 700);
  };

  const selectedPlayer = playerRoster.find(x => x.id === selectedPlayerId) || playerRoster[0];

  const renderDetailContents = (p: Player) => {
    const overall = Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight) / 4);
    const radarData = [
      { subject: 'Laning', A: p.lanePhase, fullMark: 100 },
      { subject: 'Mechanics', A: p.mechanics, fullMark: 100 },
      { subject: 'Macro', A: p.macro, fullMark: 100 },
      { subject: 'Teamfight', A: p.teamfight, fullMark: 100 },
      { subject: 'Potential', A: p.potential || 99, fullMark: 120 }
    ];

    const renderActionButton = (programId: 'LANING' | 'SOLOQ' | 'MACRO' | 'SCRIMS' | 'MINDSET' | 'REST', defaultText: string, customDisabled: boolean) => {
      const isTarget = trainingLoader?.playerId === p.id && trainingLoader?.programId === programId;
      const isLoading = isTarget && trainingLoader?.status === 'loading';
      const isSuccess = isTarget && trainingLoader?.status === 'success';
      const isError = isTarget && trainingLoader?.status === 'error';

      const isBtnDisabled = (trainingLoader !== null) || customDisabled;

      let btnClass = "";
      let btnContent: React.ReactNode = null;

      if (programId === 'REST') {
        if (isLoading) {
          btnClass = "bg-indigo-700/60 text-indigo-200 border border-indigo-500/50 cursor-wait min-w-[124px]";
          btnContent = (
            <span className="flex items-center justify-center gap-1.5 font-sans">
              <Loader2 className="animate-spin h-3.5 w-3.5 text-indigo-300" />
              휴식 처리 중...
            </span>
          );
        } else if (isSuccess) {
          btnClass = "bg-emerald-600 hover:bg-emerald-600 text-white border border-emerald-500 cursor-default shadow-[0_0_12px_rgba(16,185,129,0.4)] min-w-[124px]";
          btnContent = (
            <span className="flex items-center justify-center gap-1.5 font-bold font-sans">
              <Check className="h-3.5 w-3.5 text-white" />
              휴식 완료!
            </span>
          );
        } else if (isError) {
          btnClass = "bg-rose-700 text-rose-100 border border-rose-500 cursor-default min-w-[124px]";
          btnContent = (
            <span className="flex items-center justify-center gap-1.5 font-sans">
              <AlertCircle className="h-3.5 w-3.5" />
              승인 불가
            </span>
          );
        } else {
          btnClass = "bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold cursor-pointer w-full sm:w-auto shadow-md disabled:opacity-30 disabled:cursor-not-allowed min-w-[124px]";
          btnContent = defaultText;
        }
      } else {
        if (isLoading) {
          btnClass = "bg-primary/5 text-primary/70 border border-primary/30 cursor-wait animate-pulse min-w-[124px]";
          btnContent = (
            <span className="flex items-center justify-center gap-1.5 font-sans">
              <Loader2 className="animate-spin h-3.5 w-3.5 text-primary" />
              지시 조율 중...
            </span>
          );
        } else if (isSuccess) {
          btnClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default shadow-[0_0_12px_rgba(16,185,129,0.25)] min-w-[124px]";
          btnContent = (
            <span className="flex items-center justify-center gap-1.5 font-bold font-sans">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              등록 완료!
            </span>
          );
        } else if (isError) {
          btnClass = "bg-rose-500/20 text-rose-455 border border-rose-500/40 cursor-default min-w-[124px]";
          btnContent = (
            <span className="flex items-center justify-center gap-1.5 font-sans">
              <AlertCircle className="h-3.5 w-3.5" />
              지도 불가
            </span>
          );
        } else {
          btnClass = "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-all text-xs font-bold cursor-pointer w-full sm:w-auto shadow-sm disabled:opacity-30 disabled:cursor-not-allowed min-w-[124px]";
          btnContent = defaultText;
        }
      }

      return (
        <Button
          disabled={isBtnDisabled}
          onClick={() => handleIntensiveTraining(p.id, programId)}
          className={`${btnClass} h-8 transition-colors`}
        >
          {btnContent}
        </Button>
      );
    };

    return (
      <div className="flex flex-col xl:flex-row gap-6 h-full">
        {/* Left Side: Overview & Radar Chart */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-start border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175.93" strokeDashoffset={175.93 - (175.93 * p.condition) / 100} className={p.condition >= 80 ? "text-emerald-400" : p.condition >= 50 ? "text-amber-400" : "text-rose-500"} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-mono leading-none">COND</span>
                  <span className="text-xs font-black text-foreground drop-shadow-sm">{Math.round(p.condition)}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider ${
                    p.role === 'MID' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                    p.role === 'TOP' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' :
                    p.role === 'JUNGLE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                    p.role === 'ADC' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                    'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                  }`}>
                    {p.role}
                  </span>
                  <h3 className="font-black text-2xl text-foreground drop-shadow-sm tracking-tight">
                    {p.summonerName}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  {p.name} ({p.age}세) • OVR <span className="font-mono text-emerald-400 font-bold">{overall}</span>
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-background/50 rounded-xl border border-border p-4 flex-1 ${isMobile ? 'min-h-[180px]' : 'min-h-[220px]'} relative`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Stats" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Detailed Status & Actions */}
        <div className="flex-[1.2] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-xl border border-border flex flex-col justify-center">
              <span className="text-[10px] text-muted-foreground/80 mb-1">ENERGY (에너지)</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">⚡ {Math.round(p.energy ?? 100)}%</span>
                <Progress value={p.energy ?? 100} className="h-1.5 flex-1" />
              </div>
            </div>
            <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-xl border border-border flex flex-col justify-center">
              <span className="text-[10px] text-muted-foreground/80 mb-1">MORALE (사기)</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-extrabold drop-shadow-sm ${p.morale && p.morale >= 80 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : p.morale && p.morale >= 50 ? 'text-foreground/80' : 'text-rose-400 animate-pulse'}`}>
                  {Math.round(p.morale ?? 75)}%
                </span>
                <Progress value={p.morale ?? 75} className="h-1.5 flex-1" />
              </div>
            </div>
          </div>

          {/* Individual Training Grid */}
          <div className="bg-card border border-border rounded-xl p-4 flex-1 flex flex-col shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3 border-b border-border/40 pb-2 shrink-0">
              <h4 className="text-xs font-mono font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <Dumbbell size={14} /> INTENSIVE TRAINING PROTOCOL
              </h4>
              <div className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                coachingActionsLeft > 0 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              }`}>
                ⚡ 일일 지도 한계치: {coachingActionsLeft} / 3 남음
              </div>
            </div>
            {isMobile ? (
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-background shadow-inner shadow-black/50 p-2.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-foreground block font-bold font-sans">🎯 라인전 디테일 정밀 연마</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">LanePhase +2, Consistency +1 • COST: ⚡8 Energy</span>
                  </div>
                  {renderActionButton('LANING', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.lanePhase >= (p.potential || 99))}
                </div>
                <div className="bg-background shadow-inner shadow-black/50 p-2.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-foreground block font-bold font-sans">⚡ 고강도 솔로랭크 피지컬 단련</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Mechanics +2, LanePhase +1 • COST: ⚡10 Energy</span>
                  </div>
                  {renderActionButton('SOLOQ', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.mechanics >= (p.potential || 99))}
                </div>
                <div className="bg-background shadow-inner shadow-black/50 p-2.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-foreground block font-bold font-sans">🧠 전술 운영 및 오더 맥락 정립</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Macro +3, Shotcalling +2 • COST: ⚡6 Energy</span>
                  </div>
                  {renderActionButton('MACRO', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.macro >= (p.potential || 99))}
                </div>
                <div className="bg-background shadow-inner shadow-black/50 p-2.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-foreground block font-bold font-sans">⚔️ 스크림 연쇄 교전 포지셔닝 설계</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Teamfight +2, Macro +1 • COST: ⚡8 Energy</span>
                  </div>
                  {renderActionButton('SCRIMS', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.teamfight >= (p.potential || 99))}
                </div>
                <div className="bg-background shadow-inner shadow-black/50 p-2.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-foreground block font-bold font-sans">🧠 평정심 유지를 위한 마인드 실습</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Mental +2, Consistency +1 • COST: ⚡8 Energy</span>
                  </div>
                  {renderActionButton('MINDSET', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.mental >= (p.potential || 99))}
                </div>
                <div className="bg-background shadow-inner shadow-black/50 p-2.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-foreground block font-bold font-sans">🛌 안락한 전술 휴식 (Rest & Rehab)</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Restores +35 Energy & Conditions • COST: Free (No Action points cost!)</span>
                  </div>
                  {renderActionButton('REST', '휴식 지시', (p.energy ?? 100) >= 100)}
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-3">
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-foreground block font-bold font-sans">🎯 라인전 디테일 정밀 연마</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">LanePhase +2, Consistency +1 • COST: ⚡8 Energy</span>
                    </div>
                    {renderActionButton('LANING', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.lanePhase >= (p.potential || 99))}
                  </div>
                  <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-foreground block font-bold font-sans">⚡ 고강도 솔로랭크 피지컬 단련</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Mechanics +2, LanePhase +1 • COST: ⚡10 Energy</span>
                    </div>
                    {renderActionButton('SOLOQ', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.mechanics >= (p.potential || 99))}
                  </div>
                  <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-foreground block font-bold font-sans">🧠 전술 운영 및 오더 맥락 정립</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Macro +3, Shotcalling +2 • COST: ⚡6 Energy</span>
                    </div>
                    {renderActionButton('MACRO', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.macro >= (p.potential || 99))}
                  </div>
                  <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-foreground block font-bold font-sans">⚔️ 스크림 연쇄 교전 포지셔닝 설계</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Teamfight +2, Macro +1 • COST: ⚡8 Energy</span>
                    </div>
                    {renderActionButton('SCRIMS', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.teamfight >= (p.potential || 99))}
                  </div>
                  <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-foreground block font-bold font-sans">🧠 평정심 유지를 위한 마인드 실습</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Mental +2, Consistency +1 • COST: ⚡8 Energy</span>
                    </div>
                    {renderActionButton('MINDSET', '훈련 지시', coachingActionsLeft <= 0 || (p.energy ?? 100) < 12 || p.mental >= (p.potential || 99))}
                  </div>
                  <div className="bg-background shadow-inner shadow-black/50 p-3 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-foreground block font-bold font-sans">🛌 안락한 전술 휴식 (Rest & Rehab)</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block tracking-tight">Restores +35 Energy & Conditions • COST: Free (No Action points cost!)</span>
                    </div>
                    {renderActionButton('REST', '휴식 지시', (p.energy ?? 100) >= 100)}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 animate-in fade-in-50 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border shadow-lg">
        <div>
          <h2 className="text-xl font-black text-rose-455 flex items-center gap-2 drop-shadow-sm">
            👥 선수단 집중 훈련 센터 (ROSTER BASE)
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
            현재 구단 로스터 폼 상태 점검 및 퍼포먼스 분석. 피지컬 스탯의 단기 성장을 지시하십시오.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => restRoster()}
          className="bg-emerald-955/40 text-emerald-400 border-emerald-500/30 font-bold px-4 py-2 hover:bg-emerald-900/60 transition-all font-mono shadow-sm flex items-center gap-2 text-xs w-full md:w-auto"
        >
          <CheckCircle size={14} /> 전체 선수 휴식 부여 (1일 소모 / +15% COND)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 items-stretch">
        {/* List column (4 cols) */}
        <div className="lg:col-span-4 bg-card/40 backdrop-blur-md border border-border shadow-lg rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto scrollbar-thin">
          <h3 className="text-[10px] font-mono tracking-widest text-muted-foreground font-black uppercase mb-1">
            ACTIVE SQUAD LINE-UP
          </h3>
          {playerRoster.map((p) => {
            const isSelected = selectedPlayerId === p.id;
            const overall = Math.round((p.lanePhase + p.mechanics + p.macro + p.teamfight) / 4);
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlayerId(p.id);
                  if (isMobile) {
                    setIsMobileSheetOpen(true);
                  }
                }}
                className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-center group ${
                  isSelected && !isMobile
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20'
                    : 'bg-background/80 shadow-inner shadow-black/30 border-border text-foreground hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black shadow-sm ${
                    p.role === 'MID' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                    p.role === 'TOP' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                    p.role === 'JUNGLE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                    p.role === 'ADC' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                    'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                  }`}>
                    {p.role}
                  </span>
                  <div>
                    <h4 className={`font-black text-sm drop-shadow-sm transition-colors ${(isSelected && !isMobile) ? 'text-white' : 'text-foreground group-hover:text-primary'}`}>
                      {p.summonerName}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[8px] text-muted-foreground/80 block uppercase mb-0.5 font-bold">OVR</span>
                    <span className={`font-black ${p.condition >= 100 ? 'text-emerald-400' : 'text-white'}`}>{overall}</span>
                  </div>
                  <div className="bg-card px-2 py-1 rounded-md border border-border text-[9px] text-muted-foreground font-bold shadow-inner">
                    ⚡{Math.round(p.energy ?? 100)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* DETAIL BLOCK */}
        {!isMobile && (
          <div className="lg:col-span-8 bg-card/60 backdrop-blur-md border border-border shadow-md rounded-xl p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin">
            {!selectedPlayer ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground/80">
                <Users size={32} className="opacity-20 animate-pulse mb-3" />
                <p className="text-sm font-bold">선수 목록에서 선수를 선택해 타겟 트레이닝을 전개하십시오.</p>
              </div>
            ) : (
              renderDetailContents(selectedPlayer)
            )}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM SHEET FOR PLAYER DETAILS */}
      <AnimatePresence>
        {isMobile && isMobileSheetOpen && selectedPlayer && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileSheetOpen(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card border-t border-border rounded-t-3xl p-5 pb-8 space-y-4 max-w-md max-h-[85vh] overflow-y-auto shadow-2xl relative z-50 flex flex-col"
            >
              {/* Pull handle */}
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-2 shrink-0" />

              <div className="flex justify-between items-center mb-2 shrink-0 border-b border-border/40 pb-2">
                <h3 className="text-sm font-black text-foreground font-heading">👤 선수 정보 및 집중지도</h3>
                <button onClick={() => setIsMobileSheetOpen(false)} className="text-muted-foreground hover:text-foreground text-xs font-mono font-bold">✕ 닫기</button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 pb-4">
                {renderDetailContents(selectedPlayer)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
