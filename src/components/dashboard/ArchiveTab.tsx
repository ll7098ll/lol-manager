import React from 'react';
import { WORLDS_HISTORY, MSI_HISTORY, LCK_HISTORY, PLAYER_HALL_OF_FAME, TEAM_HALL_OF_FAME } from '../../data/historyData';
import { BookOpen, Globe, Medal, Flag, Crown, MapPin, Sparkles, Star, Users, Building2 } from 'lucide-react';

interface ArchiveTabProps {
  archiveSubTab: 'WORLDS'|'MSI'|'LCK'|'HALL_OF_FAME';
  setArchiveSubTab: (tab: 'WORLDS'|'MSI'|'LCK'|'HALL_OF_FAME') => void;
  selectedFamousPlayerName: string | null;
  setSelectedFamousPlayerName: (name: string | null) => void;
  selectedFamousTeamName: string | null;
  setSelectedFamousTeamName: (name: string | null) => void;
  getTeamName: (id?: string) => string;
  getTeamLogo: (id?: string) => string;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = ({
  archiveSubTab,
  setArchiveSubTab,
  selectedFamousPlayerName,
  setSelectedFamousPlayerName,
  selectedFamousTeamName,
  setSelectedFamousTeamName,
  getTeamName,
  getTeamLogo,
}) => {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ARCHIVE LEFT BAR: Category switchers */}
      <div className="lg:col-span-3 bg-card/40 backdrop-blur-md border border-border rounded-xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
          <BookOpen size={16} className="text-rose-500" />
          <h3 className="font-extrabold text-xs uppercase font-mono tracking-widest text-foreground/90">박물관 카테고리</h3>
        </div>
        {[
          { id: 'WORLDS', label: '🏆 월드 챔피언십 (Worlds)', icon: Globe },
          { id: 'MSI', label: '⚔️ 미드 시즌 인비테이셔널 (MSI)', icon: Medal },
          { id: 'LCK', label: '🇰🇷 LCK 스플릿 역사 (LCK)', icon: Flag },
          { id: 'HALL_OF_FAME', label: '👑 레전드 전당 (Hall of Fame)', icon: Crown }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setArchiveSubTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold text-left transition-all border cursor-pointer ${
                archiveSubTab === tab.id
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                  : 'bg-background/60 shadow-inner shadow-black/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="pt-4 border-t border-border/60 text-[10px] text-muted-foreground/80 font-mono leading-relaxed bg-muted/10 p-2.5 rounded-lg mt-4">
          💡 <span className="font-bold">LCK 전력전술 분석원</span><br />
          역대 지역 리그 및 세계 오프라인 무대 챔피언십 데이터를 바탕으로 수치 모델링이 작성되었습니다. 전설적인 로스터들을 탐구해 보십시오.
        </div>
      </div>

      {/* ARCHIVE RIGHT PANEL: Detailed database view */}
      <div className="lg:col-span-9 bg-muted/10 border border-border rounded-xl p-4 md:p-6 h-full min-h-0 overflow-y-auto scrollbar-thin">
        {archiveSubTab === 'WORLDS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-black text-lg text-amber-400 flex items-center gap-2">
                  🏆 LoL 월드 챔피언십 (Worlds Championship)
                </h3>
                <p className="text-xs text-muted-foreground">2011년부터 최고 수준의 소환사들이 겨룬 전 세계 최대의 e스포츠 축제</p>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded">
                TOTAL: {WORLDS_HISTORY.length} EVENTS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {WORLDS_HISTORY.map(record => (
                <div 
                  key={record.year} 
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all bg-background/60 shadow-inner shadow-black/30 ${
                    record.winner === 'T1' || record.winner.includes('SKT') || record.winner.includes('SK Telecom')
                      ? 'border-rose-900/50 hover:border-rose-700/80'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                      <span className="text-amber-400 font-extrabold">{record.year} WORLDS</span>
                      <span className="text-muted-foreground/80 flex items-center gap-1"><MapPin size={10} /> {record.venue}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-border pb-2 mb-2">
                      <h4 className="font-black text-base text-white flex items-center gap-1.5">
                        👑 {record.winner}
                        <span className="text-[10px] text-muted-foreground/80 font-normal">vs {record.runnerUp}</span>
                      </h4>
                      <span className="text-xs font-mono font-black text-muted-foreground bg-card px-2 py-0.5 rounded border border-border">
                        {record.score}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block mb-1">CHAMPION ROSTER</span>
                        <div className="flex flex-wrap gap-1">
                          {record.roster.map(r => (
                            <span key={r} className="px-1.5 py-0.5 bg-card text-[10px] text-foreground/90 rounded border border-border font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/80 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-muted-foreground">🏅 MVP: <strong className="text-white">{record.mvp}</strong></span>
                    <span className="text-rose-400 bg-rose-500/5 border border-rose-950 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                      🔥 KEY METEOR: {record.metaChampion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {archiveSubTab === 'MSI' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-black text-lg text-cyan-400 flex items-center gap-2">
                  ⚔️ 미드 시즌 인비테이셔널 (Mid-Season Invitational)
                </h3>
                <p className="text-xs text-muted-foreground">지역별 스프링 우승팀들이 맞붙는 상반기 최고의 국제전 경쟁 무대</p>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded">
                TOTAL: {MSI_HISTORY.length} EVENTS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {MSI_HISTORY.map(record => (
                <div 
                  key={record.year} 
                  className="p-4 rounded-xl border border-border bg-background/60 shadow-inner shadow-black/30 hover:border-border flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
                      <span className="text-cyan-400 font-extrabold">{record.year} MSI</span>
                      <span className="text-muted-foreground/80 flex items-center gap-1"><MapPin size={10} /> {record.venue}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-border pb-2 mb-2">
                      <h4 className="font-black text-base text-white flex items-center gap-1.5">
                        ⚔️ {record.winner}
                        <span className="text-[10px] text-muted-foreground/80 font-normal">vs {record.runnerUp}</span>
                      </h4>
                      <span className="text-xs font-mono font-black text-muted-foreground bg-card px-2 py-0.5 rounded border border-border">
                        {record.score}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-muted-foreground/80 block mb-1 font-mono">CHAMPION ROSTER</span>
                      <div className="flex flex-wrap gap-1 font-mono">
                        {record.roster.map(r => (
                          <span key={r} className="px-1.5 py-0.5 bg-card text-[10px] text-foreground/90 rounded border border-border font-bold">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/80 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                    <span>🏆 MVP: <strong className="text-white">{record.mvp}</strong></span>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-bold">Mid-Season Master</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {archiveSubTab === 'LCK' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-black text-lg text-rose-450 flex items-center gap-2">
                  🇰🇷 LCK 지역 리그 순위 역사 (League Split Records)
                </h3>
                <p className="text-xs text-muted-foreground">e스포츠 최강의 리그, LCK 역대 스프링 및 서머 챔피언 연대기</p>
              </div>
              <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded">
                TOTAL RECORDS: {LCK_HISTORY.length} SEASONS
              </span>
            </div>

            <div className="bg-background/80 shadow-inner shadow-black/40 rounded-xl divide-y divide-border border border-border overflow-hidden max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-12 gap-1 px-4 py-2.5 text-[10px] font-mono text-muted-foreground/80 font-black bg-card/50 uppercase">
                <span className="col-span-2">시즌정보</span>
                <span className="col-span-4">우승팀 (WINNER)</span>
                <span className="col-span-3 text-center">결과 스코어</span>
                <span className="col-span-3 text-right">MVP 선정</span>
              </div>

              {LCK_HISTORY.map((record, idx) => (
                <div 
                  key={`${record.year}-${record.season}`} 
                  className={`grid grid-cols-12 gap-1 px-4 py-3.5 text-xs font-mono items-center hover:bg-muted/10 transition-all border-b border-border/40 ${
                    record.winner === 'Gen.G' ? 'text-amber-200/90' : record.winner === 'T1' || record.winner === 'SK Telecom T1' ? 'text-rose-200/90' : 'text-foreground/90'
                  }`}
                >
                  <span className="col-span-2 text-[11px] font-bold">
                    {record.year} {record.season === 'Spring' ? '🌸 스프링' : '☀️ 서머'}
                  </span>
                  <span className="col-span-4 font-extrabold text-white text-sm flex items-center gap-1.5">
                    {record.winner === 'Gen.G' ? '🟡' : record.winner.includes('T1') ? '🔴' : '🟢'} {record.winner}
                  </span>
                  <span className="col-span-3 text-center font-bold text-muted-foreground">
                    {record.score}
                  </span>
                  <span className="col-span-3 text-right text-foreground/90 font-extrabold">
                    {record.mvp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {archiveSubTab === 'HALL_OF_FAME' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side list selector */}
            <div className="lg:col-span-4 space-y-4">
              {/* Players list */}
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border">
                <h4 className="text-[10px] font-mono font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Users size={12} className="text-rose-455" /> LEGENDARY PLAYERS
                </h4>
                {PLAYER_HALL_OF_FAME.map(player => (
                  <button
                    key={player.summonerName}
                    onClick={() => setSelectedFamousPlayerName(player.summonerName)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-bold font-mono transition-colors border cursor-pointer flex items-center justify-between ${
                      selectedFamousPlayerName === player.summonerName
                        ? 'bg-rose-955/40 border-rose-800 text-rose-400'
                        : 'bg-background shadow-inner shadow-black/50 border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{player.summonerName}</span>
                    <span className="text-[9px] text-muted-foreground/80">🏆 {player.trophies.worlds} Worlds</span>
                  </button>
                ))}
              </div>

              {/* Teams list */}
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border">
                <h4 className="text-[10px] font-mono font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Building2 size={12} className="text-cyan-455" /> FAMOUS eSPORTS CLUBS
                </h4>
                {TEAM_HALL_OF_FAME.map(team => (
                  <button
                    key={team.name}
                    onClick={() => setSelectedFamousTeamName(team.name)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-bold font-mono transition-colors border cursor-pointer flex items-center justify-between ${
                      selectedFamousTeamName === team.name
                        ? 'bg-cyan-955/40 border-cyan-800 text-cyan-400'
                        : 'bg-background shadow-inner shadow-black/50 border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">{team.logo} {team.name}</span>
                    <span className="text-[9px] text-muted-foreground/80">🏆 {team.worldsTitles} Worlds</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side Detail boards */}
            <div className="lg:col-span-8 space-y-4">
              {/* Selected Player profile display */}
              {(() => {
                const p = PLAYER_HALL_OF_FAME.find(x => x.summonerName === selectedFamousPlayerName) || PLAYER_HALL_OF_FAME[0];
                if (!p) return null;
                return (
                  <div className="bg-background/90 backdrop-blur-sm border border-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute right-3 top-3 opacity-10 font-mono text-5xl font-black">{p.summonerName}</div>
                    <h4 className="text-rose-500 uppercase font-mono font-black tracking-widest text-[10px] mb-1">MEMBERSHIP HALL OF LEGENDS</h4>
                    <h3 className="font-extrabold text-xl text-white select-none">{p.summonerName}</h3>
                    <p className="text-xs text-muted-foreground font-mono italic mb-4">{p.realName}</p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono my-3 border-t border-b border-border py-3 bg-muted/5 rounded-lg">
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block">🏆 WORLDS WIN</span>
                        <span className="font-extrabold text-yellow-500 text-sm">{p.trophies.worlds}회</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block">⚔️ MSI WIN</span>
                        <span className="font-extrabold text-cyan-400 text-sm">{p.trophies.msi}회</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block">🇰🇷 LCK WIN</span>
                        <span className="font-extrabold text-white text-sm">{p.trophies.lck}회</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-foreground/90 mb-4">{p.description}</p>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground/80 block font-mono font-bold uppercase tracking-wider">SIGNATURE CHAMPIONS (시그니처 카드)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.signatureChampions.map(champ => (
                          <span key={champ} className="px-2 py-0.5 bg-card text-foreground border border-border rounded font-bold text-xs">
                            {champ}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/60">
                      <span className="text-[10px] text-muted-foreground/80 block font-mono font-bold uppercase tracking-wider mb-2">CAREER TIMELINE HIGHLIGHTS</span>
                      <ul className="space-y-1.5 font-mono text-xs text-foreground/90">
                        {p.careerHighlights.map((high, index) => (
                          <li key={index} className="flex gap-2 items-start text-xs">
                            <Sparkles size={12} className="text-pink-500 mt-0.5 shrink-0" />
                            <span>{high}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {/* Selected Team Profile display */}
              {(() => {
                const t = TEAM_HALL_OF_FAME.find(x => x.name === selectedFamousTeamName) || TEAM_HALL_OF_FAME[0];
                if (!t) return null;
                return (
                  <div className="bg-background/90 backdrop-blur-sm border border-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 opacity-5 font-mono text-6xl font-black">{t.name}</div>
                    <h4 className="text-cyan-400 uppercase font-mono font-black tracking-widest text-[10px] mb-1">LEGENDARY CLUB BLUEPRINTS</h4>
                    <h3 className="font-black text-xl text-white select-none flex items-center gap-2">
                      <span className="text-2xl">{t.logo}</span> {t.name}
                    </h3>
                    <p className="text-xs text-muted-foreground/80 font-mono mb-3">설립 연도: {t.founded}</p>

                    <p className="text-xs leading-relaxed text-foreground/90 mb-4">{t.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono my-3 border-t border-b border-border py-3 bg-muted/5 rounded-lg">
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block">🏆 WORLDS CHAMPION</span>
                        <span className="font-extrabold text-yellow-500 text-xs">{t.worldsTitles}회 우승</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block">⚔️ MSI CHAMPION</span>
                        <span className="font-extrabold text-cyan-400 text-xs">{t.msiTitles}회 우승</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/80 block">🇰🇷 LCK CHAMPION</span>
                        <span className="font-extrabold text-white text-xs">{t.lckTitles}회 우승</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground/80 block font-mono font-bold uppercase tracking-wider mb-2">HISTORICAL SIGNATURE STAR ROSTER</span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                        {t.famousRoster.map(player => (
                          <span key={player} className="px-2.5 py-1 bg-card text-cyan-400 border border-cyan-950 rounded font-black flex items-center gap-1">
                            <Star size={10} className="text-amber-400 shrink-0" />
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
