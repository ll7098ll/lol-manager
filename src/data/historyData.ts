export interface WorldsRecord {
  year: number;
  winner: string;
  runnerUp: string;
  score: string;
  mvp: string;
  roster: string[];
  venue: string;
  metaChampion: string; // Key champion of the tournament
}

export interface MsiRecord {
  year: number;
  winner: string;
  runnerUp: string;
  score: string;
  mvp: string;
  roster: string[];
  venue: string;
}

export interface LckRecord {
  year: number;
  season: 'Spring' | 'Summer';
  winner: string;
  runnerUp: string;
  score: string;
  mvp: string;
}

export interface PlayerBio {
  summonerName: string;
  realName: string;
  trophies: {
    worlds: number;
    msi: number;
    lck: number;
  };
  description: string;
  signatureChampions: string[];
  careerHighlights: string[];
}

export interface TeamBio {
  name: string;
  logo: string;
  founded: string;
  worldsTitles: number;
  msiTitles: number;
  lckTitles: number;
  description: string;
  famousRoster: string[];
}

export const WORLDS_HISTORY: WorldsRecord[] = [
  {
    year: 2025,
    winner: "T1",
    runnerUp: "Weibo Gaming",
    score: "3-1",
    mvp: "Zeus (최우제)",
    roster: ["Zeus", "Oner", "Faker", "Gumayusi", "Keria"],
    venue: "Chengdu, China",
    metaChampion: "Yone (요네)"
  },
  {
    year: 2024,
    winner: "T1",
    runnerUp: "Bilibili Gaming (BLG)",
    score: "3-2",
    mvp: "Faker (이상혁)",
    roster: ["Zeus", "Oner", "Faker", "Gumayusi", "Keria"],
    venue: "London, United Kingdom",
    metaChampion: "Sylas (사일러스)"
  },
  {
    year: 2023,
    winner: "T1",
    runnerUp: "Weibo Gaming",
    score: "3-0",
    mvp: "Zeus (최우제)",
    roster: ["Zeus", "Oner", "Faker", "Gumayusi", "Keria"],
    venue: "Seoul / Busan, Korea",
    metaChampion: "Aatrox (아트록스)"
  },
  {
    year: 2022,
    winner: "DRX",
    runnerUp: "T1",
    score: "3-2",
    mvp: "Kingen (황성훈)",
    roster: ["Kingen", "Pyosik", "Zeka", "Deft", "BeryL"],
    venue: "San Francisco, USA",
    metaChampion: "Aatrox (아트록스)"
  },
  {
    year: 2021,
    winner: "EDward Gaming (EDG)",
    runnerUp: "DWG KIA",
    score: "3-2",
    mvp: "Scout (이예찬)",
    roster: ["Flandre", "Jiejie", "Scout", "Viper", "Meiko"],
    venue: "Reykjavík, Iceland",
    metaChampion: "Graves (그레이브즈)"
  },
  {
    year: 2020,
    winner: "DAMWON Gaming (DWG)",
    runnerUp: "Suning",
    score: "3-1",
    mvp: "Canyon (김건부)",
    roster: ["Nuguri", "Canyon", "ShowMaker", "Ghost", "BeryL"],
    venue: "Shanghai, China",
    metaChampion: "TF (트위스티드 페이트)"
  },
  {
    year: 2019,
    winner: "FunPlus Phoenix (FPX)",
    runnerUp: "G2 Esports",
    score: "3-0",
    mvp: "Tian (가오톈량)",
    roster: ["GimGoon", "Tian", "Doinb", "Lwx", "Crisp"],
    venue: "Paris, France",
    metaChampion: "Ryze (라이즈)"
  },
  {
    year: 2018,
    winner: "Invictus Gaming (iG)",
    runnerUp: "Fnatic",
    score: "3-0",
    mvp: "Ning (가오전닝)",
    roster: ["TheShy", "Ning", "Rookie", "JackeyLove", "Baolan"],
    venue: "Incheon, Korea",
    metaChampion: "LeBlanc (르블랑)"
  },
  {
    year: 2017,
    winner: "Samsung Galaxy",
    runnerUp: "SK Telecom T1",
    score: "3-0",
    mvp: "Ruler (박재혁)",
    roster: ["CuVee", "Ambition", "Crown", "Ruler", "CoreJJ"],
    venue: "Beijing, China",
    metaChampion: "Varus (바루스 - 향로 메타)"
  },
  {
    year: 2016,
    winner: "SK Telecom T1",
    runnerUp: "Samsung Galaxy",
    score: "3-2",
    mvp: "Faker (이상혁)",
    roster: ["Duke", "Bengi", "Faker", "Bang", "Wolf"],
    venue: "Los Angeles, USA",
    metaChampion: "Jhin (진)"
  },
  {
    year: 2015,
    winner: "SK Telecom T1",
    runnerUp: "KOO Tigers",
    score: "3-1",
    mvp: "MaRin (장경환)",
    roster: ["MaRin", "Bengi", "Faker", "Bang", "Wolf"],
    venue: "Berlin, Germany",
    metaChampion: "Ryze (라이즈)"
  },
  {
    year: 2014,
    winner: "Samsung White",
    runnerUp: "Star Horn Royal Club",
    score: "3-1",
    mvp: "Mata (조세형)",
    roster: ["Looper", "Dandy", "PawN", "imp", "Mata"],
    venue: "Seoul, Korea",
    metaChampion: "Janna (잔나)"
  },
  {
    year: 2013,
    winner: "SK Telecom T1 K",
    runnerUp: "Royal Club",
    score: "3-0",
    mvp: "Faker (이상혁)",
    roster: ["Impact", "Bengi", "Faker", "Piglet", "PoohManDu"],
    venue: "Los Angeles, USA",
    metaChampion: "Zed (제드)"
  },
  {
    year: 2012,
    winner: "Taipei Assassins (TPA)",
    runnerUp: "Azubu Frost",
    score: "3-1",
    mvp: "Toyz (유웨이젠)",
    roster: ["Stanley", "Lilballz", "Toyz", "Bebe", "MiSTakE"],
    venue: "Los Angeles, USA",
    metaChampion: "Orianna (오리아나)"
  },
  {
    year: 2011,
    winner: "Fnatic",
    runnerUp: "against All authority",
    score: "2-1",
    mvp: "Shushei (마치에이 라투시니키)",
    roster: ["xPeke", "Cyanide", "Shushei", "Lamia", "Mellisan"],
    venue: "Jönköping, Sweden",
    metaChampion: "Ashe (애쉬)"
  }
];

