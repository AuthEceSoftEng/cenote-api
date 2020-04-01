import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import { isEmpty, pick } from "ramda";

import SettingsPage from "./SettingsPage";

const SettingsPageContainer = (props) => {
  const { organization, pushToLogin, location } = props;
  if (isEmpty(organization)) {
    pushToLogin();
  }
  return (
    <SettingsPage location={location} />
  );
};

SettingsPageContainer.propTypes = {
  organization: PropTypes.shape({}).isRequired,
  pushToLogin: PropTypes.func.isRequired,
  location: PropTypes.shape({ pathname: PropTypes.string.isRequired }).isRequired,
};

const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({ pushToLogin: () => dispatch(push("/login")) });

export default connect(mapStateToProps, mapDispatchToProps)(SettingsPageContainer);
