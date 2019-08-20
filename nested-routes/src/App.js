import React from "react";
import { NavLink, Switch, Route, BrowserRouter } from "react-router-dom";

function Fallback(props) {
  return (
    <div>
      <Nav />
      <p>FALLBACK</p>
      <ShowMatch {...props} />
    </div>
  );
}

function Nav(props) {
  return (
    <ul>
      {["/", "/map/a", "/map/b/1", "/map/b/2"].map(url => (
        <li key={url}>
          <NavLink
            exact
            className="NavLink-Inactive"
            activeClassName="NavLink-Active"
            to={url}
          >
            Go to {url}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function ShowMatch(props) {
  return <pre>{JSON.stringify(props.match, null, 2)}</pre>;
}

function MapEditorMode(props) {
  const date = React.useMemo(() => new Date().toLocaleString(), []);
  return (
    <div>
      <Nav />
      <p>MapEditorMode(date="{date}")</p>
      <Switch>
        <Route
          path="/map/a"
          render={props => (
            <div>
              <p>It's /map/a</p>
              <ShowMatch {...props} />
            </div>
          )}
        />
        <Route
          path="/map/b/:id"
          render={props => (
            <div>
              <p>It's /map/b/:id</p>
              <ShowMatch {...props} />
            </div>
          )}
        />
        <Route render={props => <p>It's /map/???</p>} />
      </Switch>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/map/*" component={MapEditorMode} />
        <Route component={Fallback} />
      </Switch>
    </BrowserRouter>
  );
}
