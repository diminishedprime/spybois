import React from "react";
import TextField from "@material-ui/core/TextField";
import { Dispatch } from "redux";
import { State, Actions, ActionType } from "./types";
import { useSelector, useDispatch } from "react-redux";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { useTeamTextColor } from "./Game";
import { Team } from "./types";

interface NickNameProps {
  onChange?: (nick: string) => void;
}
export const NickName: React.FC<NickNameProps> = ({ onChange }) => {
  const nick = useSelector((a: State) => a.nick);
  const dispatch: Dispatch<Actions> = useDispatch();

  React.useEffect(() => {
    if (onChange !== undefined && nick !== undefined) {
      onChange(nick);
    }
  }, [nick, onChange]);

  const setNick = React.useCallback(
    (v: string) => {
      // This doesn't type check for some fucking reason I can't be bothered to
      // figure out.
      dispatch({ type: ActionType.SetNick, nick: v });
    },
    [dispatch]
  );

  return (
    <TextField
      value={nick}
      onChange={(e) => setNick(e.target.value)}
      label="Nickname"
    />
  );
};

export const Override: React.FC = () => {
  const override = useSelector((a: State) => a.override);
  const dispatch: Dispatch<Actions> = useDispatch();
  const setOverride = React.useCallback(
    (checked: boolean) => {
      dispatch({ type: ActionType.SetOverride, override: checked });
    },
    [dispatch]
  );
  // Remove this if you want to set admin override.
  return <></>;
  return (
    <FormControlLabel
      control={
        <Checkbox
          value={override}
          onChange={(e) => setOverride(e.target.checked)}
        />
      }
      label="Admin Override"
    />
  );
};

export const JoinNicks: React.FC<{ nicks: string[]; team: Team }> = ({
  nicks,
  team,
}) => {
  const classes = useTeamTextColor();
  return (
    <>
      {nicks.reduce(
        (components: any[], nick: string, idx: number, array: any[]) => {
          return components.concat([
            array.length === 1
              ? ""
              : idx < array.length - 1
              ? idx === 0
                ? ""
                : ", "
              : " and ",
            <span key={nick} className={classes[team]}>
              {nick}
            </span>,
          ]);
        },
        []
      )}
    </>
  );
};
