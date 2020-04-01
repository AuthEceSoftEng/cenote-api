import { connect } from "react-redux";

import { attemptUpdateProjectReadKey, attemptUpdateProjectWriteKey, attemptUpdateProjectMasterKey } from "../../actions/projects";
import Dashboard from "./Dashboard";


const mapDispatchToProps = dispatch => ({
  updateProjectReadKey: (readKeys, id) => dispatch(attemptUpdateProjectReadKey(readKeys, id)),
  updateProjectWriteKey: (writeKeys, id) => dispatch(attemptUpdateProjectWriteKey(writeKeys, id)),
  updateProjectMasterKey: (masterKeys, id) => dispatch(attemptUpdateProjectMasterKey(masterKeys, id)),
});

export default connect(undefined, mapDispatchToProps)(Dashboard);
