import React from "react";
import TextField from "@material-ui/core/TextField";
import { useLocalStorage } from "react-use";
import * as types from "./types";

interface NickNameProps {
  onChange?: (nick: string) => void;
}
export const NickName: React.FC<NickNameProps> = ({ onChange }) => {
  const [nick, setNick] = useLocalStorage<string | undefined>(
    types.StorageKey.Nick,
    undefined,
    { raw: true }
  );
  React.useEffect(() => {
    if (onChange !== undefined && nick !== undefined) {
      onChange(nick);
    }
  }, [nick, onChange]);

  return (
    <TextField
      value={nick}
      onChange={(e) => setNick(e.target.value)}
      label="Nickname"
    />
  );
};
