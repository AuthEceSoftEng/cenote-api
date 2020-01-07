import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { identity } from 'ramda';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import * as localForage from 'localforage';

import { attemptLogin } from '../../actions/organization';
import { Box, FormInput } from '../../components';

class LoginPage extends React.Component {
  static propTypes = { attemptLogin: PropTypes.func.isRequired };

  state = {
    remember: false,
    username: '',
    password: '',
  }

  componentWillMount() {
    localForage.getItem('username').then((username) => {
      if (username) {
        this.setState({ remember: true, username });
      }
    });
  }

  componentDidMount() {
    window.addEventListener('keypress', this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('keypress', this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.login();
    }
  }

  login = () => {
    const { username, password, remember } = this.state;
    const { attemptLogin: attemptlogin } = this.props;
    const organizationCredentials = { username, password };

    if (remember) localForage.setItem('username', username);

    attemptlogin(organizationCredentials).catch(identity);
  }

  rememberMe = () => {
    localForage.removeItem('username').then(() => this.setState(prevState => ({ remember: !prevState.remember })));
  }

  updateUsername = username => this.setState({ username })

  updatePassword = password => this.setState({ password })

  render() {
    const { username, password } = this.state;

    return (
      <Box className="login">
        <img
          className="profile-img logo"
          src={require('../../assets/images/logo_login.png')}
          alt="cenote"
          style={{ width: '15rem', alignSelf: 'center' }}
        />
        <h2 className="title is-2 has-text-centered" style={{ color: '#00A09E' }}>Welcome to cenote&apos;s Dashboard</h2>
        <FormInput
          onChange={e => this.updateUsername(e.target.value)}
          placeholder="Username"
          value={username}
          leftIcon={faUser}
        />
        <FormInput
          onChange={e => this.updatePassword(e.target.value)}
          placeholder="Password"
          value={password}
          leftIcon={faLock}
          type="password"
        />
        <p className="control is-clearfix has-text-centered" style={{ margin: '.5rem', width: '100%' }}>
          <button
            type="button"
            className="button"
            onClick={this.login}
            style={{
              backgroundColor: '#00A09E',
              color: 'white',
              fontWeight: 'bold',
              width: '75%',
              fontSize: '1.2rem',
            }}
          >
            Login
          </button>
        </p>
        <p align="center">
          {'Forgot password?  '}
          <Link to="/recovery" style={{ color: '#00A09E' }}>Click here!</Link>
        </p>
        <hr style={{
          backgroundColor: '#10447a',
          height: '1px',
          margin: '.5rem',
        }}
        />
        <p align="center">Not registered Yet?</p>
        <p className="control is-clearfix has-text-centered" style={{ margin: '.5rem', width: '100%' }}>
          <Link to="/register">
            <button
              type="button"
              className="button"
              style={{
                borderWidth: '1px',
                borderColor: '#00A09E',
                color: '#00A09E',
                fontWeight: 'bold',
                width: '75%',
                fontSize: '1.2rem',
              }}
            >
              Sign Up!
            </button>
          </Link>

        </p>
      </Box>
    );
  }
}

const mapDispatchToProps = dispatch => ({ attemptLogin: organization => dispatch(attemptLogin(organization)) });

export default connect(undefined, mapDispatchToProps)(LoginPage);
