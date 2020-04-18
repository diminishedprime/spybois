import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { makeBoard } from "./words";

const app = admin.initializeApp();

export const addWordsToGame = functions.firestore
  .document("/games/{gameId}")
  .onUpdate(async (change, context) => {
    // Only add words when the game first goes from init to ready.
    const gameId = context.params.gameId;
    if (gameId === undefined) {
      return;
    }
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (beforeData === undefined) {
      return;
    }
    if (afterData === undefined) {
      return;
    }
    if (context.params)
      if (
        beforeData.gameState !== undefined &&
        beforeData.gameState === "init" &&
        afterData.gameState !== undefined &&
        afterData.gameState === "ready"
      ) {
        // add the words & update the gameState to be in-progress.
        await app.firestore().collection("games").doc(gameId).update({
          gameState: "in-progress",
          words: makeBoard(),
        });
      }
  });
