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
  const [localHint, setLocalHint] = React.useState<
    Partial<HintData & { remainingGuesses: HintNumber }> | undefined
  >(gameData.currentHint);
  const submit = React.useCallback(() => {
    if (localHint === undefined) {
      return;
    }
    if (localHint.hintNumber === undefined) {
      return;
    }
    if (localHint.remainingGuesses === undefined) {
      return;
    }
    if (localHint.hint === undefined) {
      return;
    }
    if (localHint.hint === "") {
      return;
    }
    if (localHint.team === undefined) {
      return;
    }
    const concreteHint: HintData = {
      hint: localHint.hint,
      hintNumber: localHint.hintNumber,
      remainingGuesses: localHint.remainingGuesses,
      team: localHint.team,
      submitted: true,
    };
    submitHint(db, gameData, concreteHint);
  }, [localHint, gameData]);

  React.useEffect(() => {
    // Keep the local hint's team in sync with the game's current team.
    if (
      localHint !== undefined &&
      localHint.team === undefined &&
      localHint.team !== gameData.currentTeam
    ) {
      setLocalHint((current) => ({ ...current, team: gameData.currentTeam }));
    }
  }, [localHint, gameData.currentTeam]);

  if (!leader) {
    return null;
  }

  return (
    <>
      <TextField
        value={localHint}
        disabled={gameData.currentHint?.submitted}
        onChange={(e) => setLocalHint({ ...localHint, hint: e.target.value })}
      />
      <Button
        disabled={
          gameData.currentHint?.submitted ||
          localHint === "" ||
          gameData.currentHint?.remainingGuesses === undefined
        }
        onClick={submit}
      >
        Submit Hint
      </Button>
    </>
  );
};

export default LeaderView;
