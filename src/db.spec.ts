import * as firebase from "@firebase/testing";
import "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import {
  GameData,
  GameDataInit,
  GameDataReady,
  GameState,
  Player,
  GameDataInProgress,
  Team,
  HintData,
  WithID,
} from "./types";
import * as sut from "./db";
import * as fs from "fs";
import "jest";
const projectId = "spy-bois";

const rules = fs.readFileSync("firestore.rules", "utf8");

const authedApp = (auth?: object) => {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
};

const adminApp = () => {
  return firebase.initializeAdminApp({ projectId }).firestore();
};

const loadFirestoreRules = async () => {
  await firebase.loadFirestoreRules({ projectId, rules });
};

const clearFirestoreData = async () => {
  await firebase.clearFirestoreData({ projectId });
};

const clearApps = async () => {
  await Promise.all(firebase.apps().map((app) => app.delete()));
};

const a: Player = { id: "a" };
const b: Player = { id: "b" };
const c: Player = { id: "c" };
const d: Player = { id: "d" };

const card1 = {
  id: "card1",
  value: "My Card 1",
  flipped: false,
  team: Team.Team1,
};
const card2 = {
  id: "card2",
  value: "My Card 2",
  flipped: false,
  team: Team.Team1,
};
const card3 = {
  id: "card3",
  value: "My Card 3",
  flipped: false,
  team: Team.Team1,
};
const card4 = {
  id: "card4",
  value: "My Card 4",
  flipped: false,
  team: Team.Team2,
};
const inProgressGame = (): GameDataInProgress => {
  return {
    gameState: GameState.InProgress,
    playerIds: [a.id, b.id, c.id, d.id],
    nickMap: { [a.id]: "Ayyy", [b.id]: "Beee", [c.id]: "Ceee", [d.id]: "Deee" },
    team1LeaderId: a.id,
    team2LeaderId: b.id,
    team1AgentIds: [c.id],
    team2AgentIds: [d.id],
    currentTeam: Team.Team1,
    previousHints: [],
    cards: [card1, card2, card3, card4],
  };
};

const withHint = (
  gameData: GameDataInProgress,
  hint: HintData
): GameDataInProgress => {
  return {
    ...gameData,
    currentTeam: hint.team,
    currentHint: hint,
  };
};

describe("for the db", () => {
  beforeAll(async () => {
    await loadFirestoreRules();
  });

  beforeEach(async () => {
    await clearFirestoreData();
  });

  afterAll(async () => {
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  test("flipCard with 1 allows 2 guesses. (1, plus 1 extra)", async () => {
    const app = authedApp({ uid: c.id });
    const gameWithHint = withHint(inProgressGame(), {
      team: Team.Team1,
      hintNumber: 1,
      submitted: true,
      remainingGuesses: 1,
      hint: "Good hint",
    });
    // Add this game to the database.
    const doc = await sut.gamesCollection(app).add(gameWithHint);
    const withId: WithID<GameDataInProgress> = { ...gameWithHint, id: doc.id };

    // Flip the first card.
    await sut.flipCard(app, withId, card1, firebase);

    const gameAfterFlip = (
      await sut.gameDoc(app, doc.id).get()
    ).data() as GameData;
    if (gameAfterFlip.gameState !== GameState.InProgress) {
      fail("The game state should still be in progress after this flip");
    }
    expect(gameAfterFlip.currentHint?.remainingGuesses).toBe(0);
    expect(gameAfterFlip.currentHint).not.toBeUndefined();
    expect(gameAfterFlip.currentTeam).toBe(Team.Team1);

    // Flip the second card.
    await sut.flipCard(app, withId, card2, firebase);

    const gameAfterSecondFlip = (
      await sut.gameDoc(app, doc.id).get()
    ).data() as GameData;
    if (gameAfterSecondFlip.gameState !== GameState.InProgress) {
      fail("The game state should still be in progress after this flip");
    }

    expect(gameAfterSecondFlip.currentHint).toBeUndefined();
    expect(gameAfterSecondFlip.currentTeam).toBe(Team.Team2);
  });
});
