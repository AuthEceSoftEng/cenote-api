import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { pick, identity, isEmpty } from "ramda";

import { attemptGetOrganization, attemptUpdateOrganization } from "../../actions/organization";
import { validateName } from "../../utils/validation";
import { Box } from "../../components";

class ProfileSettings extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({
      username: PropTypes.string,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      bio: PropTypes.string,
      profilePic: PropTypes.string,
      organizationId: PropTypes.string,
    }).isRequired,
    attemptUpdateOrganization: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      firstName: props.organization.firstName || "",
      username: props.organization.username || "",
      lastName: props.organization.lastName || "",
      bio: props.organization.bio || "",
      profilePic: props.organization.profilePic || "",
      organizationId: props.organization.organizationId || "",
      firstNameEdited: false,
      lastNameEdited: false,
      bioEdited: false,
      profilePicEdited: false,
    };
  }

  updateFirstName = (e) => {
    if (validateName(e.target.value)) {
      this.setState({ firstName: e.target.value, firstNameEdited: true });
    }
  }

  updateLastName = (e) => {
    if (validateName(e.target.value)) {
      this.setState({ lastName: e.target.value, lastNameEdited: true });
    }
  }

  updateBio = e => this.setState({ bio: e.target.value, bioEdited: true })

  updateProfilePic = e => this.setState({ profilePic: e.target.value, profilePicEdited: true })

  save = () => {
    const { firstNameEdited, lastNameEdited, profilePicEdited, bioEdited, firstName, lastName, profilePic, bio } = this.state;
    const updatedOrganization = {};

    if (firstNameEdited) { updatedOrganization.firstName = firstName; }
    if (lastNameEdited) { updatedOrganization.lastName = lastName; }
    if (profilePicEdited) { updatedOrganization.profilePic = profilePic; }
    if (bioEdited) { updatedOrganization.bio = bio; }

    if (!isEmpty(updatedOrganization)) {
      const { attemptUpdateOrganization: attemptupdateOrganization } = this.props;
      attemptupdateOrganization(updatedOrganization).then(this.resetState).catch(identity);
    }
  }

  render() {
    const {
      firstName,
      lastName,
      organizationId,
      bio,
      profilePic,
      firstNameEdited,
      lastNameEdited,
      bioEdited,
      profilePicEdited,
      username,
    } = this.state;

    const edited = firstNameEdited || lastNameEdited || bioEdited || profilePicEdited;
    const charactersRemaining = 240 - bio.length;
    return (
      <div className="profile-settings">
        <Box className="general-profile">
          <h3 className="title is-3">General</h3>
          <hr className="separator" />
          <div className="columns">
            <div className="column is-4">
              <h3 className="title is-3 has-text-centered">
                {username}
              </h3>
              <figure className="image">
                <img
                  className="profile-img"
                  src={profilePic || require("../../assets/images/default-profile.png")}
                  alt="Profile"
                />
              </figure>
              <div className="field">
                <p className="control">
                  <label htmlFor="profile-pic-url" className="label">
                    Picture URL
                    <input
                      id="profile-pic-url"
                      className="input"
                      type="text"
                      placeholder="Picture URL"
                      value={profilePic}
                      onChange={this.updateProfilePic}
                    />
                  </label>
                </p>
              </div>
            </div>

            <div className="column is-8">
              <div className="field">
                <p className="control">
                  <label htmlFor="organization-id" className="label">
                    Organization ID
                    <input
                      id="organization-id"
                      className="input has-text-danger has-text-centered has-text-weight-semibold is-size-4"
                      type="text"
                      disabled
                      value={organizationId}
                    />
                  </label>
                </p>
              </div>
              <div className="columns">
                <div className="column is-6">
                  <div className="field">
                    <p className="control">
                      <label htmlFor="first-name" className="label">
                        First Name
                        <input
                          id="first-name"
                          className="input"
                          type="text"
                          placeholder="First Name"
                          value={firstName}
                          onChange={this.updateFirstName}
                        />
                      </label>
                    </p>
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <p className="control">
                      <label htmlFor="last-name" className="label">
                        Last Name
                        <input
                          id="last-name"
                          className="input"
                          type="text"
                          placeholder="Last Name"
                          value={lastName}
                          onChange={this.updateLastName}
                        />
                      </label>
                    </p>
                  </div>
                </div>
              </div>
              <div className="field">
                <p className="control">
                  <label htmlFor="bio" className="label">
                    Bio
                    <textarea
                      id="bio"
                      className="textarea"
                      placeholder="Tell us about yourself."
                      value={bio}
                      maxLength={240}
                      onChange={this.updateBio}
                    />
                  </label>
                </p>
                <p className="help">
                  {`Characters remaining: ${charactersRemaining}`}
                </p>
              </div>

            </div>
          </div>
          <hr className="separator" />
          <button type="button" className="button is-success" disabled={!edited} onClick={this.save}>Save</button>
        </Box>
      </div>
    );
  }
}

const mapStateToProps = pick(["organization", "locations"]);
const mapDispatchToProps = dispatch => ({
  attemptGetOrganization: () => dispatch(attemptGetOrganization()),
  attemptUpdateOrganization: organization => dispatch(attemptUpdateOrganization(organization)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProfileSettings);
