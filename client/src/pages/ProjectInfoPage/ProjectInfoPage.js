import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { pick, isEmpty } from 'ramda';

import { Dashboard } from '../../components';

class ProjectInfoPage extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({}).isRequired,
    projects: PropTypes.array.isRequired,
    pushToLogin: PropTypes.func.isRequired,
  }

  componentDidMount() {
    const { organization, pushToLogin } = this.props;
    if (isEmpty(organization)) {
      pushToLogin();
    }
  }

  render() {
    const { projects } = this.props;
    const [project] = projects;
    return (
      <div className="home-page section">
        <Dashboard
          projectId={project.projectId}
          title={project.title}
          readKeys={project.readKeys}
          writeKeys={project.writeKeys}
          masterKeys={project.masterKeys}
        />
      </div>
    );
  }
}

const mapStateToProps = pick(['organization', 'projects']);
const mapDispatchToProps = dispatch => ({ pushToLogin: () => dispatch(push('/login')) });

export default connect(mapStateToProps, mapDispatchToProps)(ProjectInfoPage);
