import { connect } from 'react-redux';

import { attemptOpenProjectInfo, attemptUpdateProject, attemptDeleteProject } from '../../actions/projects';
import ProjectContainer from './ProjectContainer';

const mapDispatchToProps = dispatch => ({
	openProjectInfo: projectId => dispatch(attemptOpenProjectInfo(projectId)),
	updateProject: (text, id) => dispatch(attemptUpdateProject(text, id)),
	deleteProject: projectId => dispatch(attemptDeleteProject(projectId)),
});

export default connect(undefined, mapDispatchToProps)(ProjectContainer);
