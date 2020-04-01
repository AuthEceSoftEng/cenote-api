import { connect } from "react-redux";
import { pick } from "ramda";

import { attemptOpenProjectInfo, attemptUpdateProjectTitle, attemptDeleteProject } from "../../actions/projects";
import ProjectContainer from "./ProjectContainer";

const mapStateToProps = pick(["organization"]);

const mapDispatchToProps = dispatch => ({
  openProjectInfo: projectId => dispatch(attemptOpenProjectInfo(projectId)),
  updateProjectTitle: (title, id) => dispatch(attemptUpdateProjectTitle(title, id)),
  deleteProject: projectId => dispatch(attemptDeleteProject(projectId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectContainer);
