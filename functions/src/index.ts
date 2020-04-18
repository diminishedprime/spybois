import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const app = admin.app();

export const addWords = functions.firestore
  .document("/games/{gameId}")
  .onUpdate((change, context) => {
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
        app
          .firestore()
          .collection("games")
          .doc(gameId)
          .update({
            gameState: "in-progress",
            words: [{ id: "a", value: "John", flipped: false, team: "team1" }],
          });
      }
  });
