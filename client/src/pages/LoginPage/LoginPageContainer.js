import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import { isEmpty, pick } from "ramda";

import LoginPage from "./LoginPage";

class LoginPageContainer extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({}).isRequired,
    pushToProjects: PropTypes.func.isRequired,
  }

  componentDidMount() {
    const { organization, pushToProjects } = this.props;
    if (!isEmpty(organization)) {
      pushToProjects();
    }
  }

  render() {
    return (
      <div className="login-page section">
        <LoginPage />
      </div>
    );
  }
}

const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({ pushToProjects: () => dispatch(push("/projects")) });

export default connect(mapStateToProps, mapDispatchToProps)(LoginPageContainer);
