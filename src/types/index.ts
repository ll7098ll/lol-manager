export interface Player {
  id: string;
  name: string;         // Real name
  summonerName: string;   // Nickname (e.g., Faker)
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  teamId: string;
  age: number;
  contractYears: number;
  salary: number;       // In ten-thousand won (만원) or similar

  // Stats (1 ~ 99)
  lanePhase: number;    // Laning ability
  mechanics: number;    // Physical mechanical skill
  macro: number;        // Strategic macro & Map reading
  teamfight: number;    // Teamfighting & Focus
  shotcalling: number;  // Shotcalling logic (gives synergy bonus)
  mental: number;       // Mental state (composure during crisis)
  consistency: number;  // Consistency (higher means less roller-coaster rolls)

  // Champion Mastery (champion ID: level 1~10)
  championPool: Record<string, number>;

  condition: number;    // Current condition multiplier (80% ~ 120%)
  form: 'UP' | 'NORMAL' | 'DOWN'; // Form indicator (↑, →, ↓)
  morale?: number;       // Current morale (1 ~ 100)
  potential?: number;    // Player potential limit (70 ~ 99)
  playstylePreference?: 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED';
  energy?: number;       // Current energy (0 ~ 100, where 100 is fully rested and active)
  trainingFocus?: 'LANING' | 'MECHANICS' | 'MACRO' | 'TEAMFIGHT' | 'VISION' | 'MENTAL' | 'BALANCED';
  trainingProgress?: number; // 0 to 100
}

export interface Champion {
  id: string;
  name: string;
  tier: 1 | 2 | 3;                      // Meta tier (1 is OP, 3 is niche)
  lane: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[];
  counterIds: string[];                 // List of counter champion IDs
  synergyIds: string[];                 // List of synergistic champion IDs
  scaling: 'EARLY' | 'MID' | 'LATE';     // Scaling style
  style: 'POKE' | 'TEAMFIGHT' | 'SPLIT' | 'ENGAGE'; // Playstyle
}

export interface Team {
  id: string;
  name: string;
  logo: string;                         // Emoji representation (e.g. 🦊, 🐉, 🦅)
  color: string;                        // Theme color (hex)
  textColor: string;                   // High-contrast text color for labels
  tier: 'S' | 'A' | 'B' | 'C';
  fans: number;
  budget: number;                       // In ten-thousand won (만원)
  region?: 'LCK' | 'LPL' | 'LEC' | 'LCS';
  roster: {
    TOP?: string;
    JUNGLE?: string;
    MID?: string;
    ADC?: string;
    SUPPORT?: string;
    SUB?: string[];
  };
}

export interface Standing {
  teamId: string;
  wins: number;
  losses: number;
  gameDiff: number; // Difference of games (not used fully, but good for ties)
}

export interface PlayerMatchStats {
  playerId: string;
  summonerName: string;
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  visionScore: number;
  championName: string;
  dpm?: number;          // Damage Per Minute
  damageDealt?: number;  // Cumulative damage dealt in match
}

export interface Match {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  winnerId?: string;
  score?: { home: number; away: number }; // BO3 or BO1 depending on design, we will use BO1 for simplicity and responsiveness
  log?: string[];
  goldDiffHistory?: number[]; // history of gold difference
  xpDiffHistory?: number[];   // history of experience difference
  killHistory?: { home: number; away: number }[];
  pogPlayerId?: string; // Player of the game
  matchType?: 'SPRING_REGULAR' | 'SPRING_PLAYOFFS' | 'MSI' | 'SUMMER_REGULAR' | 'SUMMER_PLAYOFFS' | 'WORLDS';
  homeStats?: PlayerMatchStats[];
  awayStats?: PlayerMatchStats[];
}

export type SeasonPhase = 'SPRING_REGULAR' | 'SPRING_PLAYOFFS' | 'MSI' | 'SUMMER_REGULAR' | 'SUMMER_PLAYOFFS' | 'WORLDS' | 'STOVE_LEAGUE';

export interface Email {
  id: string;
  sender: string;
  title: string;
  content: string;
  date: string;
  read: boolean;
  type: 'NEWS' | 'SYSTEM' | 'OFFER' | 'CONGRATS';
  offerDetails?: {
    type: 'TRANSFER' | 'SCOUT';
    playerId?: string;
    teamId?: string;
    price?: number;
  };
}

export type GameState = 'SETUP' | 'OFFICE' | 'DRAFT' | 'MATCH' | 'SUMMARY' | 'STOVE_LEAGUE';

export interface DraftState {
  blueTeamId: string;
  redTeamId: string;
  blueBans: string[];
  redBans: string[];
  bluePicks: string[];
  redPicks: string[];
  currentTurn: 'BLUE_BAN_1' | 'RED_BAN_1' | 'BLUE_BAN_2' | 'RED_BAN_2' | 'BLUE_BAN_3' | 'RED_BAN_3' |
               'BLUE_PICK_1' | 'RED_PICK_1' | 'RED_PICK_2' | 'BLUE_PICK_2' | 'BLUE_PICK_3' | 'RED_PICK_3' |
               'BLUE_BAN_4' | 'RED_BAN_4' | 'BLUE_BAN_5' | 'RED_BAN_5' |
               'RED_PICK_4' | 'BLUE_PICK_4' | 'BLUE_PICK_5' | 'RED_PICK_5' | 'COMPLETE';
  blueRoles?: Record<string, string>; // e.g. { 'TOP': 'ksante', ... }
  redRoles?: Record<string, string>;  // e.g. { 'TOP': 'sejuani', ... }
}

export interface Tactics {
  teamFocusRole: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | 'BALANCED';
  gameTempo: 'EARLY_SNOWBALL' | 'BALANCED' | 'LATE_SCALING';
  playstyle: 'POKE' | 'TEAMFIGHT' | 'SPLIT' | 'ENGAGE';
}

export interface Staff {
  id: string;
  name: string;
  role: 'HEAD_COACH' | 'TACTICAL_COACH' | 'MENTAL_COACH';
  teamId: string; // 'FA' or team id
  salary: number; // in ten-thousand won (만원)
  rating: number; // 0-99 rating
  trainingSkill: number; // For HEAD_COACH: boosts individual training
  tacticalSkill: number; // For TACTICAL_COACH: boosts drafting bonus
  mentalSkill: number; // For MENTAL_COACH: boosts morale recovery & conditions
}

