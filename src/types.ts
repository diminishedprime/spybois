export type WithID<T> = T & { id: string };

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
  players: Player[];
  playerIds: string[];
}

export interface GameDataInit extends BaseGameData {
  gameState: GameState.Init;
  team1Spy?: Player;
  team2Spy?: Player;
}

export interface GameDataReady extends BaseGameData {
  gameState: GameState.Ready;
  team1Spy: Player;
  team2Spy: Player;
}

export type GameData = GameDataReady | GameDataInit;
