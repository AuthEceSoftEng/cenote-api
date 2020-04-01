import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { identity } from "ramda";
import classNames from "classnames";

import { attemptResetPassword } from "../actions/organization";
import { validatePassword } from "../utils/validation";

class ResetPassword extends React.Component {
  static propTypes = {
    token: PropTypes.string.isRequired,
    attemptResetPassword: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      newPassword: "",
      confirmPassword: "",
      message: "",
      valid: false,
    };
  }


  updateNewPassword = (e) => {
    this.setState({ newPassword: e.target.value });
    this.validatePassword(undefined, e.target.value);
  }

  updateConfirmPassword = e => this.setState({ confirmPassword: e.target.value })

  validatePassword = (username, password) => {
    const { valid, message } = validatePassword(undefined, password);

    this.setState({ valid, message });
  }

  save = () => {
    const { valid, newPassword, confirmPassword } = this.state;
    const { attemptResetPassword: attemptresetPassword, token } = this.props;
    if (valid && newPassword === confirmPassword) {
      attemptresetPassword({ newPassword, token }).then(() => this.setState({
        message: "",
        valid: false,
      })).catch(identity);
    }
  }

  render() {
    const { newPassword, confirmPassword, message, valid } = this.state;
    const match = newPassword === confirmPassword;

    const newPasswordHelpClasses = classNames({
      help: true,
      "is-danger": !valid,
      "is-success": valid,
    });

    const newPasswordIconClasses = classNames({
      fa: true,
      "fa-check": valid,
      "is-success": valid,
      "fa-warning": newPassword && !valid,
      "is-danger": newPassword && !valid,
    });

    const newPasswordInputClasses = classNames({
      input: true,
      "is-success": valid,
      "is-danger": newPassword && !valid,
    });

    const confirmPasswordIconClasses = classNames({
      fa: true,
      "fa-check": confirmPassword && match,
      "is-success": confirmPassword && match,
      "fa-warning": confirmPassword && !match,
      "is-danger": confirmPassword && !match,
    });

    const confirmPasswordInputClasses = classNames({
      input: true,
      "is-success": confirmPassword && match,
      "is-danger": confirmPassword && !match,
    });

    const confirmPasswordHelpClasses = classNames({
      help: true,
      "is-success": match,
      "is-danger": !match,
    });

    return (
      <div className="change-password box">
        <h3 className="title is-3">Reset Password</h3>
        <hr className="separator" />
        <div className="field has-help">
          <p className="control has-icons-right">
            <label htmlFor="new-password" className="label">
              New Password
              <input
                id="new-password"
                className={newPasswordInputClasses}
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={this.updateNewPassword}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={newPasswordIconClasses} />
            </span>
          </p>
          {newPassword && (
            <p className={newPasswordHelpClasses}>
              {message}
            </p>
          )}
        </div>

        <div className="field has-help">
          <p className="control has-icons-right">
            <label htmlFor="confirm-password" className="label">
              Confirm Password
              <input
                id="confirm-password"
                className={confirmPasswordInputClasses}
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={this.updateConfirmPassword}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={confirmPasswordIconClasses} />
            </span>
          </p>
          {confirmPassword && (
            <p className={confirmPasswordHelpClasses}>
              {match ? "Passwords match!" : "Passwords must match!"}
            </p>
          )}
        </div>

        <hr className="separator" />
        <button
          type="button"
          className="button is-success"
          onClick={this.save}
          disabled={!match || !valid}
        >
          Reset Password
        </button>
      </div>
    );
  }
}


const mapDispatchToProps = dispatch => ({ attemptResetPassword: passwordInfo => dispatch(attemptResetPassword(passwordInfo)) });

export default connect(null, mapDispatchToProps)(ResetPassword);
