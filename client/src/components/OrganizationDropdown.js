import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { identity, pick } from 'ramda';

import { attemptLogout } from '../actions/organization';

class OrganizationDropdown extends Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    closeDropdown: PropTypes.func.isRequired,
    attemptLogout: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { open: false };
    this.close = this.close.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ open: nextProps.open });
  }

  logout = () => {
    const { closeDropdown, attemptLogout: attemptlogout } = this.props;
    this.setState({ open: false });
    closeDropdown();
    attemptlogout().catch(identity);
  }

  close() {
    const { closeDropdown } = this.props;
    this.setState({ open: false });
    closeDropdown();
  }


  render() {
    const { organization } = this.props;
    const { open } = this.state;

    return open && (
      <div className="dropdown box sm" ref={(el) => { this.dropdown = el; }}>
        <ul className="dropdown-list">
          <li className="dropdown-header">
            {organization.username}
          </li>
          <hr className="dropdown-separator" />
          <li className="dropdown-item has-text-centered">
            <Link to="/projects" onClick={this.close}>Project List</Link>
          </li>
          <li className="dropdown-item has-text-centered">
            <Link to="/settings" onClick={this.close}>Settings</Link>
          </li>
          <hr className="dropdown-separator" />
          <li className="dropdown-item">
            <button
              className="button"
              onClick={this.logout}
              type="button"
              onKeyPress={this.logout}
              style={{ backgroundColor: '#00A09E', color: 'white' }}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    );
  }
}

const mapStateToProps = pick(['organization']);
const mapDispatchToProps = dispatch => ({ attemptLogout: () => dispatch(attemptLogout()) });
export default connect(mapStateToProps, mapDispatchToProps)(OrganizationDropdown);
