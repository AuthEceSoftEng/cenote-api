import React, { Component } from "react";
import PropTypes from "prop-types";
import { ConnectedRouter } from "connected-react-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import App from "./App";

// eslint-disable-next-line react/prefer-stateless-function
export default class Root extends Component {
  render() {
    const { store, history, persistor } = this.props;
    return (
      <Provider store={store}>
        <PersistGate loading={<div />} persistor={persistor}>
          <ConnectedRouter history={history}>
            <App />
          </ConnectedRouter>
        </PersistGate>
      </Provider>
    );
  }
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  persistor: PropTypes.object.isRequired,
};
