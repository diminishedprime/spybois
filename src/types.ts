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
  Ready = "ready",
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

export type GameData = GameDataReady | GameDataInit;
