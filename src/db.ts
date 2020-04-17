import firebase from "firebase/app";
import * as types from "./types";
import { GameData, Player, WithID } from "./types";

export const newGameWithSelf = (uid: string, nick: string): GameData => {
  return {
    playerIds: [uid],
    players: [{ id: uid, nick }],
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
  gameUid: string,
  player: Player
): Promise<void> => {
  return await gameDoc(db, gameUid).update({
    playerIds: firebase.firestore.FieldValue.arrayUnion(player.id),
    players: firebase.firestore.FieldValue.arrayUnion(player),
  });
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
    const data = game.data();
    const withId = { ...data, id: game.id };
    cb(withId as WithID<GameData>);
  });
  return unSub;
};
