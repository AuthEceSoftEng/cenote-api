import { createStore, compose, applyMiddleware } from "redux";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";
import thunk from "redux-thunk";
import { createBrowserHistory } from "history";
import { routerMiddleware } from "connected-react-router";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import * as storage from "localforage";

import rootReducer from "../reducers";

export const history = createBrowserHistory();

const transform = createTransform(
  undefined,
  (state) => {
    if (document.cookie === "cenote=yo") return state;
    return undefined;
  },
  { key: ["root"] },
);

const persistedReducer = persistReducer({ key: "root", storage, transforms: [transform] }, rootReducer(history));

function configureStoreProd(initialState) {
  const reactRouterMiddleware = routerMiddleware(history);
  const middlewares = [
    thunk,
    reactRouterMiddleware,
  ];

  const store = createStore(
    persistedReducer,
    initialState,
    compose(applyMiddleware(...middlewares)),
  );
  const persistor = persistStore(store);
  return { store, persistor };
}

function configureStoreDev(initialState) {
  const reactRouterMiddleware = routerMiddleware(history);
  const middlewares = [
    reduxImmutableStateInvariant(),
    thunk,
    reactRouterMiddleware,
  ];

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(
    persistedReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middlewares)),
  );

  if (module.hot) {
    module.hot.accept("../reducers", () => {
      const nextRootReducer = require("../reducers").default;
      store.replaceReducer(persistedReducer(nextRootReducer));
    });
  }

  const persistor = persistStore(store);
  return { store, persistor };
}

const configureStore = process.env.NODE_ENV === "production" ? configureStoreProd : configureStoreDev;

export default configureStore;
