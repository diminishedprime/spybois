import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

const Lobby = () => {
  return <div>Lobby</div>;
};

const Game = () => {
  return <div>Game</div>;
};

const App = () => {
  // TODO add firebase login.
  console.log("hi???");
  return (
    <div>
      <Switch>
        <Route exact path={["/lobby", "/"]}>
          <Lobby />
        </Route>
        <Route path="/game">
          <Game />
        </Route>
      </Switch>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