export const MSI_HISTORY: MsiRecord[] = [
  {
    year: 2025,
    winner: "BLG",
    runnerUp: "Gen.G",
    score: "3-2",
    mvp: "Elk (자오자하오)",
    roster: ["Bin", "Xun", "knight", "Elk", "ON"],
    venue: "Taipei, Taiwan"
  },
  {
    year: 2024,
    winner: "Gen.G",
    runnerUp: "Bilibili Gaming (BLG)",
    score: "3-1",
    mvp: "Lehends (손시우)",
    roster: ["Kiin", "Canyon", "Chovy", "Peyz", "Lehends"],
    venue: "Chengdu, China"
  },
  {
    year: 2023,
    winner: "JD Gaming (JDG)",
    runnerUp: "Bilibili Gaming",
    score: "3-1",
    mvp: "knight (줘딩)",
    roster: ["369", "Kanavi", "knight", "Ruler", "Missing"],
    venue: "London, UK"
  },
  {
    year: 2022,
    winner: "Royal Never Give Up (RNG)",
    runnerUp: "T1",
    score: "3-2",
    mvp: "Wei (옌양웨이)",
    roster: ["Bin", "Wei", "Xiaohu", "GALA", "Ming"],
    venue: "Busan, Korea"
  },
  {
    year: 2021,
    winner: "Royal Never Give Up (RNG)",
    runnerUp: "DWG KIA",
    score: "3-2",
    mvp: "GALA (천웨이)",
    roster: ["Xiaohu", "Wei", "Cryin", "GALA", "Ming"],
    venue: "Reykjavík, Iceland"
  },
  {
    year: 2019,
    winner: "G2 Esports",
    runnerUp: "Team Liquid",
    score: "3-0",
    mvp: "Caps (라스무스 빈테르)",
    roster: ["Wunder", "Jankos", "Caps", "Perkz", "Mikyx"],
    venue: "Taipei / Hanoi"
  },
  {
    year: 2018,
    winner: "Royal Never Give Up (RNG)",
    runnerUp: "Kingzone DragonX",
    score: "3-1",
    mvp: "Uzi (젠쯔하오)",
    roster: ["Letme", "Mlxg", "Xiaohu", "Uzi", "Ming"],
    venue: "Paris, France"
  },
  {
    year: 2017,
    winner: "SK Telecom T1",
    runnerUp: "G2 Esports",
    score: "3-1",
    mvp: "Peanut (한왕호)",
    roster: ["Huni", "Peanut", "Faker", "Bang", "Wolf"],
    venue: "Rio de Janeiro, Brazil"
  },
  {
    year: 2016,
    winner: "SK Telecom T1",
    runnerUp: "Counter Logic Gaming",
    score: "3-0",
    mvp: "Faker (이상혁)",
    roster: ["Duke", "Blank", "Faker", "Bang", "Wolf"],
    venue: "Shanghai, China"
  },
  {
    year: 2015,
    winner: "EDward Gaming (EDG)",
    runnerUp: "SK Telecom T1",
    score: "3-2",
    mvp: "Clearlove (밍카이)",
    roster: ["Koro1", "Clearlove", "Pawn", "Deft", "Meiko"],
    venue: "Tallahassee, USA"
  }
];

