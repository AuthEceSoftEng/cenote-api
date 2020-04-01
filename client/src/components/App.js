import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Route, Switch, withRouter } from "react-router-dom";
import { hot } from "react-hot-loader";
import Notifications from "react-notification-system-redux";
import { pick } from "ramda";
import { RegisterPage, LoginPage, NotFoundPage, ProjectPage, RecoveryPage, SettingsPage, ProjectInfoPage,
  ResetPage } from "../pages";
import Navigation from "./Navigation";
import Footer from "./Footer";

class App extends React.Component {
  static propTypes = {
    location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
    alerts: PropTypes.array.isRequired,
  }

  componentDidMount() {
    if (!document.cookie) document.cookie = "cenote=yo";
  }

  render() {
    const { location, alerts } = this.props;
    return (
      <nav>
        <Notifications notifications={alerts} />
        <Navigation pathname={location.pathname} />
        <div className="main">
          <Switch>
            <Route exact path="/" component={LoginPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route exact path="/projects" component={ProjectPage} />
            <Route path="/projects/:id" component={ProjectInfoPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/recovery" component={RecoveryPage} />
            <Route path="/reset/:token" component={ResetPage} />
            <Route path="*" component={NotFoundPage} />
          </Switch>
          <Footer />
        </div>
      </nav>
    );
  }
}
const mapStateToProps = pick(["alerts"]);

export default hot(module)(withRouter(connect(mapStateToProps)(App)));
