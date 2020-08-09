import React from "react";
import Badge from "@material-ui/core/Badge";
import { useSelector } from "react-redux";
import { JoinNicks } from "./common";
import { useParams, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import { Link } from "react-router-dom";
import { NickName } from "./common";
import {
  subcribeToGameChanges,
  joinGame,
  joinTeam,
  onSpecificTeam,
  onTeam,
  gameReady,
  isLeader,
  startGame,
  flipCard,
  resetGame,
  passTurn,
  startTimer,
} from "./db";
import { db } from "./index";
import * as types from "./types";
import {
  State,
  Player,
  WithID,
  GameData,
  GameState,
  GameDataInit,
  Team,
  Role,
  GameDataInProgress,
} from "./types";
import { makeStyles } from "@material-ui/core/styles";
import classnames from "classnames";
import CopyGameToClipboard from "./game/CopyGameToClipboard";
import LeaderView from "./game/LeaderView";
import PlayerView from "./game/PlayerView";
import { Override } from "./common";

export const useTeamTextColor = makeStyles((theme) => ({
  previousHints: {
    display: "flex",
  },
  previousHint: {
    margin: theme.spacing(0, 1),
  },
  playerViewContainer: {
    margin: theme.spacing(1, 10),
    display: "flex",
    width: "80vw",
    justifyContent: "space-around",
    alignItems: "center",
  },
  guessContainer: {
    display: "flex",
    flexGrow: 1,
    alignItems: "baseline",
    justifyContent: "center",
  },
  spaceSpan: {
    margin: theme.spacing(0, 1),
  },
  [types.Team.Team1]: {
    color: theme.palette.primary.main,
  },
  [types.Team.Team2]: {
    color: theme.palette.secondary.main,
  },
  guessFont: {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: 700,
  },
}));

export const useStyles = makeStyles((theme) => ({
  bottomRow: {
    display: "flex",
    alignItems: "center",
    "& > div": {
      margin: theme.spacing(0, 1),
    },
  },
  timer: {
    display: "flex",
    alignItems: "center",
  },
  timerTime: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: "bold",
    textAlign: "center",
    minWidth: theme.spacing(9),
  },
  timerButton: {
    marginLeft: theme.spacing(1),
  },
  leaderViewContainer: {
    margin: theme.spacing(0),
    display: "flex",
    alignItems: "baseline",
    "& button": {
      margin: theme.spacing(1),
    },
    "& span": {
      minWidth: theme.spacing(2),
      textAlign: "center",
    },
  },
  startLeaveButtons: {
    display: "flex",
    justifyContent: "center",
    "& button": {
      margin: theme.spacing(1),
    },
  },
  joinTeamContainer: {
    width: "100%",
  },
  cards: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  badge: {
    width: "17%",
    margin: theme.spacing(1),
    "& span": {},
  },
  card: {
    width: "100%",
    textAlign: "center",
    "& :hover": {
      color: theme.palette.common.black,
    },
    "& :disabled": {
      backgroundColor: "purple",
      color: "unset",
    },
  },
  [types.Team.Team1]: {
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    backgroundColor: theme.palette.primary.main,
  },
  [types.Team.Team2]: {
    border: `1px solid ${theme.palette.secondary.main}`,
    color: theme.palette.getContrastText(theme.palette.secondary.main),
    backgroundColor: theme.palette.secondary.main,
  },
  [types.NPC.Assassin]: {
    color: theme.palette.getContrastText(theme.palette.common.black),
    backgroundColor: theme.palette.common.black,
  },
  [types.NPC.Bystander]: {
    border: `1px solid ${theme.palette.info.main}`,
    color: theme.palette.getContrastText(theme.palette.info.main),
    backgroundColor: theme.palette.info.main,
  },
  flipped: { opacity: 0.5 },
  copy: {
    marginBottom: theme.spacing(1),
  },
  columns: {
    flexDirection: "column",
  },
  others: {
    color: theme.palette.text.secondary,
  },
  centeredSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  joinTeam: {
    display: "flex",
    justifyContent: "center",
  },
  teamGroup: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
    "& button": {
      margin: theme.spacing(1),
    },
  },
  warning: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.getContrastText(theme.palette.warning.main),
  },
  danger: {
    color: theme.palette.error.main,
  },
}));

