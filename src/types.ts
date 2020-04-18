import { Action } from "redux";
export type WithID<T> = T & { id: string };

export enum Role {
  Leader = "leader",
  Agent = "agent",
}

export enum Team {
  Team1 = "team1",
  Team2 = "team2",
}

export enum GameState {
  Init = "init",
  // This isn't actually used as of now...
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

export interface GameDataInProgress extends BaseGameData, Teams {
  gameState: GameState.InProgress;
}

export type GameData = GameDataReady | GameDataInit | GameDataInProgress;

export enum ActionType {
  SetNick = "set-nick",
}

export interface SetNickAction extends Action {
  type: ActionType.SetNick;
  nick: string;
}

export type Actions = SetNickAction;

export interface State {
  nick: string;
}
