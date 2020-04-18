import React from "react";
import TextField from "@material-ui/core/TextField";
import { Dispatch } from "redux";
import { State, Actions, ActionType } from "./types";
import { useSelector, useDispatch } from "react-redux";

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
