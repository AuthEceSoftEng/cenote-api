import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import { pick, isEmpty } from "ramda";

import { Clock } from "../../components";

class HomePageContainer extends React.Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
    pushToLogin: PropTypes.func.isRequired,
  }

  componentDidMount() {
    const { organization, pushToLogin } = this.props;
    if (isEmpty(organization)) {
      pushToLogin();
    }
  }

  render() {
    const { organization } = this.props;
    return (
      <div className="home-page section">
        <Clock />
        <h1 className="title is-1">{`Welcome, ${organization.username}!`}</h1>
      </div>
    );
  }
}

const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({ pushToLogin: () => dispatch(push("/login")) });

export default connect(mapStateToProps, mapDispatchToProps)(HomePageContainer);
