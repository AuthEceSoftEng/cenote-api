import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { pick, reverse } from "ramda";

import Project from "./Project";

function ProjectList({ projects }) {
  return (
    <ul className="project-list">
      {reverse(projects).map(project => <Project key={project.projectId} {...project} />)}
    </ul>
  );
}

ProjectList.propTypes = { projects: PropTypes.arrayOf(PropTypes.object).isRequired };

const mapStateToProps = pick(["projects"]);

export default connect(mapStateToProps)(ProjectList);
