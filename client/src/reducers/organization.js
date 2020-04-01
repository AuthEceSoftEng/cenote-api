import update from "immutability-helper";
import { LOGIN_ORG, LOGOUT_ORG, UPDATE_ORG } from "../constants/actionTypes";

export default function organization(state = {}, action) {
  switch (action.type) {
    case (LOGIN_ORG):
      return update(state, { $merge: action.organization });
    case (LOGOUT_ORG):
      return ({});
    case (UPDATE_ORG):
      return update(state, { $merge: action.organization });
    default:
      return state;
  }
}