export const LCK_HISTORY: LckRecord[] = [
  { year: 2025, season: "Summer", winner: "Gen.G", runnerUp: "T1", score: "3-1", mvp: "Chovy" },
  { year: 2025, season: "Spring", winner: "T1", runnerUp: "Gen.G", score: "3-2", mvp: "Faker" },
  { year: 2024, season: "Summer", winner: "Hanwha Life Esports", runnerUp: "Gen.G", score: "3-2", mvp: "Zeka" },
  { year: 2024, season: "Spring", winner: "Gen.G", runnerUp: "T1", score: "3-2", mvp: "Kiin" },
  { year: 2023, season: "Summer", winner: "Gen.G", runnerUp: "T1", score: "3-0", mvp: "Chovy" },
  { year: 2023, season: "Spring", winner: "Gen.G", runnerUp: "T1", score: "3-1", mvp: "Peyz" },
  { year: 2022, season: "Summer", winner: "Gen.G", runnerUp: "T1", score: "3-0", mvp: "Ruler" },
  { year: 2022, season: "Spring", winner: "T1", runnerUp: "Gen.G", score: "3-1", mvp: "Oner" },
  { year: 2021, season: "Summer", winner: "DWG KIA", runnerUp: "T1", score: "3-1", mvp: "ShowMaker" },
  { year: 2021, season: "Spring", winner: "DWG KIA", runnerUp: "Gen.G", score: "3-0", mvp: "Canyon" },
  { year: 2020, season: "Summer", winner: "DAMWON Gaming", runnerUp: "DRX", score: "3-0", mvp: "ShowMaker" },
  { year: 2020, season: "Spring", winner: "T1", runnerUp: "Gen.G", score: "3-0", mvp: "Cuzz" },
  { year: 2019, season: "Summer", winner: "SK Telecom T1", runnerUp: "Griffin", score: "3-1", mvp: "Clid" },
  { year: 2019, season: "Spring", winner: "SK Telecom T1", runnerUp: "Griffin", score: "3-0", mvp: "Teddy" }
];

