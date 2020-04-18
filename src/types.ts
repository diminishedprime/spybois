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

interface Teams {
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

export type HintNumber = number | "zero" | "infinity";

export interface GameDataInProgress extends BaseGameData, Teams {
  gameState: GameState.InProgress;
  cards: Card[];
  currentTeam: Team;
  hintSubmitted: boolean;
  hint: string;
  // This is the hint given by the leader
  hintNumber?: HintNumber;
  // This is how many remain. This will use maths if the HintNumber isn't 'zero' or 'infininty'
  remainingGuesses?: HintNumber;
}

export type GameData = GameDataReady | GameDataInit | GameDataInProgress;

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
