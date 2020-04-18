import firebase from "firebase/app";
import * as types from "./types";
import { GameData, Player, WithID, Team, Role } from "./types";

export const newFullGame = (uid: string, nick: string): GameData => {
  return {
    nickMap: {
      [uid]: nick,
      a: "John",
      b: "Jessica",
      c: "Newton",
      d: "Peter the cat",
    },
    playerIds: [uid, "a", "b", "c", "d"],
    gameState: types.GameState.Init,
    team1AgentIds: ["a"],
    team1LeaderId: "b",
    team2AgentIds: ["c"],
    team2LeaderId: "d",
  };
};

export const newGameWithSelf = (uid: string, nick: string): GameData => {
  return {
    nickMap: { [uid]: nick },
    playerIds: [uid],
    gameState: types.GameState.Init,
  };
};

export const gamesCollection = (db: firebase.firestore.Firestore) => {
  return db.collection("games");
};

const gameDoc = (db: firebase.firestore.Firestore, gameUid: string) => {
  return gamesCollection(db).doc(gameUid);
};

export const joinGame = async (
  db: firebase.firestore.Firestore,
  gameData: WithID<GameData>,
  player: Player
): Promise<void> => {
  let update: Partial<UpdateGame> = {};
  if (gameData.nickMap[player.id] !== player.nick) {
    update.nickMap = {
      ...gameData.nickMap,
      [player.id]: player.nick || "nameyoself",
    };
  }
  update.playerIds = firebase.firestore.FieldValue.arrayUnion(player.id);
  return await gameDoc(db, gameData.id).update(update);
};

export const unJoinTeam = async (
  db: Firestore,
  gameData: WithID<GameData>,
  player: Player
): Promise<void> => {
  const id = player.id;
  let updateObject: Partial<UpdateGame> = {};
  if (gameData.team1LeaderId === id) {
    updateObject.team1LeaderId = firebase.firestore.FieldValue.delete();
  }
  if (gameData.team1AgentIds?.includes(id)) {
    updateObject.team1AgentIds = firebase.firestore.FieldValue.arrayRemove(id);
  }
  if (gameData.team2LeaderId === id) {
    updateObject.team2LeaderId = firebase.firestore.FieldValue.delete();
  }
  if (gameData.team2AgentIds?.includes(id)) {
    updateObject.team2AgentIds = firebase.firestore.FieldValue.arrayRemove(id);
  }
  // No sense in talking to the database if there's nothing to actually change.
  if (updateObject === {}) {
    return;
  }

  return await gameDoc(db, gameData.id).update(updateObject);
};

type UpdateGame<T = GameData> = {
  [K in keyof T]: firebase.firestore.FieldValue | T[K];
};

export const onTeam = (gameData: GameData, player: Player) => {
  const ids = [
    gameData.team1LeaderId,
    ...(gameData.team1AgentIds || []),
    gameData.team2LeaderId,
    ...(gameData.team2AgentIds || []),
  ];
  return ids.includes(player.id);
};

export const teamsReady = (gameData: GameData) => {
  const team1 = [gameData.team1LeaderId, ...(gameData.team1AgentIds || [])];
  const team2 = [gameData.team2LeaderId, ...(gameData.team2AgentIds || [])];
  return (
    team1.length > 1 &&
    team1.every((a) => a !== undefined) &&
    team2.length > 1 &&
    team2.every((a) => a !== undefined)
  );
};

export const gameReady = (gameData: GameData) => {
  return teamsReady(gameData);
};

export const startGame = async (
  db: Firestore,
  gameData: WithID<GameData>
): Promise<void> => {
  if (!gameReady(gameData)) {
    return;
  }
  let update: Partial<UpdateGame> = {
    gameState: types.GameState.Ready,
  };
  return await gameDoc(db, gameData.id).update(update);
};

export const joinTeam = async (
  db: Firestore,
  gameData: WithID<GameData>,
  player: Player,
  team: Team,
  role: Role
): Promise<void> => {
  // If the player is already on a team, don't do anything.
  if (onTeam(gameData, player)) {
    console.info("Already on team", { gameData, player, team, role });
    return;
  }
  let updateObject: Partial<UpdateGame> = {};
  if (
    team === Team.Team1 &&
    role === Role.Leader &&
    gameData.team1LeaderId === undefined
  ) {
    updateObject.team1LeaderId = player.id;
  }
  if (team === Team.Team1 && role === Role.Agent) {
    updateObject.team1AgentIds = firebase.firestore.FieldValue.arrayUnion(
      player.id
    );
  }
  if (
    team === Team.Team2 &&
    role === Role.Leader &&
    gameData.team2LeaderId === undefined
  ) {
    updateObject.team2LeaderId = player.id;
  }
  if (team === Team.Team2 && role === Role.Agent) {
    updateObject.team2AgentIds = firebase.firestore.FieldValue.arrayUnion(
      player.id
    );
  }
  return await gameDoc(db, gameData.id).update(updateObject);
};

export const subscribeToGamesWithPlayer = (
  db: Firestore,
  uid: string,
  cb: (games: WithID<GameData>[]) => void
): (() => void) => {
  return gamesCollection(db)
    .where("playerIds", "array-contains", uid)
    .onSnapshot((data) => {
      // TODO - there should actually be some checks on the shape of the data.
      const games = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as WithID<GameData>[];
      cb(games);
    });
};

export const subcribeToGameChanges = (
  db: Firestore,
  gameUid: string,
  cb: (gameData: WithID<GameData> | undefined) => void
): (() => void) => {
  const unSub = gameDoc(db, gameUid).onSnapshot((game) => {
    if (game.exists) {
      const data = game.data();
      const withId = { ...data, id: game.id };
      cb(withId as WithID<GameData>);
    } else {
      cb(undefined);
    }
  });
  return unSub;
};