export const PLAYER_HALL_OF_FAME: PlayerBio[] = [
  {
    summonerName: "Faker",
    realName: "이상혁 (Lee Sang-hyeok)",
    trophies: { worlds: 5, msi: 2, lck: 10 },
    description: "e스포츠 역사상 불멸의 '대마왕' (The Unkillable Demon King). T1 프랜차이즈의 상징이자 글로벌 최고의 스포츠 스타 중 한 명으로, 데뷔 이래 부진을 딛고 2023년, 2024년 월즈 연속 승전을 이끄는 압도적인 리더십과 헌신을 선보였습니다.",
    signatureChampions: ["Ryze (라이즈)", "LeBlanc (르블랑)", "Azir (아지르)", "Zed (제드)", "Orianna (오리아나)"],
    careerHighlights: [
      "2013 데뷔전 고전파 충격의 니달리 아웃플레이",
      "2013-15-16, 2023-24 Worlds 챔피언 등극 (역대 최다 5회 우승)",
      "LCK 최초 10회 우승 금자탑 달성",
      "초대 리그 오브 레전드 전설의 전당 헌액 (Hall of Legends 1st)"
    ]
  },
  {
    summonerName: "Chovy",
    realName: "정지훈 (Jeong Ji-hoon)",
    trophies: { worlds: 0, msi: 1, lck: 5 },
    description: "독보적인 라인 장악력과 압도적인 CS 수급 능력, 기어이 라인전 주도권을 틀어쥐는 최정상급 미드라이너. '쵸비가 미드에 서면 미니언이 마른다'는 평가와 함께, Gen.G의 LCK 4연속 포핏(Four-peat) 대업의 핵심 주역으로 빛났습니다.",
    signatureChampions: ["Yone (요네)", "Azir (아지르)", "Taliyah (탈리야)", "Sylas (사일러스)", "Corki (코르키)"],
    careerHighlights: [
      "그리핀 신성 등장, KDA 104 기록 수립",
      "2022-2024 LCK 4회 연속 제패 (포핏 달성)",
      "2024 MSI 우승 및 총합 5회 LCK 우승 경력"
    ]
  },
  {
    summonerName: "ShowMaker",
    realName: "허수 (Heo Su)",
    trophies: { worlds: 1, msi: 0, lck: 3 },
    description: "쇼맨십과 폭발적인 아웃플레이, 사교적이고 당찬 에너지로 팀을 이끄는 Dplus KIA의 낭만 미드스타. 2020년 담원 게이밍의 최전성기를 호령하며 월즈 승강을 달성하였고, 뛰어난 무지성 한타 캐리력을 보여줍니다.",
    signatureChampions: ["LeBlanc (르블랑)", "Syndra (신드라)", "Zoe (조이)", "Katarina (카타리나)"],
    careerHighlights: [
      "2020-2021 담원 기아 LCK 3연속 우승 및 2020 Worlds 제패",
      "다재다능한 크랙 플레이메이커로 팀의 핵심 기전 담당"
    ]
  },
  {
    summonerName: "Canyon",
    realName: "김건부 (Kim Geon-bu)",
    trophies: { worlds: 1, msi: 1, lck: 4 },
    description: "협곡의 '북극곰'으로 불리며 완벽한 정글 경로 설계와 교전 개시 타이밍을 결정짓는 역대 급 정글러. 담원 시절에 이어 Gen.G 이적 이후에도 완벽하게 부흥하며 2024 MSI 및 멀티플 LCK 우승을 확보했습니다.",
    signatureChampions: ["Lee Sin (리신)", "Nidalee (니달리)", "Karthus (카터스)", "Graves (그레이브즈)", "Sejuani (세주아니)"],
    careerHighlights: [
      "2020 Worlds 파이널 MVP 등극",
      "정글 동선 창조와 니달리-리신의 독보적 숙련도",
      "Gen.G에서의 2024 MSI 초대 우승 완성"
    ]
  },
  {
    summonerName: "BeryL",
    realName: "조건희 (Cho Geon-hee)",
    trophies: { worlds: 2, msi: 0, lck: 3 },
    description: "협곡의 '도사'이자 천재적인 오더의 판짜기 명가 서포터. 정석적이지 않으며 창의적인 한타 기획과 맵 리딩으로 DWG, DRX 등 서로 다른 팀에서 두 번의 월즈 우승 트로피를 직접 지휘 구상해 보였습니다.",
    signatureChampions: ["Pantheon (판테온)", "Heimerdinger (하이머딩거)", "Bard (바드)", "Maokai (마오카이)"],
    careerHighlights: [
      "서로 다른 두 개의 클럽(DWG, DRX)에서 Worlds 우승컵 획득",
      "서포터 포지션 조율의 패러다임을 바꾼 롤도사 브레인"
    ]
  }
];

