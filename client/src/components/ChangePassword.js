import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { identity, pick } from "ramda";
import classNames from "classnames";

import { attemptUpdatePassword } from "../actions/organization";
import { validatePassword } from "../utils/validation";

class ChangePasswordContainer extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({ username: PropTypes.string }).isRequired,
    attemptUpdatePassword: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      message: "",
      valid: false,
    };
  }

  updateOldPassword = e => this.setState({ oldPassword: e.target.value })

  updateNewPassword = (e) => {
    const { organization } = this.props;
    this.setState({ newPassword: e.target.value });
    this.validatePassword(organization.username, e.target.value);
  }

  updateConfirmPassword = e => this.setState({ confirmPassword: e.target.value })

  validatePassword = (username, password) => {
    const { valid, message } = validatePassword(username, password);

    this.setState({ valid, message });
  }

  save = () => {
    const { valid, oldPassword, newPassword, confirmPassword } = this.state;
    const { attemptUpdatePassword: attemptupdatePassword } = this.props;
    if (valid && newPassword === confirmPassword && oldPassword) {
      attemptupdatePassword({ oldPassword, newPassword }).then(() => this.setState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
        message: "",
        valid: false,
      })).catch(identity);
    }
  }

  render() {
    const { oldPassword, newPassword, confirmPassword, message, valid } = this.state;
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
        <h3 className="title is-3">Change Password</h3>
        <hr className="separator" />
        <div className="field">
          <p className="control">
            <label className="label" htmlFor="old-password">
              Old Password
              <input
                id="old-password"
                className="input"
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={this.updateOldPassword}
              />
            </label>
          </p>
        </div>
        <p className="has-space-below">
          <Link to="/recovery">Forgot your password?</Link>
        </p>
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
          disabled={!match || !valid || !oldPassword}
        >
          Update Password
        </button>
      </div>
    );
  }
}


const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({ attemptUpdatePassword: passwordInfo => dispatch(attemptUpdatePassword(passwordInfo)) });

export default connect(mapStateToProps, mapDispatchToProps)(ChangePasswordContainer);
