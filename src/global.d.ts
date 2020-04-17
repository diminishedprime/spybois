declare interface Player {
  id: string;
  nick?: string;
}

interface BaseGameData {
  players: Player[];
  playerIds: string[];
}

declare interface GameDataInit extends BaseGameData {
  gameState: GameState.Init;
  team1Spy?: Player;
  team2Spy?: Player;
}

declare interface GameDataReady extends BaseGameData {
  gameState: GameState.Ready;
  team1Spy: Player;
  team2Spy: Player;
}

declare type GameData = GameDataInit | GameDataReady;

declare type WithID<T> = T & { id: string };

declare type Firestore = firebase.firestore.Firestore;

declare module "react-copy-to-clipboard";
