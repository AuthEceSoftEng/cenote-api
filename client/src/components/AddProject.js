import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import Button from "./Button";
import { attemptAddProject } from "../actions/projects";

class AddProject extends React.Component {
  static propTypes = { addProject: PropTypes.func.isRequired };

  constructor(props) {
    super(props);
    this.state = { title: "" };
  }

  componentDidMount() {
    window.addEventListener("keypress", this.keypress);
  }

  componentWillUnmount() {
    window.removeEventListener("keypress", this.keypress);
  }

  updateTitle = e => this.setState({ title: e.target.value })

  keypress = (e) => {
    if (e.key === "Enter") {
      this.addProject();
    }
  }

  addProject = () => {
    const { title } = this.state;
    const { addProject } = this.props;
    if (title) {
      addProject(title);
      this.setState({ title: "" });
    }
    window.location.reload();
  }

  render() {
    const { title } = this.state;
    return (
      <div className="add-project columns">
        <div className="is-8">
          <input
            className="input"
            type="text"
            value={title}
            onChange={this.updateTitle}
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
          />
        </div>
        <div className="is-2">
          <Button
            style={{ width: "100%", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, backgroundColor: "#00A09E" }}
            onClick={this.addProject}
            label="+Add"
            type="success"
          />
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({ addProject: title => dispatch(attemptAddProject(title)) });
export default connect(undefined, mapDispatchToProps)(AddProject);
