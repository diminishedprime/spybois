import * as React from "react";
import {
  GameDataInProgress,
  Player,
  WithID,
  HintData,
  HintNumber,
} from "../types";
import { isLeader, submitHint } from "../db";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { db } from "../index";

interface Props {
  player: Player;
  gameData: WithID<GameDataInProgress>;
}
const LeaderView: React.FC<Props> = ({ gameData, player }) => {
  const leader = isLeader(gameData, player);
  const [localHint, setLocalHint] = React.useState<HintData>(() => {
    if (gameData.currentHint !== undefined) {
      return gameData.currentHint;
    } else {
      return {
        hint: "",
        hintNumber: 1,
        remainingGuesses: 1,
        submitted: false,
        team: gameData.currentTeam,
      };
    }
  });
  const submit = React.useCallback(() => {
    if (localHint.hint === "") {
      return;
    }
    submitHint(db, gameData, localHint);
  }, [localHint, gameData]);

  React.useEffect(() => {
    if (localHint.remainingGuesses !== localHint.hintNumber) {
      setLocalHint({ ...localHint, remainingGuesses: localHint.hintNumber });
    }
  }, [localHint]);

  React.useEffect(() => {
    // Keep the local hint's team in sync with the game's current team.
    if (
      localHint !== undefined &&
      localHint.team === undefined &&
      localHint.team !== gameData.currentTeam
    ) {
      setLocalHint((current) => ({ ...current, team: gameData.currentTeam }));
    }
  }, [localHint.team, gameData.currentTeam]);

  const bumpNum = React.useCallback(
    (direction: "up" | "down") => () => {
      setLocalHint((currentHint) => {
        const currentNumber = currentHint.hintNumber;
        if (currentNumber === "zero" && direction === "down") {
          return currentHint;
        }
        if (currentNumber === "infinity" && direction === "up") {
          return currentHint;
        }

        let nuNumber: HintNumber;
        if (currentNumber === "infinity" && direction === "down") {
          // TODO - Playtest to figure out if this number is big enough???
          nuNumber = 9;
        } else if (currentNumber === "zero" && direction === "up") {
          nuNumber = 1;
        } else {
          const bump = direction === "down" ? -1 : 1;
          if (typeof currentNumber !== "number") {
            // This path shouldn't be reachable.
            return currentHint;
          }
          nuNumber = currentNumber + bump;
        }
        if (nuNumber === 0) {
          nuNumber = "zero";
        }
        if (nuNumber === 10) {
          nuNumber = "infinity";
        }
        return { ...currentHint, hintNumber: nuNumber };
      });
    },
    []
  );

  if (!leader) {
    return null;
  }

  console.log({ localHint });

  return (
    <>
      <TextField
        value={localHint?.hint || ""}
        disabled={localHint.submitted}
        onChange={(e) => setLocalHint({ ...localHint, hint: e.target.value })}
      />
      <Button
        disabled={localHint.hintNumber === "zero" || localHint.submitted}
        onClick={bumpNum("down")}
      >
        -
      </Button>
      {localHint.hintNumber}
      <Button
        disabled={localHint.hintNumber === "infinity" || localHint.submitted}
        onClick={bumpNum("up")}
      >
        +
      </Button>
      <Button
        disabled={localHint.submitted || localHint.hint === ""}
        onClick={submit}
      >
        Submit Hint
      </Button>
    </>
  );
};

export default LeaderView;
