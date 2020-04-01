import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { identity, pick } from "ramda";
import classNames from "classnames";

import { attemptUpdateEmail } from "../actions/organization";
import { validateEmail } from "../utils/validation";

class ChangeEmailContainer extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({
      username: PropTypes.string,
      email: PropTypes.string,
    }).isRequired,
    attemptUpdateEmail: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      newEmail: "",
      confirmEmail: "",
      message: "",
      valid: false,
    };
  }

  updateOldEmail = e => this.setState({ oldEmail: e.target.value })

  updateNewEmail = (e) => {
    this.setState({ newEmail: e.target.value });
    this.validateEmail(e.target.value);
  }

  updateConfirmEmail = e => this.setState({ confirmEmail: e.target.value })

  validateEmail = (email) => {
    const { valid, message } = validateEmail(email);

    this.setState({ valid, message });
  }

  save = () => {
    const { valid, oldEmail, newEmail, confirmEmail } = this.state;
    const { attemptUpdateEmail: attemptupdateEmail } = this.props;
    if (valid && newEmail === confirmEmail && oldEmail) {
      attemptupdateEmail({ oldEmail, newEmail }).then(() => this.setState({
        oldEmail: "",
        newEmail: "",
        confirmEmail: "",
        message: "",
        valid: false,
      })).catch(identity);
    }
  }

  render() {
    const { oldEmail, newEmail, confirmEmail, message, valid } = this.state;
    const match = newEmail === confirmEmail;

    const newEmailHelpClasses = classNames({
      help: true,
      "is-danger": !valid,
      "is-success": valid,
    });

    const newEmailIconClasses = classNames({
      fa: true,
      "fa-check": valid,
      "is-success": valid,
      "fa-warning": newEmail && !valid,
      "is-danger": newEmail && !valid,
    });

    const newEmailInputClasses = classNames({
      input: true,
      "is-success": valid,
      "is-danger": newEmail && !valid,
    });

    const confirmEmailIconClasses = classNames({
      fa: true,
      "fa-check": confirmEmail && match,
      "is-success": confirmEmail && match,
      "fa-warning": confirmEmail && !match,
      "is-danger": confirmEmail && !match,
    });

    const confirmEmailInputClasses = classNames({
      input: true,
      "is-success": confirmEmail && match,
      "is-danger": confirmEmail && !match,
    });

    const confirmEmailHelpClasses = classNames({
      help: true,
      "is-success": match,
      "is-danger": !match,
    });

    return (
      <div className="change-email box">
        <h3 className="title is-3">Change Email</h3>
        <hr className="separator" />
        <div className="field">
          <p className="control">
            <label className="label" htmlFor="old-email">
              Current Email
              <input
                id="old-email"
                className="input"
                type="email"
                placeholder="Current Email"
                value={oldEmail}
                onChange={this.updateOldEmail}
              />
            </label>
          </p>
        </div>
        <div className="field has-help">
          <p className="control has-icons-right">
            <label htmlFor="new-email" className="label">
              New Email
              <input
                id="new-email"
                className={newEmailInputClasses}
                type="email"
                placeholder="New Email"
                value={newEmail}
                onChange={this.updateNewEmail}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={newEmailIconClasses} />
            </span>
          </p>
          {newEmail && (
            <p className={newEmailHelpClasses}>
              {message}
            </p>
          )}
        </div>

        <div className="field has-help">
          <p className="control has-icons-right">
            <label htmlFor="confirm-email" className="label">
              Confirm Email
              <input
                id="confirm-email"
                className={confirmEmailInputClasses}
                type="email"
                placeholder="Confirm Email"
                value={confirmEmail}
                onChange={this.updateConfirmEmail}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={confirmEmailIconClasses} />
            </span>
          </p>
          {confirmEmail && (
            <p className={confirmEmailHelpClasses}>
              {match ? "Emails match!" : "Emails must match!"}
            </p>
          )}
        </div>

        <hr className="separator" />
        <button
          type="button"
          className="button is-success"
          onClick={this.save}
          disabled={!match || !valid || !oldEmail}
        >
          Update Email
        </button>
      </div>
    );
  }
}


const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({ attemptUpdateEmail: emailInfo => dispatch(attemptUpdateEmail(emailInfo)) });

export default connect(mapStateToProps, mapDispatchToProps)(ChangeEmailContainer);