interface JoinTeamProps {
  player: Player;
  gameData: WithID<GameDataInit>;
}

const JoinTeam: React.FC<JoinTeamProps> = ({ player, gameData }) => {
  const classes = useStyles();
  const teamColors = useTeamTextColor();
  const join = React.useCallback(
    (team: Team, role: Role) => () => {
      joinTeam(db, gameData, player, team, role);
    },
    [player, gameData]
  );

  const start = React.useCallback(() => {
    startGame(db, gameData);
  }, [gameData]);

  const teamGroup = (team: Team) => {
    const color = team === Team.Team1 ? "primary" : "secondary";
    const leaderId =
      team === Team.Team1 ? gameData.team1LeaderId : gameData.team2LeaderId;
    const agentIds =
      team === Team.Team1 ? gameData.team1AgentIds : gameData.team2AgentIds;
    return (
      <section className={classes.teamGroup}>
        <Button
          color={color}
          variant="contained"
          onClick={join(team, Role.Leader)}
        >
          Leader
        </Button>
        <Typography
          variant="body1"
          className={leaderId === player.id ? teamColors[team] : classes.others}
        >
          {leaderId && gameData.nickMap[leaderId]}
        </Typography>
        <Button
          color={color}
          variant="outlined"
          onClick={join(team, Role.Agent)}
        >
          Agents
        </Button>
        {(agentIds || []).map((agentID) => (
          <Typography
            variant="body1"
            key={agentID}
            className={
              agentID === player.id ? teamColors[team] : classes.others
            }
          >
            {gameData.nickMap[agentID]}
          </Typography>
        ))}
      </section>
    );
  };

  if (!gameData.playerIds.includes(player.id)) {
    return null;
  }
  return (
    <section className={classes.joinTeamContainer}>
      <section className={classes.joinTeam}>
        {teamGroup(Team.Team1)}
        {teamGroup(Team.Team2)}
      </section>
      <section className={classes.startLeaveButtons}>
        <Button
          disabled={!gameReady(gameData) || !onTeam(gameData, player)}
          variant="contained"
          color={
            onSpecificTeam(gameData, player, Team.Team1)
              ? "primary"
              : "secondary"
          }
          onClick={start}
        >
          Start Game
        </Button>
      </section>
    </section>
  );
};

interface JoinGameProps {
  player: Player;
  gameData: WithID<GameData>;
}

const JoinGame: React.FC<JoinGameProps> = ({ player, gameData }) => {
  // You shouldn't see this button if you're already in the game.
  const classes = useStyles();
  if (gameData.playerIds.includes(player.id)) {
    return null;
  }

  const { gameState } = gameData;
  // Games are only allowed to be joined if they haven't started already (at least for now.)
  if (
    gameState === types.GameState.Init ||
    gameState === types.GameState.Ready
  ) {
    return (
      <section className={classes.centeredSection}>
        <NickName />
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            joinGame(db, gameData, player);
          }}
        >
          Join Game!
        </Button>
      </section>
    );
  }
  return null;
};

interface BoardProps {
  gameData: WithID<types.GameDataInProgress | types.GameDataGameOver>;
  player: Player;
}

interface PreviousHintsProps {
  gameData: types.GameDataGameOver | types.GameDataInProgress;
}

const PreviousHints: React.FC<PreviousHintsProps> = ({ gameData }) => {
  const classes = useTeamTextColor();
  const previousHints = gameData.previousHints;
  return (
    <section className={classes.previousHints}>
      {previousHints.map((hint) => (
        <span className={classes.previousHint}>
          <span className={classes[hint.team]}>{hint.hint}</span>,{" "}
          {hint.hintNumber === "zero"
            ? "0"
            : hint.hintNumber === "infinity"
            ? "∞"
            : hint.hintNumber}
        </span>
      ))}
    </section>
  );
};

