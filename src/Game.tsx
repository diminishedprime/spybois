import React from "react";
import { useParams, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { NickName } from "./common";
import {
  subcribeToGameChanges,
  joinGame,
  joinTeam,
  unJoinTeam,
  onTeam,
  gameReady,
  startGame,
} from "./db";
import { db } from "./index";
import * as types from "./types";
import { Player, WithID, GameData, GameDataInit, Team, Role } from "./types";
import { makeStyles } from "@material-ui/core/styles";
import classnames from "classnames";

const useStyles = makeStyles((theme) => ({
  copy: {
    marginBottom: theme.spacing(1),
  },
  columns: {
    flexDirection: "column",
  },
  selected: {
    color: theme.palette.primary.main,
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
          className={leaderId === player.id ? classes.selected : classes.others}
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
              agentID === player.id ? classes.selected : classes.others
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
    <>
      <section className={classes.joinTeam}>
        {teamGroup(Team.Team1)}
        {teamGroup(Team.Team2)}
      </section>
      <section className={classes.teamGroup}>
        <Button
          disabled={!gameReady(gameData) || !onTeam(gameData, player)}
          variant="contained"
          color="default"
          onClick={start}
        >
          Start Game
        </Button>
      </section>
      <section className={classes.teamGroup}>
        <Button
          disabled={!onTeam}
          variant="contained"
          color="default"
          onClick={unJoin}
        >
          Leave Role
        </Button>
      </section>
    </>
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
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (copied) {
      const id = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
      return () => {
        window.clearTimeout(id);
      };
    }
  }, [copied]);
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
        <section className={classnames(classes.centeredSection, classes.copy)}>
          <CopyToClipboard
            text={document.location.href}
            onCopy={(_: string, result: boolean) => {
              if (result === true) {
                setCopied(true);
              }
            }}
          >
            <section
              className={classnames(classes.centeredSection, classes.columns)}
            >
              <Button
                variant="contained"
                color="secondary"
                startIcon={<FileCopyIcon />}
              >
                Copy link to game
              </Button>
              {copied && <Typography>Copied!</Typography>}
            </section>
          </CopyToClipboard>
        </section>
        <JoinGame gameData={gameData} player={player} />
        <JoinTeam gameData={gameData} player={player} />
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
