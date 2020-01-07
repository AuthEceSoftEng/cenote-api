import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { slice } from 'ramda';

import Button from '../Button';
import OrganizationDropdown from '../OrganizationDropdown';

export default function Navigation(props) {
  const { organization, auth, pathname, toggleOrganizationDropdown, closeOrganizationDropdown, organizationDropdownOpen } = props;

  const isSettings = (pathname.length === 9) ? pathname === '/settings' : slice(0, 10, pathname) === '/settings/';
  const isProjects = (pathname.length === 9) ? pathname === '/projects' : slice(0, 10, pathname) === '/projects/';

  const projectsItemClasses = classNames({
    'navbar-item': true,
    'is-tab': true,
    'is-active': isProjects,
  });

  const settingsItemClasses = classNames({
    'navbar-item': true,
    'is-tab': true,
    'is-active': isSettings,
  });

  return (
    <nav className="navbar is-fixed-top has-shadow" role="navigation" style={{ display: 'flex' }}>
      <div className="container fluid">
        <div className="navbar-brand">
          <Link to={auth ? '/projects' : '/'} className="navbar-item" aria-label="main navigation">
            <img
              src={require('../../assets/images/logo.png')}
              alt="cenote"
              style={{ width: '12rem', maxHeight: '12rem' }}
            />
          </Link>
          <div className="navbar-brand-right">
            {auth && (
              <button
                className="navbar-item is-hoverable is-hidden-desktop button"
                style={{ alignSelf: 'center' }}
                type="button"
                onClick={toggleOrganizationDropdown}
                onKeyPress={toggleOrganizationDropdown}
              >
                <figure className="image navbar-image is-32x32">
                  <img
                    src={organization.profilePic || require('../../assets/images/default-profile.png')}
                    alt=""
                  />
                </figure>
                <span className="dropdown-caret" />
              </button>
            )}
          </div>
        </div>

        {auth ? (
          <div className="navbar-menu">
            <div className="navbar-start">
              <Link to="/projects" className={projectsItemClasses}>
                <h6 className="title is-6">Projects</h6>
              </Link>
              <Link to="/settings" className={settingsItemClasses}>
                <h6 className="title is-6">Settings</h6>
              </Link>
              <Link to="/docs" target="_blank" className="navbar-item">
                <Button label="Docs" className="title is-6" style={{ backgroundColor: '#00A09E', color: 'white' }} />
              </Link>
            </div>

            <div className="navbar-end">
              <button
                className="navbar-item is-hoverable button"
                style={{ alignSelf: 'center' }}
                onClick={toggleOrganizationDropdown}
                onKeyPress={toggleOrganizationDropdown}
                type="button"
              >
                <figure className="image navbar-image is-32x32">
                  <img
                    src={organization.profilePic || require('../../assets/images/default-profile.png')}
                    alt=""
                  />
                </figure>
                <span className="dropdown-caret" />
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-menu">
            <Link to="/docs" target="_blank" className="navbar-item">
              <Button label="Docs" className="title is-6" style={{ backgroundColor: '#00A09E', color: 'white' }} />
            </Link>
          </div>
        )}
        <OrganizationDropdown open={organizationDropdownOpen} closeDropdown={closeOrganizationDropdown} />
      </div>
    </nav>
  );
}

Navigation.propTypes = {
  auth: PropTypes.bool.isRequired,
  pathname: PropTypes.string.isRequired,
  organizationDropdownOpen: PropTypes.bool.isRequired,
  toggleOrganizationDropdown: PropTypes.func.isRequired,
  closeOrganizationDropdown: PropTypes.func.isRequired,
  organization: PropTypes.shape({
    username: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    profilePic: PropTypes.string,
  }).isRequired,
};
