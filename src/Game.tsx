import React from "react";
import { useSelector } from "react-redux";
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
  unJoinTeam,
  onTeam,
  gameReady,
  startGame,
  flipCard,
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
} from "./types";
import { makeStyles } from "@material-ui/core/styles";
import classnames from "classnames";
import CopyGameToClipboard from "./game/CopyGameToClipboard";
import LeaderView from "./game/LeaderView";
import PlayerView from "./game/PlayerView";
import { Override } from "./common";

export const useTeamTextColor = makeStyles((theme) => ({
  playerViewContainer: {
    margin: theme.spacing(1, 10),
    display: "flex",
    width: "80vw",
    justifyContent: "space-around",
    alignItems: "baseline",
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
  card: {
    padding: theme.spacing(1),
    width: "15%",
    margin: theme.spacing(1),
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

  const unJoin = React.useCallback(() => {
    unJoinTeam(db, gameData, player);
  }, [player, gameData]);

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
          disabled={
            onTeam(gameData, player) ||
            (team === Team.Team1
              ? gameData.team1LeaderId
              : gameData.team2LeaderId) !== undefined
          }
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
          disabled={onTeam(gameData, player)}
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
          color="default"
          onClick={start}
        >
          Start Game
        </Button>
        <Button
          disabled={!onTeam(gameData, player)}
          variant="contained"
          color="default"
          onClick={unJoin}
        >
          Leave Role
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
          return (
            <Button
              className={className}
              variant="outlined"
              key={card.id}
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

interface GameParams {
  gameUid: string;
}

interface GameProps {
  player: Player;
}

const Game: React.FC<GameProps> = ({ player }) => {
  const classes = useTeamTextColor();
  const history = useHistory();
  const { gameUid } = useParams<GameParams>();
  const [gameData, setGameData] = React.useState<WithID<GameData>>();
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

  // TODO - default to spectator view;

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
      </>
    );
  }

  // TODO add in a helper function to turn a team enum value into user text.
  if (gameData.gameState === types.GameState.GameOver) {
    return (
      <>
        <Typography variant="h2">Game Over!</Typography>
        <Typography variant="h5">
          <span className={classes[gameData.winner]}>{gameData.winner}</span>{" "}
          won .
        </Typography>
        <Link to={"/"}>Back To Lobby</Link>
        Hi Andrew
        <Typography variant="body1">
          TODO - Add in a way to start a new game with everybody from here. It
          should default to people being on the same team.
        </Typography>
        <Board gameData={gameData as any} player={player} />
      </>
    );
  }

  return (
    <>
      <div>Game: {gameUid}</div>
      <JoinGame gameData={gameData} player={player} />
      <br />
      {gameData && JSON.stringify(gameData)}
    </>
  );
};

export default Game;
