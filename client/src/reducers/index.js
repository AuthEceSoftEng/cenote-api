import { combineReducers } from "redux";
import { reducer as alerts } from "react-notification-system-redux";
import { connectRouter } from "connected-react-router";

import organization from "./organization";
import projects from "./projects";

export default history => combineReducers({
  router: connectRouter(history),
  alerts,
  organization,
  projects,
});
