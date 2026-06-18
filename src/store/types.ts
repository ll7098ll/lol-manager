import { Player, Team, Standing, Match, Email, DraftState, GameState, SeasonPhase, Staff, Tactics, SeriesState } from '../types';

export interface GameStore {
  // Time and progression
  currentDate: Date;
  currentWeek: number;
  gameState: GameState;
  season: number;
  seasonPhase: SeasonPhase;
  trainingPoints: number;
  coachingActionsLeft: number;
  
  // Base Database states
  teams: Team[];
  players: Player[];
  playerTeamId: string | null;
  startingLineup: {
    TOP: string;
    JUNGLE: string;
    MID: string;
    ADC: string;
    SUPPORT: string;
  };

  // Standings and schedule
  standings: Standing[];
  schedule: Match[];
  emails: Email[];

  // Tournament / Bracket states
  playoffsMatches: Match[];
  msiMatches: Match[];
  worldsMatches: Match[];
  selectedRegionStanding: 'LCK' | 'LPL' | 'LEC' | 'LCS';

  // Draft room & match viewer states
  activeMatch: Match | null;
  draftState: DraftState | null;
  seriesState: SeriesState | null;
  matchSimulationResult: any | null;
  lastMatchResult: any | null;

  // Methods
  initializeGame: (selectedTeamId: string) => void;
  proceedToNextDay: () => void;
  skipToMatchDay: () => void;
  trainRole: (role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT', statType: 'lanePhase' | 'mechanics' | 'macro' | 'teamfight') => void;
  restRoster: () => void;
  setSelectedRegionStanding: (region: 'LCK' | 'LPL' | 'LEC' | 'LCS') => void;
  simulateBracketMatchDirectly: (matchId: string) => void;
  buildPlayoffsBracket: (lckStandings: Standing[]) => void;
  buildMsiBracket: () => void;
  buildWorldsBracket: () => void;
  updatePlayoffsBracketTree: (matches: Match[]) => void;
  updateMsiBracketTree: (matches: Match[]) => void;
  updateWorldsBracketTree: (matches: Match[]) => void;
  
  // Email actions
  readEmail: (emailId: string) => void;
  respondToOffer: (emailId: string, accept: boolean) => void;

  // Draft room actions
  startDraft: () => void;
  selectBan: (champId: string, side: 'BLUE' | 'RED') => void;
  selectPick: (champId: string, side: 'BLUE' | 'RED') => void;
  autoDraftForOpponent: () => void;
  
  // Mid-simulation triggers
  completeMatch: (result: any) => void;
  completeSetMatch: (setResult: any) => void;
  finishSeries: () => void;
  simulateRemainingTournament: () => void;
  resetToOffice: () => void;
  setGameState: (state: GameState) => void;

  // New stove league & player management methods
  buyPlayer: (playerId: string) => { success: boolean; message: string };
  sellPlayer: (playerId: string) => { success: boolean; message: string };
  tradePlayers: (myPlayerId: string, opponentPlayerId: string) => { success: boolean; message: string };
  updateStartingLineup: (role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT', playerId: string) => void;
  trainPlayerIndividual: (playerId: string, program: string) => { success: boolean; message: string };
  setPlayerTrainingFocus: (playerId: string, focus: 'LANING' | 'MECHANICS' | 'MACRO' | 'TEAMFIGHT' | 'VISION' | 'MENTAL' | 'BALANCED') => void;
  allocateTrainingPoints: (playerId: string, statType: 'lanePhase' | 'mechanics' | 'macro' | 'teamfight', points: number) => { success: boolean; message: string };
  renewContract: (playerId: string, years: number) => void;
  negotiateContractSuccess: (playerId: string, years: number, salary: number, signingBonus: number, isRenewal: boolean) => { success: boolean; message: string };
  startNextSeason: () => void;

  // FM additions
  tactics: Tactics;
  coachingStaff: Staff[];
  activeStaff: {
    HEAD_COACH?: string;
    TACTICAL_COACH?: string;
    MENTAL_COACH?: string;
  };
  academyRookies: Player[];

  changeTactics: (newTactics: Partial<Tactics>) => void;
  setPlayerPlaystyle: (playerId: string, playstyle: 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED') => void;
  hireStaff: (staffId: string) => { success: boolean; message: string };
  fireStaff: (staffId: string) => void;
  talkToPlayer: (playerId: string, talkType: 'ENCOURAGE' | 'CRITICIZE' | 'PROMISE_PLAYTIME') => { message: string; moraleChange: number; formChange: boolean };
  hireAcademyRookie: (rookieId: string) => { success: boolean; message: string };
}
