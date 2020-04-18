import * as React from "react";
import { GameDataInProgress, Player, WithID, HintNumber } from "../types";
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
  const [localHint, setLocalHint] = React.useState(gameData.hint);
  const [localHintNumber, setLocalHintNumber] = React.useState<HintNumber>();
  const submit = React.useCallback(() => {
    if (localHint === "" && gameData.hintNumber !== undefined) {
      return;
    }
    submitHint(db, gameData, localHint);
  }, [localHint, gameData]);

  if (!leader) {
    return null;
  }

  return (
    <>
      <TextField
        value={localHint}
        disabled={gameData.hintSubmitted}
        onChange={(e) => setLocalHint(e.target.value)}
      />
      <Button
        disabled={gameData.hintSubmitted || localHint === ""}
        onClick={submit}
      >
        Submit Hint
      </Button>
    </>
  );
};

export default LeaderView;