export const TEAM_HALL_OF_FAME: TeamBio[] = [
  {
    name: "T1",
    logo: "🔴",
    founded: "2004년 (SKT T1 스타크래프트 시절부터)",
    worldsTitles: 5,
    msiTitles: 2,
    lckTitles: 10,
    description: "e스포츠 역사상 세계 최고 명문 클럽. 임요환 장진남의 전설부터 내려와, 리그 오브 레전드 e스포츠 구축기부터 황제로 군림했습니다. '제오페구케' 5인 로스터를 통해 전설을 재생산하고 있습니다.",
    famousRoster: ["Zeus (최우제)", "Oner (문현준)", "Faker (이상혁)", "Gumayusi (이민형)", "Keria (류민석)"]
  },
  {
    name: "Gen.G Esports",
    logo: "🟡",
    founded: "2017년 (KSV로 시작하여 삼성 갤럭시 인수)",
    worldsTitles: 2, // 삼성 갤럭시 시절 포함
    msiTitles: 1,
    lckTitles: 5,
    description: "삼성 왕조의 유산을 성공적으로 승계받아, 무결점 라인업과 정교한 기량 관리로 LCK 역사상 전무후무한 4연속 우승 (포핏) 신화를 작성한 괴물 구단입니다.",
    famousRoster: ["Kiin (김기인)", "Canyon (김건부)", "Chovy (정지훈)", "Peyz (김수환)", "Lehends (손시우)"]
  },
  {
    name: "Dplus KIA",
    logo: "🟢",
    founded: "2017년 (MiraGe 게이밍, 담원 게이밍)",
    worldsTitles: 1,
    msiTitles: 0,
    lckTitles: 3,
    description: "챌린저스 리그 밑바닥 승격 강자 신화를 이룩하며 2020년 신흥 왕조를 재현하고, 특유의 고강도 무력 전술로 전 세상을 열광시켰던 불꽃의 클럽입니다.",
    famousRoster: ["Nuguri (장하권)", "Canyon (김건부)", "ShowMaker (허수)", "Ghost (장용준)", "BeryL (조건희)"]
  },
  {
    name: "Hanwha Life Esports",
    logo: "🟠",
    founded: "2018년 (락스타이거즈 인수 개편)",
    worldsTitles: 0,
    msiTitles: 0,
    lckTitles: 1,
    description: "적극적인 대형 영입 투자 정책으로 오렌지 군단의 위엄을 회복하고, 마침내 2024년 서머 최강 젠지를 풀세트 명승부 끝에 꺾으며 신흥 패왕으로 승격했습니다.",
    famousRoster: ["Doran (최현준)", "Peanut (한왕호)", "Zeka (김건우)", "Viper (박도현)", "Delight (유환중)"]
  }
];
