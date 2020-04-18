import * as React from "react";
import { GameDataInProgress, Player, WithID } from "../types";
import Typography from "@material-ui/core/Typography";
import { useTeamTextColor } from "../Game";
import classnames from "classnames";

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

  const numGuesses = (
    <span
      className={classnames(classes[gameData.currentTeam], classes.guessFont)}
    >
      {gameData.currentHint.remainingGuesses}
    </span>
  );

  const guessesText =
    gameData.currentHint.remainingGuesses === "infinity" ||
    gameData.currentHint.remainingGuesses === "zero"
      ? " guess as many as you dare"
      : " guesses (and 1 extra) remaining";

  return (
    <div>
      <div>
        <span
          className={classnames(
            classes[gameData.currentTeam],
            classes.guessFont
          )}
        >
          {gameData.currentHint.hint}
        </span>{" "}
        <span className={classes.guessFont}>
          {gameData.currentHint.hintNumber}
        </span>
      </div>
      <div>
        Guesses left: {numGuesses}
        {guessesText}
      </div>
    </div>
  );
};

export default PlayerView;
