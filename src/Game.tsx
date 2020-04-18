import React from "react";
import { useParams, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
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
import { Player, WithID, GameData, GameDataInit, Team, Role } from "./types";
import { makeStyles } from "@material-ui/core/styles";
import classnames from "classnames";
import CopyGameToClipboard from "./game/CopyGameToClipboard";

export const useStyles = makeStyles((theme) => ({
  cards: {
    display: "flex",
    flexWrap: "wrap",
  },
  card: {
    padding: theme.spacing(1),
    width: "15%",
    margin: theme.spacing(1),
    textAlign: "center",
  },
  [types.Team.Team1]: {
    color: theme.palette.getContrastText(theme.palette.primary.main),
    backgroundColor: theme.palette.primary.main,
  },
  [types.Team.Team2]: {
    color: theme.palette.getContrastText(theme.palette.secondary.main),
    backgroundColor: theme.palette.secondary.main,
  },
  [types.NPC.Assassin]: {
    color: theme.palette.getContrastText(theme.palette.common.black),
    backgroundColor: theme.palette.common.black,
  },
  [types.NPC.Bystander]: {
    color: theme.palette.getContrastText(theme.palette.info.main),
    backgroundColor: theme.palette.info.main,
  },
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
          disabled={!onTeam(gameData, player)}
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
    return <Board gameData={gameData} player={player} />;
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

interface BoardProps {
  gameData: WithID<types.GameDataInProgress>;
  player: Player;
}

const Board: React.FC<BoardProps> = ({ gameData, player }) => {
  const classes = useStyles();
  const isTeam1Leader = gameData.team1LeaderId === player.id;
  const isTeam2Leader = gameData.team2LeaderId === player.id;
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState<types.Card>();
  const flip = React.useCallback(() => {
    if (selectedCard === undefined) {
      return;
    }
    flipCard(db, gameData, selectedCard);
  }, [selectedCard, gameData]);
  return (
    <>
      {popupVisible && selectedCard && (
        <>
          <Button
            onClick={() => {
              setSelectedCard(undefined);
              setPopupVisible(false);
              flip();
            }}
          >
            {selectedCard.value}
          </Button>
          <Button
            onClick={() => {
              setSelectedCard(undefined);
              setPopupVisible(false);
            }}
          >
            Nevermind
          </Button>
        </>
      )}
      <div className={classes.cards}>
        {gameData.cards.map((card) => {
          const className = classnames(classes.card, {
            [classes[card.team]]:
              isTeam1Leader || isTeam2Leader || card.flipped,
          });
          return (
            <Card
              className={className}
              key={card.id}
              onClick={() => {
                if (popupVisible) {
                  return;
                }
                setPopupVisible(true);
                setSelectedCard(card);
              }}
            >
              {card.value}
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default Game;
