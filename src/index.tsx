import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import * as firebase from "firebase/app";
import "firebase/auth";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory
} from "react-router-dom";
import Button from "@material-ui/core/Button";

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

const Lobby = () => {
  return <div>Lobby</div>;
};

const Game = () => {
  return <div>Game</div>;
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
  return <Button onClick={signIn}>Login With Google</Button>;
};

const SignOut = () => {
  const signOut = React.useCallback(() => {
    auth.signOut();
  }, []);
  return <Button onClick={signOut}>Sign Out</Button>;
};

const App = () => {
  const history = useHistory();
  const [user, setUser] = React.useState<firebase.User>();

  React.useEffect(() => {
    auth.onAuthStateChanged(user => {
      if (!user) {
        history.push("/login");
      } else {
        setUser(user);
        history.push("/");
      }
    });
  }, []);

  return (
    <div>
      {user !== undefined && <SignOut />}
      <Switch>
        <Route exact path={["/lobby", "/"]}>
          <Lobby />
        </Route>
        <Route path="/game">
          <Game />
        </Route>
        <Route path="/login">
          <SignIn />
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
