import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { ResetPassword } from "../../components";

const ResetPage = (props) => {
  const { match } = props;
  return (
    <div className="register-page section">
      <ResetPassword token={match.params.token} />
    </div>
  );
};
ResetPage.propTypes = { match: PropTypes.object.isRequired };

export default connect()(ResetPage);
