import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  useParams,
  Link
} from "react-router-dom";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { makeStyles } from "@material-ui/core/styles";
import { CopyToClipboard } from "react-copy-to-clipboard";

const firebaseConfig = {
  apiKey: "AIzaSyAsz9rfRC01eFIfo_FvZ2x3-2DHf_2Ulws",
  authDomain: "spy-bois.firebaseapp.com",
  databaseURL: "https://spy-bois.firebaseio.com",
  projectId: "spy-bois",
  storageBucket: "spy-bois.appspot.com",
  messagingSenderId: "154079183942",
  appId: "1:154079183942:web:36910aa3b42e5406e0b647",
  measurementId: "G-V2NY7J0W6T"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const useStylesCreateGame = makeStyles(theme => ({
  root: {
    margin: theme.spacing(1, 0, 1)
  }
}));

interface GameData {
  // uids of everyone in the game.
  players: string[];
  team1Spy?: string;
  team2Spy?: string;
}

const newGameWithSelf = (uid: string): GameData => {
  return { players: [uid] };
};

const gamesCollection = (db: firebase.firestore.Firestore) => {
  return db.collection("games");
};

const gameDoc = (db: firebase.firestore.Firestore, gameUid: string) => {
  return gamesCollection(db).doc(gameUid);
};

const subcribeToGameChanges = (
  db: firebase.firestore.Firestore,
  gameUid: string,
  cb: (gameData: GameData | undefined) => void
): (() => void) => {
  const unSub = gameDoc(db, gameUid).onSnapshot(game => {
    const data = game.data();
    cb(data as GameData);
  });
  return unSub;
};

const CreateGame: React.FC<{ uid: string }> = ({ uid }) => {
  const history = useHistory();
  const newGame = React.useCallback(() => {
    gamesCollection(db)
      .add(newGameWithSelf(uid))
      .then(nuGame => {
        history.push(`/games/${nuGame.id}`);
      });
  }, []);
  const classes = useStylesCreateGame();
  return (
    <Button
      className={classes.root}
      color="primary"
      variant="contained"
      onClick={newGame}
    >
      New Game
    </Button>
  );
};

const Lobby: React.FC<{ uid: string }> = ({ uid }) => {
  return (
    <>
      <Typography variant="h3">Lobby</Typography>
      <CreateGame uid={uid} />
    </>
  );
};

interface GameParams {
  gameUid: string;
}

const Game = () => {
  const { gameUid } = useParams<GameParams>();
  const [gameData, setGameData] = React.useState<GameData>();
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
    return subcribeToGameChanges(db, gameUid, d => {
      if (d === undefined) {
        // handle case where game is not found.
      }
      setGameData(d);
    });
  }, [gameUid]);

  // TODO default to spectator view;

  return (
    <>
      <div>Game: {gameUid}</div>
      <CopyToClipboard
        text={document.location.href}
        onCopy={(text: string, result: boolean) => {
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

const SignIn = () => {
  const signIn = React.useCallback(() => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth
      .signInWithPopup(provider)
      .then(() => {
        // redirect to home page after login
      })
      .catch(e => {
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

const useStyles = makeStyles(theme => ({
  root: {
    margin: "0 auto",
    padding: theme.spacing(1),
    maxWidth: theme.breakpoints.width("md")
  },
  pageContent: {}
}));

let navigateBackTo: null | string = null;

const App = () => {
  const history = useHistory();
  const [user, setUser] = React.useState<firebase.User>();
  const classes = useStyles();

  React.useEffect(() => {
    return auth.onAuthStateChanged(user => {
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
            {user && <Game />}
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
