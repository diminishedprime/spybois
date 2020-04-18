import { createStore, combineReducers } from "redux";
import { StorageKey, State, Actions, ActionType } from "./types";

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

const nick = (
  nick = fromLocalStorage<string>(StorageKey.Nick, (a) => a) || "",
  action: Actions
) => {
  switch (action.type) {
    case ActionType.SetNick:
      return action.nick;
    default:
      return nick;
  }
};

const app = combineReducers<State, Actions>({ nick });

export const store = createStore(app);

store.subscribe(() => {
  const state = store.getState();
  console.log("State changed", state);
});

export type Dispatch = typeof store.dispatch;
