export type WithID<T> = T & { id: string };

export enum Role {
  Leader = "leader",
  Agent = "agent",
}

export enum NPC {
  Bystander = "bystander",
  Assassin = "assassin",
}

export enum Team {
  Team1 = "team1",
  Team2 = "team2",
}

export enum GameState {
  Init = "init",
  Ready = "ready",
  InProgress = "in-progress",
  GameOver = "game-over",
}
export enum StorageKey {
  Nick = "@spybois/nick",
}

export interface Player {
  id: string;
  nick?: string;
}

export interface BaseGameData {
  playerIds: string[];
  nickMap: { [id: string]: string };
}

export interface Teams {
  team1LeaderId: string;
  team1AgentIds: string[];

  team2LeaderId: string;
  team2AgentIds: string[];
}

export interface GameDataInit extends BaseGameData, Partial<Teams> {
  gameState: GameState.Init;
}

export interface GameDataReady extends BaseGameData, Teams {
  gameState: GameState.Ready;
}

export interface Card {
  id: string;
  value: string;
  flipped: boolean;
  team: Team | NPC;
}

export interface FlippedCard {
  id: string;
  value: string;
  flipped: true;
  team: Team | NPC;
  teamThatFlipped: Team;
}

export type HintNumber = number | "zero" | "infinity";

export interface HintData {
  hintNumber: HintNumber;
  hint: string;
  team: Team;
  submitted: boolean;
  remainingGuesses: HintNumber;
}

export type PreviousHint = Omit<
  Omit<HintData, "remainingGuesses">,
  "submitted"
>;

export interface GameDataInProgress extends BaseGameData, Teams {
  gameState: GameState.InProgress;
  cards: Card[];
  currentTeam: Team;
  previousHints: PreviousHint[];
  flippedCards: FlippedCard[];
  currentHint?: HintData;
  // Time that the timer was started as an unix epoch in milliseconds.
  timerStartTime?: number;
}

export interface GameDataGameOver extends BaseGameData, Teams {
  gameState: GameState.GameOver;
  winner: Team;
  cards: Card[];
  currentTeam: Team;
  previousHints: PreviousHint[];
  flippedCards: FlippedCard[];
  currentHint?: HintData;
}

export type GameData =
  | GameDataReady
  | GameDataInit
  | GameDataInProgress
  | GameDataGameOver;

export enum ActionType {
  SetOverride = "set-override",
  SetNick = "set-nick",
}

export interface SetOverride {
  type: ActionType.SetOverride;
  override: boolean;
}

export interface SetNickAction {
  type: ActionType.SetNick;
  nick: string;
}

export type Actions = SetNickAction | SetOverride;

export interface State {
  override: boolean;
  nick: string;
}
