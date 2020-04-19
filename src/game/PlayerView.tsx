import * as React from "react";
import Button from "@material-ui/core/Button";
import { GameDataInProgress, Player, WithID, Team, State } from "../types";
import Typography from "@material-ui/core/Typography";
import { useTeamTextColor } from "../Game";
import classnames from "classnames";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import { passTurn, isPlayer, isYourTurn } from "../db";
import { db } from "../index";
import { JoinNicks } from "../common";
import { useSelector } from "react-redux";

interface Props {
  player: Player;
  gameData: WithID<GameDataInProgress>;
}
const PlayerView: React.FC<Props> = ({ gameData, player }) => {
  const classes = useTeamTextColor();
  const [showConfirmDialog, setShowConfimDialog] = React.useState(false);
  const override = useSelector((s: State) => s.override);
  const canPass =
    override ||
    (isPlayer(gameData, player) &&
      isYourTurn(gameData, player) &&
      // There has been at least one flipped card
      gameData.flippedCards.length > 0 &&
      // And the last flipped card in the game data is for the current team.
      gameData.flippedCards[gameData.flippedCards.length - 1].team ===
        gameData.currentTeam);

  const pass = React.useCallback(() => {
    passTurn(db, gameData).then(() => {
      setShowConfimDialog(false);
    });
  }, [gameData]);

  const currentTeamNicks = (gameData.currentTeam === Team.Team1
    ? gameData.team1AgentIds
    : gameData.team2AgentIds
  ).map((id) => gameData.nickMap[id]);

  if (gameData.currentHint === undefined || !gameData.currentHint.submitted) {
    return (
      <Typography className={classes.playerViewContainer}>
        <span>
          Waiting on{" "}
          <span className={classes[gameData.currentTeam]}>
            {
              gameData.nickMap[
                gameData.currentTeam === Team.Team1
                  ? gameData.team1LeaderId
                  : gameData.team2LeaderId
              ]
            }
          </span>{" "}
          to submit a hint
        </span>
      </Typography>
    );
  }

  const numGuesses = (
    <span
      className={classnames(
        classes[gameData.currentTeam],
        classes.guessFont,
        classes.spaceSpan
      )}
    >
      {typeof gameData.currentHint.remainingGuesses === "number"
        ? gameData.currentHint.remainingGuesses + 1
        : ""}
    </span>
  );

  const guessesText =
    gameData.currentHint.remainingGuesses === "infinity" ||
    gameData.currentHint.remainingGuesses === "zero"
      ? "guess as many as you dare"
      : " left";

  return (
    <div className={classes.playerViewContainer}>
      <div className={classes.guessContainer}>
        <span
          className={classnames(
            classes.spaceSpan,
            classes[gameData.currentTeam],
            classes.guessFont
          )}
        >
          {gameData.currentHint.hint}
        </span>{" "}
        <span className={classnames(classes.guessFont, classes.spaceSpan)}>
          {gameData.currentHint.hintNumber}
        </span>
      </div>
      <div className={classes.guessContainer}>
        <span>
          <JoinNicks nicks={currentTeamNicks} team={gameData.currentTeam} /> to
          guess.
        </span>
      </div>
      <div className={classes.guessContainer}>
        {numGuesses}
        {guessesText}
        {/* Add in a check that they have guessed at least once. */}
        {canPass && (
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
