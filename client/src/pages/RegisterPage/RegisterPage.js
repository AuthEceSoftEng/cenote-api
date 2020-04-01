import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { identity } from "ramda";
import classNames from "classnames";

import { attemptRegister } from "../../actions/organization";
import { postCheckUsername, postCheckEmail } from "../../api/organization";
import { validatePassword, validateUsername, validateEmail } from "../../utils/validation";
import { Box, Button } from "../../components";

class RegisterPage extends React.Component {
  static propTypes = { attemptRegister: PropTypes.func.isRequired };

  constructor(props) {
    super(props);
    this.state = {
      username: "",
      usernameMessage: "",
      email: "",
      emailMessage: "",
      password: "",
      passwordMessage: "",
      emailAvailable: false,
      usernameAvailable: false,
      passwordValid: false,
    };
  }

  componentDidMount() {
    window.addEventListener("keypress", this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener("keypress", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    if (e.key === "Enter") this.register();
  }

  updateUsername = (username) => {
    const { password } = this.state;
    this.setState({ username });
    this.validatePassword(username, password);
  }

  updateEmail = email => this.setState({ email });

  updatePassword = password => this.setState({ password })

  handleUsernameChange = (e) => {
    this.updateUsername(e.target.value);
    this.validateUsername(e.target.value);
  }

  handleEmailChange = (e) => {
    this.updateEmail(e.target.value);
    this.validateEmail(e.target.value);
  }

  handlePasswordChange = (e) => {
    const { username } = this.state;
    this.updatePassword(e.target.value);
    this.validatePassword(username, e.target.value);
  }

  validateUsername = (username) => {
    const { valid, message } = validateUsername(username);

    if (valid) {
      this.setState({ usernameMessage: "Checking username...", usernameAvailable: false },
        () => postCheckUsername(username)
          .then(res => this.setState({
            usernameAvailable: res.available,
            usernameMessage: res.message,
          }))
          .catch(identity));
    } else {
      this.setState({ usernameAvailable: valid, usernameMessage: message });
    }
  }

  validateEmail = (email) => {
    const { valid, message } = validateEmail(email);

    if (valid) {
      this.setState({ emailMessage: "Checking email...", emailAvailable: false },
        () => postCheckEmail(email)
          .then(res => this.setState({
            emailAvailable: res.available,
            emailMessage: res.message,
          }))
          .catch(identity));
    } else {
      this.setState({ emailAvailable: valid, emailMessage: message });
    }
  }

  validatePassword = (username, password) => {
    const { valid, message } = validatePassword(username, password);

    this.setState({ passwordValid: valid, passwordMessage: message });
  }

  register = () => {
    const { usernameAvailable, username, emailAvailable, email, password, passwordValid } = this.state;
    const { attemptRegister: attemptregister } = this.props;
    if (usernameAvailable && emailAvailable && passwordValid) {
      const newOrganization = { username, email, password };
      attemptregister(newOrganization).catch(identity);
    }
  }

  render() {
    const {
      username,
      usernameMessage,
      usernameAvailable,
      email,
      emailMessage,
      emailAvailable,
      password,
      passwordMessage,
      passwordValid,
    } = this.state;
    const usernameIconClasses = classNames({
      fa: true,
      "fa-check": usernameAvailable,
      "fa-warning": username && !usernameAvailable,
      "is-success": usernameAvailable,
      "is-danger": username && !usernameAvailable,
    });
    const usernameInputClasses = classNames({ input: true, "is-success": usernameAvailable, "is-danger": username && !usernameAvailable });
    const usernameHelpClasses = classNames({ help: true, "is-success": usernameAvailable, "is-danger": username && !usernameAvailable });

    const emailIconClasses = classNames({
      fa: true,
      "fa-check": emailAvailable,
      "fa-warning": email && !emailAvailable,
      "is-success": emailAvailable,
      "is-danger": email && !emailAvailable,
    });
    const emailInputClasses = classNames({ input: true, "is-success": emailAvailable, "is-danger": email && !emailAvailable });
    const emailHelpClasses = classNames({ help: true, "is-success": emailAvailable, "is-danger": email && !emailAvailable });

    const passwordIconClasses = classNames({
      fa: true,
      "fa-check": passwordValid,
      "fa-warning": password && !passwordValid,
      "is-success": passwordValid,
      "is-danger": password && !passwordValid,
    });
    const passwordInputClasses = classNames({ input: true, "is-success": passwordValid, "is-danger": password && !passwordValid });
    const passwordHelpClasses = classNames({ help: true, "is-success": passwordValid, "is-danger": password && !passwordValid });

    return (
      <Box className="register">
        <h3 className="title is-3">Sign Up</h3>
        <hr className="separator" />
        <p className="has-space-below">
          {"Already a member? "}
          <Link to="/login">Login</Link>
        </p>
        <div className="field">
          <p className="control has-icons-right">
            <label htmlFor="email" className="label">
              Email
              <input
                id="email"
                className={emailInputClasses}
                placeholder="Email"
                type="email"
                value={email}
                onChange={this.handleEmailChange}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={emailIconClasses} />
            </span>
          </p>
          {email && (
          <p className={emailHelpClasses}>
            {emailMessage}
          </p>
          )}
        </div>
        <div className="field">
          <p className="control has-icons-right">
            <label htmlFor="username" className="label">
              Username
              <input
                id="username"
                className={usernameInputClasses}
                placeholder="Username"
                type="username"
                value={username}
                onChange={this.handleUsernameChange}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={usernameIconClasses} />
            </span>
          </p>
          {username && (
          <p className={usernameHelpClasses}>
            {usernameMessage}
          </p>
          )}
        </div>
        <div className="field">
          <p className="control has-icons-right">
            <label htmlFor="password" className="label">
              Password
              <input
                id="password"
                className={passwordInputClasses}
                placeholder="Password"
                type="password"
                value={password}
                onChange={this.handlePasswordChange}
              />
            </label>
            <span className="icon is-small is-right">
              <i className={passwordIconClasses} />
            </span>
          </p>
          {password && (
          <p className={passwordHelpClasses}>
            {passwordMessage}
          </p>
          )}
        </div>

        <hr className="separator" />

        <div className="has-text-right">
          <Button
            type="secondary"
            disabled={!passwordValid || !usernameAvailable || !emailAvailable}
            onClick={this.register}
            label="Create Account"
          />
        </div>
      </Box>
    );
  }
}

const mapDispatchToProps = dispatch => ({ attemptRegister: newOrganization => dispatch(attemptRegister(newOrganization)) });

export default connect(undefined, mapDispatchToProps)(RegisterPage);
