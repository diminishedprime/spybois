import firebase from "firebase/app";
// TODO remeve this import.
import * as types from "./types";
import {
  GameData,
  GameState,
  GameDataInit,
  Player,
  GameDataGameOver,
  WithID,
  HintData,
  Team,
  Role,
  GameDataInProgress,
} from "./types";

export const isLeader = (
  gameData: GameDataInProgress,
  player: Player
): boolean => {
  const isTeam1Leader = gameData.team1LeaderId === player.id;
  const isTeam2Leader = gameData.team2LeaderId === player.id;
  return isTeam1Leader || isTeam2Leader;
};

export const isPlayer = (
  gameData: GameDataInProgress,
  player: Player
): boolean => {
  const isOnTeam1 = gameData.team1AgentIds.includes(player.id);
  const isOnTeam2 = gameData.team2AgentIds.includes(player.id);
  return isOnTeam1 || isOnTeam2;
};

export const newFullGame = (
  uid: string,
  nick: string,
  asLeader: boolean
): GameData => {
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
    team1AgentIds: ["a", asLeader ? "b" : uid],
    team1LeaderId: asLeader ? uid : "b",
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
  gameData: WithID<GameDataInit>,
  player: Player
): Promise<void> => {
  const id = player.id;
  let updateObject: Partial<UpdateGame<GameDataInit>> = {};
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

export const otherTeam = (team: Team): Team => {
  return team === Team.Team1 ? Team.Team2 : Team.Team1;
};

export const passTurn = async (
  db: Firestore,
  gameData: WithID<GameDataInProgress>
): Promise<void> => {
  const currentHint = gameData.currentHint;
  const nuTeam = otherTeam(gameData.currentTeam);
  const nuPreviousHints = gameData.previousHints;
  // This _should_ always be the case.
  if (currentHint !== undefined) {
    nuPreviousHints.push({
      team: currentHint.team,
      hint: currentHint.hint,
      hintNumber: currentHint.hintNumber,
    });
  }
  const update: Partial<UpdateGame> = {
    currentTeam: nuTeam,
    currentHint: firebase.firestore.FieldValue.delete(),
    previousHints: nuPreviousHints,
  };
  return await gameDoc(db, gameData.id).update(update);
};

export const flipCard = async (
  db: Firestore,
  gameData: WithID<GameDataInProgress>,
  card: types.Card
): Promise<void> => {
  const currentTeam = gameData.currentTeam;
  let correct = false;
  const nuCards = gameData.cards.map((c) => {
    if (c.id === card.id) {
      if (card.team === currentTeam) {
        correct = true;
      }
    }
    return c.id === card.id ? { ...c, flipped: true } : c;
  });

  let nuCurrentTeam = gameData.currentTeam;
  let nuCurrentHint: HintData | undefined | firebase.firestore.FieldValue =
    gameData.currentHint;
  let nuPreviousHints = gameData.previousHints;
  if (nuCurrentHint !== undefined) {
    // If the flipped card was correct, decrement the number of guesses.
    if (correct) {
      if (
        nuCurrentHint.remainingGuesses === "infinity" ||
        nuCurrentHint.remainingGuesses === "zero"
      ) {
        // Do nothing, they get to keep going.
      } else {
        // Decrement the reamining guesses by 1.
        nuCurrentHint.remainingGuesses = nuCurrentHint.remainingGuesses - 1;
      }
    } else {
    }
    // If after updating the remaining guesses it's the value 0 (not 'zero'), or
    // if they got the wrong card, it should be the next teams turn.
    // TODO - Add special handling for assassin???
    if (nuCurrentHint.remainingGuesses === 0 || !correct) {
      nuPreviousHints.push({
        team: nuCurrentHint.team,
        hint: nuCurrentHint.hint,
        hintNumber: nuCurrentHint.hintNumber,
      });
      nuCurrentHint = firebase.firestore.FieldValue.delete();
      nuCurrentTeam = nuCurrentTeam === Team.Team1 ? Team.Team2 : Team.Team1;
    }
  }

  // If the assassin card is now flipped
  const assassinFlipped = nuCards.find(
    (a) => a.team === types.NPC.Assassin && a.flipped
  );
  // , or if all cards of a team are flipped, the game is over.
  const team1CardsAllFlipped = nuCards
    .filter((a) => a.team === Team.Team1)
    .every((a) => a.flipped);
  const team2CardsAllFlipped = nuCards
    .filter((a) => a.team === Team.Team2)
    .every((a) => a.flipped);
  if (team1CardsAllFlipped || team2CardsAllFlipped || assassinFlipped) {
    // The game is over, so update accordingly.
    const winner = assassinFlipped
      ? otherTeam(gameData.currentTeam)
      : team1CardsAllFlipped
      ? Team.Team1
      : Team.Team2;
    const update: UpdateGame<Pick<
      GameDataGameOver,
      "winner" | "previousHints" | "gameState"
    >> = {
      gameState: GameState.GameOver,
      winner,
      previousHints: nuPreviousHints,
    };
    return await gameDoc(db, gameData.id).update(update);
  } else {
    const update: Partial<UpdateGame> = {
      cards: nuCards,
      currentHint: nuCurrentHint,
      currentTeam: nuCurrentTeam,
      previousHints: nuPreviousHints,
    };
    return await gameDoc(db, gameData.id).update(update);
  }
};

export const submitHint = async (
  db: Firestore,
  gameData: WithID<GameData>,
  hint: HintData
) => {
  const update: Partial<UpdateGame> = {
    currentHint: hint,
  };
  return await gameDoc(db, gameData.id).update(update);
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
