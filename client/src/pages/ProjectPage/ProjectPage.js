import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import { isEmpty, pick } from "ramda";

import { attemptGetProjects } from "../../actions/projects";
import { AddProject, ProjectList } from "../../components";

class ProjectPageContainer extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({}).isRequired,
    pushToLogin: PropTypes.func.isRequired,
    getProjects: PropTypes.func.isRequired,
  }

  componentDidMount() {
    const { organization, pushToLogin, getProjects } = this.props;
    if (isEmpty(organization)) {
      pushToLogin();
    } else {
      getProjects();
    }
  }

  render() {
    return (
      <div className="project-page section">
        <h1 className="title is-1 has-text-centered">Projects</h1>
        <div className="columns">
          <div className="column text-center">
            <AddProject />
          </div>
        </div>
        <div className="columns" style={{ marginBottom: "3rem" }}>
          <div className="column is-2" />
          <div className="column is-8 text-center">
            <ProjectList />
          </div>
          <div className="column is-2" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = pick(["organization"]);
const mapDispatchToProps = dispatch => ({
  pushToLogin: () => dispatch(push("/login")),
  getProjects: () => dispatch(attemptGetProjects()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectPageContainer);