const Board: React.FC<BoardProps> = ({ gameData, player }) => {
  const classes = useStyles();
  const isTeam1Leader = gameData.team1LeaderId === player.id;
  const isTeam2Leader = gameData.team2LeaderId === player.id;
  const isLeader = isTeam1Leader || isTeam2Leader;
  const hintSubmitted = gameData.currentHint?.submitted;
  const adminOverride = useSelector((a: State) => a.override);
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState<types.Card>();
  const canFlip =
    selectedCard !== undefined && (adminOverride || hintSubmitted);
  const flip = React.useCallback(() => {
    if (!canFlip) {
      return;
    }
    // Aww, I was really hoping typescript would be able to suss this one out.
    // This is only necessary beacuse TS doesn't understand that canFlip means
    // that selectedCard is not undefined.
    if (selectedCard === undefined) {
      return;
    }
    if (gameData.gameState === GameState.GameOver) {
      return;
    }
    flipCard(db, gameData, selectedCard);
  }, [selectedCard, gameData, canFlip]);
  return (
    <>
      <div className={classes.cards}>
        {gameData.cards.map((card) => {
          const className = classnames(classes.card, {
            [classes[card.team]]:
              isTeam1Leader ||
              isTeam2Leader ||
              card.flipped ||
              gameData.gameState === GameState.GameOver,
            [classes.flipped]: card.flipped,
          });
          const flipOrder = gameData.flippedCards.findIndex(
            (c) => c.id === card.id
          );
          const flipTeam =
            flipOrder !== -1 &&
            gameData.flippedCards[flipOrder].teamThatFlipped;
          const color = flipTeam === Team.Team1 ? "primary" : "secondary";
          return (
            <Badge
              key={card.id}
              className={classes.badge}
              badgeContent={flipOrder === -1 ? null : flipOrder + 1}
              color={color}
            >
              <Button
                className={className}
                variant="outlined"
                onClick={() => {
                  // If the hint isn't submitted, we shouldn't let the other team guess.
                  if (!hintSubmitted && !adminOverride) {
                    return;
                  }
                  // Leaders can't flip cards. That'd be op.
                  if (isLeader && !adminOverride) {
                    return;
                  }
                  if (popupVisible) {
                    return;
                  }
                  setPopupVisible(true);
                  setSelectedCard(card);
                }}
              >
                {card.value}
              </Button>
            </Badge>
          );
        })}
      </div>
      <Dialog
        open={selectedCard !== undefined && popupVisible}
        onClose={() => {
          setPopupVisible(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Selection?</DialogTitle>
        <DialogActions>
          <Button
            className={classes[gameData.currentTeam]}
            onClick={() => {
              setSelectedCard(undefined);
              setPopupVisible(false);
              flip();
            }}
          >
            {selectedCard && selectedCard.value}
          </Button>
          <Button
            onClick={() => {
              setSelectedCard(undefined);
              setPopupVisible(false);
            }}
          >
            Nevermind
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const YourTeam: React.FC<BoardProps> = ({ gameData, player }) => {
  const classes = useTeamTextColor();

  if (gameData.gameState !== GameState.InProgress) {
    return null;
  }

  const redTeam = onSpecificTeam(gameData, player, Team.Team1);

  return (
    <>
      <div>
        You are on the{" "}
        <span className={classes[redTeam ? Team.Team1 : Team.Team2]}>
          {redTeam ? "Red" : "Blue"}
        </span>{" "}
        team
      </div>
    </>
  );
};

const TimerSeconds = 90;

export const Timer: React.FC<{
  gameData: WithID<GameDataInProgress>;
  player: Player;
}> = ({ gameData, player }) => {
  const classes = useStyles();
  const canStart = !isLeader(gameData, player);
  const [danger, setDanger] = React.useState(false);
  const [secondsRemaining, setSecondsRemaining] = React.useState<
    number | undefined
  >(undefined);
  React.useEffect(() => {
    if (gameData.timerStartTime === undefined) {
      return;
    }
    setSecondsRemaining(TimerSeconds);
    const interval = window.setInterval(() => {
      const now = new Date().getTime();
      const elapsedTime = now - gameData.timerStartTime!;
      setSecondsRemaining((old) => {
        const nu = Math.max(TimerSeconds - Math.round(elapsedTime / 1000), 0);
        if (old === 0) {
          return old;
        }
        return nu;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameData.timerStartTime]);

  React.useEffect(() => {
    if (gameData.timerStartTime === undefined) {
      setDanger(false);
      setSecondsRemaining(undefined);
    }
  }, [gameData.timerStartTime]);

  React.useEffect(() => {
    if (secondsRemaining === undefined) {
      return;
    }
    if (secondsRemaining < 10) {
      setDanger(true);
    }
    if (secondsRemaining <= 0) {
      passTurn(db, gameData).then(() => setSecondsRemaining(undefined));
    }
  }, [secondsRemaining]);

  const start = React.useCallback(() => {
    console.log(gameData);
    if (gameData.timerStartTime !== undefined) {
      return;
    }
    const now = new Date().getTime();
    startTimer(db, gameData, now);
  }, [gameData]);

  return (
    <div className={classes.timer}>
      {secondsRemaining !== undefined && secondsRemaining > 0 ? (
        <Typography
          className={classnames(
            { [classes.danger]: danger },
            classes.timerTime
          )}
        >
          {secondsRemaining}
        </Typography>
      ) : (
        <Typography>Timer Stopped</Typography>
      )}
      <Button
        className={classes.timerButton}
        disabled={gameData.timerStartTime !== undefined && canStart}
        color={gameData.currentTeam === Team.Team1 ? "primary" : "secondary"}
        onClick={start}
        variant="contained"
      >
        Start
      </Button>
    </div>
  );
};

interface GameParams {
  gameUid: string;
}

interface GameProps {
  player: Player;
}

const Game: React.FC<GameProps> = ({ player }) => {
  const history = useHistory();
  const classes = useStyles();
  const { gameUid } = useParams<GameParams>();
  const [gameData, setGameData] = React.useState<WithID<GameData>>();

  React.useEffect(() => {
    gtag("event", "page_view", {
      page_path: document.location.pathname.replace(gameUid, "{GAME_ID}"),
    });
  }, [gameUid]);

  React.useEffect(() => {
    if (gameData === undefined) {
      return;
    }
    if (gameData.gameState === types.GameState.GameOver) {
      gtag("event", "game_over", { gameId: gameData.id });
    }
  }, [gameData]);

  React.useEffect(() => {
    return subcribeToGameChanges(db, gameUid, (d) => {
      if (d === undefined) {
        // TODO - instead of just redirecting home, this should let the user
        // know the game doesn't exist.
        history.push("/");
      }
      setGameData(d);
    });
  }, [gameUid, history]);

  const reset = React.useCallback(() => {
    if (gameData === undefined) {
      return;
    }
    if (gameData.gameState !== GameState.GameOver) {
      return;
    }
    resetGame(db, gameData);
  }, [gameData]);

  if (gameData === undefined) {
    return null;
  }

  if (gameData.gameState === types.GameState.Init) {
    return (
      <>
        <CopyGameToClipboard />
        <JoinGame gameData={gameData} player={player} />
        <JoinTeam gameData={gameData} player={player} />
      </>
    );
  }

  if (gameData.gameState === types.GameState.Ready) {
    return <div>Loading...</div>;
  }

  if (gameData.gameState === types.GameState.InProgress) {
    return (
      <>
        <LeaderView gameData={gameData} player={player} />
        <PlayerView gameData={gameData} player={player} />
        <Override />
        <Board gameData={gameData} player={player} />
        <div className={classes.bottomRow}>
          <YourTeam gameData={gameData} player={player} />
          <Timer gameData={gameData} player={player} />
        </div>
        <PreviousHints gameData={gameData} />
      </>
    );
  }

  // TODO add in a helper function to turn a team enum value into user text.
  if (gameData.gameState === types.GameState.GameOver) {
    const winnerIds =
      gameData.winner === Team.Team1
        ? [gameData.team1LeaderId, ...gameData.team1AgentIds]
        : [gameData.team2LeaderId, ...gameData.team2AgentIds];
    const winners = winnerIds.map((id) => gameData.nickMap[id]);
    return (
      <>
        <Typography variant="h2">Game Over!</Typography>
        <Typography variant="h5">
          <JoinNicks nicks={winners} team={gameData.winner} /> won!
        </Typography>
        <Button
          color="primary"
          variant="contained"
          onClick={reset}
          style={{ marginBottom: "8px" }}
        >
          New Game With Same Players
        </Button>
        <Link to={"/"}>Back To Lobby</Link>
        <Board gameData={gameData as any} player={player} />
      </>
    );
  }
  return null;
};

export default Game;
