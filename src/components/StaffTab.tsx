import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Briefcase, Trash2, Heart, TrendingUp, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Staff, Player, Team } from '../types';

interface StaffTabProps {
  coachingStaff: Staff[];
  activeStaff: {
    HEAD_COACH: string | null;
    TACTICAL_COACH: string | null;
    MENTAL_COACH: string | null;
  };
  academyRookies: Player[];
  playerTeam: Team;
  hireStaff: (staffId: string) => { success: boolean; message: string };
  fireStaff: (staffId: string) => void;
  hireAcademyRookie: (rookieId: string) => { success: boolean; message: string };
}

export const StaffTab: React.FC<StaffTabProps> = ({
  coachingStaff,
  activeStaff,
  academyRookies,
  playerTeam,
  hireStaff,
  fireStaff,
  hireAcademyRookie
}) => {
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Filter current active/hired staff
  const hiredStaffList = coachingStaff.filter(s => s.teamId === playerTeam.id);
  const freeAgentStaffList = coachingStaff.filter(s => s.teamId === 'FA');

  const getActiveStaffByRole = (role: 'HEAD_COACH' | 'TACTICAL_COACH' | 'MENTAL_COACH') => {
    const activeId = activeStaff[role];
    return hiredStaffList.find(s => s.id === activeId);
  };

  const activeHC = getActiveStaffByRole('HEAD_COACH');
  const activeTC = getActiveStaffByRole('TACTICAL_COACH');
  const activeMC = getActiveStaffByRole('MENTAL_COACH');

  const triggerStaffHiring = (id: string) => {
    const res = hireStaff(id);
    setFeedback(res);
    setTimeout(() => setFeedback(null), 4000);
  };

  const triggerRookieHiring = (id: string) => {
    const res = hireAcademyRookie(id);
    setFeedback(res);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Feedback Notice Banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border font-mono text-xs flex items-center gap-2.5 ${
            feedback.success
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[inset_0_0_10px_rgba(52,211,153,0.1)]'
              : 'bg-destructive/10 border-destructive/40 text-destructive shadow-[inset_0_0_10px_rgba(var(--destructive),0.1)]'
          }`}
        >
          {feedback.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* UPPER BLOCK: Appointed Coaches Slots */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-primary flex items-center gap-2.5 drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
            👔 구단 현직 액티브 코칭스태프 (COACHING HEADQUARTERS)
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono font-bold">ACTIVE ROLE EFFECT: 100%</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Slot 1: Head Coach */}
          <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-5 flex flex-col justify-between min-h-48 relative overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary),0.2)] transition-all duration-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--primary),0.15),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/40 px-2.5 py-0.5 rounded-full font-mono shadow-inner shadow-black/40 drop-shadow-[0_0_2px_rgba(var(--primary),0.3)]">감독 (HEAD COACH)</span>
                <span className="text-[10px] font-mono text-muted-foreground font-bold">Slot 01</span>
              </div>
              {activeHC ? (
                <div className="space-y-2.5 font-mono">
                  <h4 className="font-extrabold text-foreground text-sm drop-shadow-sm">{activeHC.name}</h4>
                  <div className="space-y-2 text-[11px] text-muted-foreground/80">
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>리더십 파워</span>
                        <span className="text-primary font-black drop-shadow-[0_0_2px_rgba(var(--primary),0.8)]">{activeHC.leadership}</span>
                      </div>
                      <div className="h-1 bg-background rounded-full overflow-hidden shadow-inner shadow-black/50 border border-border">
                        <div className="h-full bg-primary rounded-full shadow-[0_0_5px_rgba(var(--primary),0.8)]" style={{ width: `${activeHC.leadership}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border mt-1 shadow-inner shadow-black/30">
                      <span>훈련 가중 효율:</span>
                      <b className="text-emerald-400 font-black text-xs drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">+{activeHC.trainingBonus}% 효율</b>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground italic font-mono flex flex-col items-center justify-center gap-2">
                  <span>공석 상태 (UNASSIGNED)</span>
                  <span className="text-[9px] not-italic text-muted-foreground/60">FA 시장에서 코치를 찾아 임명해주십시오</span>
                </div>
              )}
            </div>
            {activeHC && (
              <button
                onClick={() => fireStaff(activeHC.id)}
                className="mt-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-[10px] font-black cursor-pointer font-mono tracking-wider transition-all relative z-10"
              >
                경질 / FA 방출
              </button>
            )}
          </div>

          {/* Slot 2: Tactical Coach */}
          <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-5 flex flex-col justify-between min-h-48 relative overflow-hidden group hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all duration-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.15),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono shadow-inner shadow-black/40 drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">전술 코치 (TACTICAL)</span>
                <span className="text-[10px] font-mono text-muted-foreground font-bold">Slot 02</span>
              </div>
              {activeTC ? (
                <div className="space-y-2.5 font-mono">
                  <h4 className="font-extrabold text-foreground text-sm drop-shadow-sm">{activeTC.name}</h4>
                  <div className="space-y-2 text-[11px] text-muted-foreground/80">
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>전술 숙련 요건</span>
                        <span className="text-cyan-400 font-black drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]">{activeTC.tacticalSkill}</span>
                      </div>
                      <div className="h-1 bg-background rounded-full overflow-hidden shadow-inner shadow-black/50 border border-border">
                        <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" style={{ width: `${activeTC.tacticalSkill}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border mt-1 shadow-inner shadow-black/30">
                      <span>드래프트 지원:</span>
                      <b className="text-cyan-400 font-black text-xs drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">최첨단 엔진</b>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground italic font-mono flex flex-col items-center justify-center gap-2">
                  <span>공석 상태 (UNASSIGNED)</span>
                  <span className="text-[9px] not-italic text-muted-foreground/60">FA 시장에서 코치를 찾아 임명해주십시오</span>
                </div>
              )}
            </div>
            {activeTC && (
              <button
                onClick={() => fireStaff(activeTC.id)}
                className="mt-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-[10px] font-black cursor-pointer font-mono tracking-wider transition-all relative z-10"
              >
                경질 / FA 방출
              </button>
            )}
          </div>

          {/* Slot 3: Mental Coach */}
          <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-5 flex flex-col justify-between min-h-48 relative overflow-hidden group hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all duration-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.15),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono shadow-inner shadow-black/40 drop-shadow-[0_0_2px_rgba(52,211,153,0.3)]">멘탈 코치 (MENTAL CARE)</span>
                <span className="text-[10px] font-mono text-muted-foreground font-bold">Slot 03</span>
              </div>
              {activeMC ? (
                <div className="space-y-2.5 font-mono">
                  <h4 className="font-extrabold text-foreground text-sm drop-shadow-sm">{activeMC.name}</h4>
                  <div className="space-y-2 text-[11px] text-muted-foreground/80">
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>멘탈 관리 케어</span>
                        <span className="text-emerald-400 font-black drop-shadow-[0_0_2px_rgba(52,211,153,0.8)]">{activeMC.mentalCare}</span>
                      </div>
                      <div className="h-1 bg-background rounded-full overflow-hidden shadow-inner shadow-black/50 border border-border">
                        <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]" style={{ width: `${activeMC.mentalCare}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border mt-1 shadow-inner shadow-black/30">
                      <span>멘탈 케어 가중치:</span>
                      <b className="text-emerald-400 font-black text-xs drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">사기 극대화</b>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground italic font-mono flex flex-col items-center justify-center gap-2">
                  <span>공석 상태 (UNASSIGNED)</span>
                  <span className="text-[9px] not-italic text-muted-foreground/60">FA 시장에서 코치를 찾아 임명해주십시오</span>
                </div>
              )}
            </div>
            {activeMC && (
              <button
                onClick={() => fireStaff(activeMC.id)}
                className="mt-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-[10px] font-black cursor-pointer font-mono tracking-wider transition-all relative z-10"
              >
                경질 / FA 방출
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LOWER BLOCK GIRD: Staff Market & Academy Scouting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Market 1: Staff Pools */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-primary flex items-center gap-2 drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
            🤝 자유계약 코칭스태프 시장 (COACH MARKET)
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {freeAgentStaffList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">더 이상 FA 시장에 영입 가능한 스태프가 존재하지 않습니다.</p>
            ) : (
              freeAgentStaffList.map(s => (
                <div key={s.id} className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center justify-between shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] transition hover:border-primary/50">
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-foreground">{s.name}</span>
                      <span className="text-[9px] bg-background px-1.5 py-0.5 border border-border shadow-inner shadow-black/50 rounded text-muted-foreground font-bold uppercase">
                        {s.role === 'HEAD_COACH' ? '감독' : s.role === 'TACTICAL_COACH' ? '전술코치' : '멘탈케어'}
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground/80 leading-normal">
                      {s.role === 'HEAD_COACH' && `리더십: ${s.leadership} / 훈련 효율: +${s.trainingBonus}%`}
                      {s.role === 'TACTICAL_COACH' && `전술 파워 스킬: ${s.tacticalSkill} (인게임 밴픽 보정역)`}
                      {s.role === 'MENTAL_COACH' && `마인드케어: ${s.mentalCare} / 일일 사기 회복 가속`}
                    </p>

                    <div className="text-[10px] text-primary font-bold">
                      요구 연봉: 계약 선입금 {s.salary}만원
                    </div>
                  </div>

                  <button
                    onClick={() => triggerStaffHiring(s.id)}
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 shadow-[inset_0_0_5px_rgba(52,211,153,0.1)] rounded-lg text-xs font-black font-mono cursor-pointer transition-colors"
                  >
                    영입 계약
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Market 2: Academy Youth Pools */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-primary flex items-center gap-2 drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">
            🌱 아카데미 연습생 발굴 시장 (LOUTE ACADEMY)
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {academyRookies.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">현재 관찰 대상에 포함된 유스 연습생 자원이 공석입니다.</p>
            ) : (
              academyRookies.map(r => {
                const ovr = Math.round((r.lanePhase + r.mechanics + r.macro + r.teamfight) / 4);

                return (
                  <div key={r.id} className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] transition hover:border-primary/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">{r.summonerName}</span>
                          <span className="text-[9px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-1.5 py-0.5 rounded font-black font-mono shadow-inner shadow-black/30">
                            {r.role}
                          </span>
                          <span className="text-[10px] text-muted-foreground">나이: {r.age}세</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-bold drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">
                          성장 고잠재력: <strong className="text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]">OVR {r.potential} Limit</strong>
                        </p>
                      </div>

                      <div className="bg-background/80 px-2.5 py-1 border border-border rounded text-cyan-400 font-mono text-xs font-black shadow-inner shadow-black/30">
                        OVR {ovr}
                      </div>
                    </div>

                    {/* Miniature stats grid */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                      <div className="bg-background/60 p-1.5 rounded border border-border shadow-inner shadow-black/20">
                        <span className="text-[8px] text-muted-foreground block">LANE</span>
                        <b className="text-foreground/90">{r.lanePhase}</b>
                      </div>
                      <div className="bg-background/60 p-1.5 rounded border border-border shadow-inner shadow-black/20">
                        <span className="text-[8px] text-muted-foreground block">MECH</span>
                        <b className="text-foreground/90">{r.mechanics}</b>
                      </div>
                      <div className="bg-background/60 p-1.5 rounded border border-border shadow-inner shadow-black/20">
                        <span className="text-[8px] text-muted-foreground block">MACR</span>
                        <b className="text-foreground/90">{r.macro}</b>
                      </div>
                      <div className="bg-background/60 p-1.5 rounded border border-border shadow-inner shadow-black/20">
                        <span className="text-[8px] text-muted-foreground block">TF</span>
                        <b className="text-foreground/90">{r.teamfight}</b>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="font-mono text-xs text-primary font-bold">
                        계약이적료: {r.salary}만원
                      </div>

                      <button
                        onClick={() => triggerRookieHiring(r.id)}
                        className="px-3.5 py-1.5 bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:text-cyan-300 shadow-[inset_0_0_5px_rgba(34,211,238,0.1)] rounded-lg text-xs font-black font-mono cursor-pointer transition-colors"
                      >
                        정식 계약 및 스카우트
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
