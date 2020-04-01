import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { identity } from "ramda";
import classNames from "classnames";

import { attemptReset } from "../../actions/organization";
import { Box, FormInput } from "../../components";
import { validateEmail } from "../../utils/validation";

class RecoveryPage extends React.Component {
  static propTypes = { attemptReset: PropTypes.func.isRequired };

  constructor(props) {
    super(props);
    this.state = {
      email: "",
      message: "",
      valid: false,
    };
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
    window.addEventListener("keypress", this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener("keypress", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    if (e.key === "Enter") {
      this.reset();
    }
  }

  validateEmail = (email) => {
    const { valid, message } = validateEmail(email);
    this.setState({ valid, message });
  }

  updateEmail = (email) => {
    this.setState({ email });
    this.validateEmail(email);
  }

  reset = () => {
    const { email, valid } = this.state;
    const { attemptReset: attemptreset } = this.props;
    if (valid && email) attemptreset({ email }).catch(identity);
  }

  render() {
    const { email, message, valid } = this.state;
    const emailHelpClasses = classNames({ help: true, "is-danger": !valid, "is-success": valid });
    const emailIconClasses = classNames({
      fa: true,
      "fa-check": valid,
      "is-success": valid,
      "fa-warning": email && !valid,
      "is-danger": email && !valid,
    });

    return (
      <div className="register-page section">
        <Box className="register">
          <h3 className="title is-3">Reset Password</h3>
          <hr className="separator" />
          <div className="field has-help">
            <div className="control has-icons-right">
              <label htmlFor="email" className="label">
                Email
                <FormInput
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => this.updateEmail(e.target.value)}
                  leftIcon={faEnvelope}
                />
              </label>
              <span className="icon is-small is-right">
                <i className={emailIconClasses} />
              </span>
            </div>
            {email && (
            <p className={emailHelpClasses}>
              {message}
            </p>
            )}
          </div>
          <hr className="separator" />
          <p className="control is-clearfix">
            <button type="button" className="button is-primary is-pulled-right" onClick={this.reset}>Reset</button>
          </p>
        </Box>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({ attemptReset: email => dispatch(attemptReset(email)) });

export default connect(undefined, mapDispatchToProps)(RecoveryPage);
