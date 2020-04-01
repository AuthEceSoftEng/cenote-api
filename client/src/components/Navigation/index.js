import { connect } from "react-redux";
import { pick } from "ramda";
import NavigationContainer from "./NavigationContainer";

const mapStateToProps = pick(["organization"]);

export default connect(mapStateToProps)(NavigationContainer);
