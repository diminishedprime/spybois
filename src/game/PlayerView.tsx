import * as React from "react";
import { GameDataInProgress, Player, WithID } from "../types";
import Typography from "@material-ui/core/Typography";
import { useStyles } from "../Game";

interface Props {
  player: Player;
  gameData: WithID<GameDataInProgress>;
}
const PlayerView: React.FC<Props> = ({ gameData }) => {
  const classes = useStyles();
  const currentTeam = gameData.currentTeam;
  if (!gameData.hintSubmitted) {
    return (
      <Typography>
        Waiting on <span className={classes[currentTeam]}>Player</span> to
        Submit
      </Typography>
    );
  }
  return (
    <>
      <Typography>{gameData.hint}</Typography>
    </>
  );
};

export default PlayerView;
