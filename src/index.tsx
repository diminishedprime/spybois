import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  Link,
} from "react-router-dom";
import Game from "./Game";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { useLocalStorage } from "react-use";
import {
  gamesCollection,
  newGameWithSelf,
  subscribeToGamesWithPlayer,
} from "./db";
import { NickName } from "./common";
import * as enums from "./enums";

const firebaseConfig = {
  apiKey: "AIzaSyAsz9rfRC01eFIfo_FvZ2x3-2DHf_2Ulws",
  authDomain: "spy-bois.firebaseapp.com",
  databaseURL: "https://spy-bois.firebaseio.com",
  projectId: "spy-bois",
  storageBucket: "spy-bois.appspot.com",
  messagingSenderId: "154079183942",
  appId: "1:154079183942:web:36910aa3b42e5406e0b647",
  measurementId: "G-V2NY7J0W6T",
};

// TODO - All of these things should probably be put into a redux store.
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
// TODO - this probably shouldn't actually be a global, but I'm being lazy for now.
export const db = firebase.firestore();

const useStylesCreateGame = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(1, 0, 1),
  },
}));

const CreateGame: React.FC<{ uid: string }> = ({ uid }) => {
  const history = useHistory();
  const [nick, setNick] = React.useState("");
  const newGame = React.useCallback(() => {
    gamesCollection(db)
      .add(newGameWithSelf(uid, nick))
      .then((nuGame) => {
        history.push(`/games/${nuGame.id}`);
      });
  }, [uid, nick]);
  const classes = useStylesCreateGame();
  return (
    <>
      <NickName onChange={setNick} />
      <Button
        className={classes.root}
        color="primary"
        variant="contained"
        onClick={newGame}
      >
        New Game
      </Button>
    </>
  );
};

const Lobby: React.FC<{ uid: string }> = ({ uid }) => {
  const classes = useStyles();
  const [games, setGames] = React.useState<WithID<GameData>[]>([]);
  const history = useHistory();
  React.useEffect(() => {
    return subscribeToGamesWithPlayer(db, uid, setGames);
  }, []);

  return (
    <>
      <Typography variant="h3">Lobby</Typography>
      <section className={classes.gameCards}>
        {games.map((game) => {
          const nicks = game.players.map((p) => p.nick).filter((p) => p);
          return (
            <Card key={game.id} className={classes.gameCard}>
              <Typography variant="body1">
                {nicks.length > 0 && (
                  <>
                    Join game with{" "}
                    {nicks.map((nick) => (
                      <span className={classes.nick} key={nick}>
                        {nick}
                      </span>
                    ))}
                  </>
                )}
              </Typography>
              <Button
                color="primary"
                variant="contained"
                onClick={() => {
                  history.push(`/games/${game.id}`);
                }}
              >
                Rejoin Game
              </Button>
            </Card>
          );
        })}
      </section>
      <CreateGame uid={uid} />
    </>
  );
};

const SignIn = () => {
  const signIn = React.useCallback(() => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth
      .signInWithPopup(provider)
      .then(() => {
        // redirect to home page after login
      })
      .catch((e) => {
        // TODO - handle login error.
      });
  }, []);
  return (
    <Button color={"primary"} variant="contained" onClick={signIn}>
      Login With Google
    </Button>
  );
};

const SignOut = () => {
  const signOut = React.useCallback(() => {
    auth.signOut();
  }, []);
  return (
    <Button color="secondary" variant="outlined" onClick={signOut}>
      Sign Out
    </Button>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    margin: "0 auto",
    padding: theme.spacing(1),
    maxWidth: theme.breakpoints.width("md"),
  },
  gameCards: {
    display: "flex",
  },
  gameCard: {
    margin: theme.spacing(1),
    padding: theme.spacing(1),
    flexGrow: 1,
  },
  nick: { color: theme.palette.secondary.main },

  pageContent: {},
}));

let navigateBackTo: null | string = null;

const App = () => {
  const history = useHistory();
  const [user, setUser] = React.useState<firebase.User>();
  // TODO - this should really come from redux.
  const [nick] = useLocalStorage<string | undefined>(
    enums.StorageKey.Nick,
    undefined,
    { raw: true }
  );
  const classes = useStyles();

  React.useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      if (user === null) {
        setUser(undefined);
        navigateBackTo = document.location.pathname;
        history.push("/login");
      } else {
        setUser(user);
        // This is hacky, but I don't feel like doing proper state handling yet.
        if (navigateBackTo !== null) {
          const to = navigateBackTo;
          navigateBackTo = null;
          history.push(to);
        }
      }
    });
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.pageContent}>
        <Switch>
          <Route exact path={["/lobby", "/"]}>
            {user && <Lobby uid={user.uid} />}
          </Route>
          <Route exact path="/games/:gameUid">
            {user && <Game player={{ id: user.uid, nick }} />}
          </Route>
          <Route exact path="/login">
            <SignIn />
          </Route>
          <Route default>
            <div>Page not found</div>
            <Link to="/">Home</Link>
          </Route>
        </Switch>
      </div>

      {user !== undefined && <SignOut />}
      <Link to="/">Home</Link>
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
