import React from "react";
import { useParams } from "react-router-dom";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { NickName } from "./common";
import { subcribeToGameChanges, joinGame } from "./db";
import { db } from "./index";
import * as enums from "./enums";

interface JoinGameProps {
  player: Player;
  gameData: WithID<GameData>;
}

const JoinGame: React.FC<JoinGameProps> = ({ player, gameData }) => {
  // You shouldn't see this button if you're already in the game.
  if (gameData.playerIds.includes(player.id)) {
    return null;
  }

  const { gameState } = gameData;
  // Games are only allowed to be joined if they haven't started already (at least for now.)
  if (
    gameState === enums.GameState.Init ||
    gameState === enums.GameState.Ready
  ) {
    return (
      <>
        <NickName />
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            joinGame(db, gameData.id, player);
          }}
        >
          Join Game!
        </Button>
      </>
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
        // handle case where game is not found.
      }
      setGameData(d);
    });
  }, [gameUid]);

  // TODO default to spectator view;

  if (gameData === undefined) {
    return null;
  }

  return (
    <>
      <div>Game: {gameUid}</div>
      <JoinGame gameData={{ ...gameData, id: gameUid }} player={player} />
      <CopyToClipboard
        text={document.location.href}
        onCopy={(_: string, result: boolean) => {
          if (result === true) {
            setCopied(true);
          }
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FileCopyIcon />}
          >
            Copy link to game
          </Button>
          {copied && <Typography>Copied!</Typography>}
        </div>
      </CopyToClipboard>
      <br />
      {gameData && JSON.stringify(gameData)}
    </>
  );
};

export default Game;
