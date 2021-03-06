import { createStore, combineReducers } from "redux";
import { StorageKey, State, Actions, ActionType } from "./types";

const toLocalStorage = async <T>(
  key: StorageKey,
  value: T,
  serializer: (t: T) => string
) => {
  const serialized = serializer(value);
  window.localStorage.setItem(key, serialized);
  return;
};

const fromLocalStorage = <T>(
  key: StorageKey,
  deserializer: (s: string) => T
): T | undefined => {
  const item = window.localStorage.getItem(key);
  if (item === null) {
    return undefined;
  }
  return deserializer(item);
};

const override = (override = false, action: Actions) => {
  switch (action.type) {
    case ActionType.SetOverride:
      return action.override;
    default:
      return override;
  }
};

const nick = (
  nick = fromLocalStorage<string>(StorageKey.Nick, (a) => a) || "",
  action: Actions
) => {
  switch (action.type) {
    case ActionType.SetNick:
      toLocalStorage<string>(StorageKey.Nick, action.nick, (a) => a);
      return action.nick;
    default:
      return nick;
  }
};

const app = combineReducers<State, Actions>({ nick, override });

export const store = createStore(app);

// store.subscribe(() => {
//   const state = store.getState();
//   console.log("State changed", state);
// });

export type Dispatch = typeof store.dispatch;
