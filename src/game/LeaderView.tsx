import * as React from "react";
import {
  GameDataInProgress,
  Player,
  State,
  Team,
  WithID,
  HintData,
  HintNumber,
} from "../types";
import { JoinNicks } from "../common";
import { isLeader, submitHint } from "../db";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { db } from "../index";
import { useStyles, useTeamTextColor } from "../Game";
import { useSelector } from "react-redux";

interface Props {
  player: Player;
  gameData: WithID<GameDataInProgress>;
}

const defaultHint = (team: Team): HintData => ({
  hint: "",
  hintNumber: 1,
  remainingGuesses: 1,
  submitted: false,
  team: team,
});

const LeaderView: React.FC<Props> = ({ gameData, player }) => {
  const classes = useStyles();
  const override = useSelector((s: State) => s.override);
  const currentTeamNicks = (gameData.currentTeam === Team.Team1
    ? gameData.team1AgentIds
    : gameData.team2AgentIds
  ).map((id) => gameData.nickMap[id]);
  const leader = isLeader(gameData, player);
  const [localHint, setLocalHint] = React.useState<HintData>(() => {
    if (gameData.currentHint !== undefined) {
      return gameData.currentHint;
    } else {
      return defaultHint(gameData.currentTeam);
    }
  });

  // When the game's current hint changes, we want to keep this up to date.
  React.useEffect(() => {
    // Re-default the local hint if the game's current hint is undefined. The
    // game's current hint being undefined means somebody just goofed a guess.
    if (gameData.currentHint === undefined) {
      setLocalHint(defaultHint(gameData.currentTeam));
    }
  }, [gameData.currentHint, gameData.currentTeam]);
  const submit = React.useCallback(() => {
    if (localHint.hint === "") {
      return;
    }
    const nuLocal = { ...localHint, submitted: true };
    submitHint(db, gameData, { ...localHint, submitted: true }).then(() =>
      setLocalHint(nuLocal)
    );
  }, [localHint, gameData]);

  React.useEffect(() => {
    if (localHint.remainingGuesses !== localHint.hintNumber) {
      setLocalHint({ ...localHint, remainingGuesses: localHint.hintNumber });
    }
  }, [localHint]);

  React.useEffect(() => {
    // Keep the local hint's team in sync with the game's current team.
    if (
      localHint !== undefined &&
      localHint.team === undefined &&
      localHint.team !== gameData.currentTeam
    ) {
      setLocalHint((current) => ({ ...current, team: gameData.currentTeam }));
    }
  }, [localHint.team, gameData.currentTeam, localHint]);

  const bumpNum = React.useCallback(
    (direction: "up" | "down") => () => {
      setLocalHint((currentHint) => {
        const currentNumber = currentHint.hintNumber;
        if (currentNumber === "zero" && direction === "down") {
          return currentHint;
        }
        if (currentNumber === "infinity" && direction === "up") {
          return currentHint;
        }

        let nuNumber: HintNumber;
        if (currentNumber === "infinity" && direction === "down") {
          // TODO - Playtest to figure out if this number is big enough???
          nuNumber = 9;
        } else if (currentNumber === "zero" && direction === "up") {
          nuNumber = 1;
        } else {
          const bump = direction === "down" ? -1 : 1;
          if (typeof currentNumber !== "number") {
            // This path shouldn't be reachable.
            return currentHint;
          }
          nuNumber = currentNumber + bump;
        }
        if (nuNumber === 0) {
          nuNumber = "zero";
        }
        if (nuNumber === 10) {
          nuNumber = "infinity";
        }
        return { ...currentHint, hintNumber: nuNumber };
      });
    },
    []
  );

  if (!leader && !override) {
    return null;
  }

  if (gameData.currentHint !== undefined) {
    return null;
  }

  return (
    <section className={classes.leaderViewContainer}>
      <TextField
        value={localHint?.hint || ""}
        disabled={localHint.submitted}
        label="Enter hint"
        onChange={(e) => setLocalHint({ ...localHint, hint: e.target.value })}
      />
      <Button
        disabled={localHint.hintNumber === "zero" || localHint.submitted}
        variant="outlined"
        color={gameData.currentTeam === Team.Team1 ? "primary" : "secondary"}
        onClick={bumpNum("down")}
      >
        -
      </Button>
      <span>
        {localHint.hintNumber === "infinity"
          ? "∞"
          : localHint.hintNumber === "zero"
          ? 0
          : localHint.hintNumber}
      </span>
      <Button
        color={gameData.currentTeam === Team.Team1 ? "primary" : "secondary"}
        variant="outlined"
        disabled={localHint.hintNumber === "infinity" || localHint.submitted}
        onClick={bumpNum("up")}
      >
        +
      </Button>
      <Button
        disabled={localHint.submitted || localHint.hint === ""}
        color={gameData.currentTeam === Team.Team1 ? "primary" : "secondary"}
        variant="contained"
        onClick={submit}
      >
        Submit Hint
      </Button>
    </section>
  );
};

export default LeaderView;
