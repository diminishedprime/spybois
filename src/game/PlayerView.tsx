import * as React from "react";
import Button from "@material-ui/core/Button";
import { GameDataInProgress, Player, WithID, Team } from "../types";
import Typography from "@material-ui/core/Typography";
import { useTeamTextColor } from "../Game";
import classnames from "classnames";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import { passTurn, isPlayer } from "../db";
import { db } from "../index";

interface Props {
  player: Player;
  gameData: WithID<GameDataInProgress>;
}
const PlayerView: React.FC<Props> = ({ gameData, player }) => {
  const classes = useTeamTextColor();
  const [showConfirmDialog, setShowConfimDialog] = React.useState(false);

  const pass = React.useCallback(() => {
    passTurn(db, gameData).then(() => {
      setShowConfimDialog(false);
    });
  }, [gameData]);

  if (gameData.currentHint === undefined || !gameData.currentHint.submitted) {
    return (
      <Typography className={classes.playerViewContainer}>
        <span>
          Waiting on{" "}
          <span className={classes[gameData.currentTeam]}>team leader</span> to
          Submit
        </span>
      </Typography>
    );
  }

  const numGuesses = (
    <span
      className={classnames(classes[gameData.currentTeam], classes.guessFont)}
    >
      {typeof gameData.currentHint.remainingGuesses === "number"
        ? gameData.currentHint.remainingGuesses + 1
        : gameData.currentHint.remainingGuesses}
    </span>
  );

  const guessesText =
    gameData.currentHint.remainingGuesses === "infinity" ||
    gameData.currentHint.remainingGuesses === "zero"
      ? " guess as many as you dare"
      : " left";

  return (
    <div className={classes.playerViewContainer}>
      <div className={classes.guessContainer}>
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
      <div className={classes.guessContainer}>
        {numGuesses}
        {guessesText}
        {/* Add in a check that they have guessed at least once. */}
        {isPlayer(gameData, player) && (
          <Button
            style={{ marginLeft: "8px" }}
            variant="outlined"
            color={
              gameData.currentTeam === Team.Team1 ? "primary" : "secondary"
            }
            onClick={() => setShowConfimDialog(true)}
          >
            Pass
          </Button>
        )}
      </div>
      <Dialog
        open={showConfirmDialog}
        onClose={() => {
          setShowConfimDialog(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Skip the rest of your turn?
        </DialogTitle>
        <DialogActions>
          <Button
            color={
              gameData.currentTeam === Team.Team1 ? "primary" : "secondary"
            }
            variant="contained"
            onClick={() => {
              // TODO
              pass();
            }}
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              setShowConfimDialog(false);
            }}
          >
            Nevermind
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PlayerView;
