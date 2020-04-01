import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { identity, pick } from "ramda";
import classNames from "classnames";

import { attemptUpdateUsername } from "../actions/organization";
import { validateUsername } from "../utils/validation";

class ChangeUsernameContainer extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({ username: PropTypes.string }).isRequired,
    attemptUpdateUsername: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      newUsername: "",
      confirmUsername: "",
      message: "",
      valid: false,
      oldUsername: props.organization.username,
    };
  }

  updateOldUsername = e => this.setState({ oldUsername: e.target.value })

  updateNewUsername = (e) => {
    this.setState({ newUsername: e.target.value });
    this.validateUsername(e.target.value);
  }

  updateConfirmUsername = e => this.setState({ confirmUsername: e.target.value })

  validateUsername = (username) => {
    const { valid, message } = validateUsername(username);

    this.setState({ valid, message });
  }

  save = () => {
    const { valid, oldUsername, newUsername, confirmUsername } = this.state;
    const { attemptUpdateUsername: attemptupdateUsername } = this.props;
    if (valid && newUsername === confirmUsername && oldUsername) {
      attemptupdateUsername({ oldUsername, newUsername }).then(() => this.setState({
        oldUsername: "",
        newUsername: "",
        confirmUsername: "",
        message: "",
        valid: false,
      })).catch(identity);
    }
  }

  render() {
    const { oldUsername, newUsername, confirmUsername, message, valid } = this.state;
    const match = newUsername === confirmUsername;

    const newUsernameHelpClasses = classNames({
      help: true,
      "is-danger": !valid,
      "is-success": valid,
    });

    const newUsernameIconClasses = classNames({
      fa: true,
      "fa-check": valid,
      "is-success": valid,
      "fa-warning": newUsername && !valid,
      "is-danger": newUsername && !valid,
    });

    const newUsernameInputClasses = classNames({
      input: true,
      "is-success": valid,
      "is-danger": newUsername && !valid,
    });

    const confirmUsernameIconClasses = classNames({
      fa: true,
      "fa-check": confirmUsername && match,
      "is-success": confirmUsername && match,
      "fa-warning": confirmUsername && !match,
      "is-danger": confirmUsername && !match,
    });

    const confirmUsernameInputClasses = classNames({
      input: true,
      "is-success": confirmUsername && match,
      "is-danger": confirmUsername && !match,
    });

    const confirmUsernameHelpClasses = classNames({
      help: true,
      "is-success": match,
      "is-danger": !match,
    });

    return (
      <div className="change-username box">
        <h3 className="title is-3">Change Username</h3>
        <hr className="separator" />
        <div className="field">
          <p className="control">
            <label className="label" htmlFor="old-username">
              Current Username
              <input
                id="old-username"
                className="input"
                type="username"
                placeholder="Current Username"
                value={oldUsername}
                disabled
              />
            </label>
          </p>
        </div>
        <div className="field has-help">
          <p className="control has-icons-right">
            <label htmlFor="new-username" className="label">
              New Username
              <input
                id="new-username"
                className={newUsernameInputClasses}
                type="username"
                placeholder="New Username"
                value={newUsername}
                onChange={this.updateNewUsername}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={newUsernameIconClasses} />
            </span>
          </p>
          {newUsername && (
            <p className={newUsernameHelpClasses}>
              {message}
            </p>
          )}
        </div>

        <div className="field has-help">
          <p className="control has-icons-right">
            <label htmlFor="confirm-username" className="label">
              Confirm Username
              <input
                id="confirm-username"
                className={confirmUsernameInputClasses}
                type="username"
                placeholder="Confirm Username"
                value={confirmUsername}
                onChange={this.updateConfirmUsername}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={confirmUsernameIconClasses} />
            </span>
          </p>
          {confirmUsername && (
            <p className={confirmUsernameHelpClasses}>
              {match ? "Usernames match!" : "Usernames must match!"}
            </p>
          )}
        </div>

        <hr className="separator" />
        <button
          type="button"
          className="button is-success"
          onClick={this.save}
          disabled={!match || !valid || !oldUsername}
        >
          Update Username
        </button>
      </div>
    );
  }
}


const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({ attemptUpdateUsername: usernameInfo => dispatch(attemptUpdateUsername(usernameInfo)) });

export default connect(mapStateToProps, mapDispatchToProps)(ChangeUsernameContainer);
