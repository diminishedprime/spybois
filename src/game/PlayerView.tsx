import * as React from "react";
import { GameDataInProgress, Player, WithID } from "../types";
import Typography from "@material-ui/core/Typography";
import { useTeamTextColor } from "../Game";

interface Props {
  player: Player;
  gameData: WithID<GameDataInProgress>;
}
const PlayerView: React.FC<Props> = ({ gameData }) => {
  const classes = useTeamTextColor();
  if (gameData.currentHint === undefined || !gameData.currentHint.submitted) {
    return (
      <Typography>
        Waiting on{" "}
        <span className={classes[gameData.currentTeam]}>team leader</span> to
        Submit
      </Typography>
    );
  }
  return (
    <>
      <Typography className={classes[gameData.currentTeam]}>
        {gameData.currentHint.hint}
      </Typography>
    </>
  );
};

export default PlayerView;
