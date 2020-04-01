import { push } from "connected-react-router";
import Notifications from "react-notification-system-redux";
import * as localForage from "localforage";

import { getProjects, postProject, getProject, putProject, deleteProject } from "../api/projects";
import { handleError } from "./helpers";
import * as types from "../constants/actionTypes";

export const setProjects = projects => ({ type: types.SET_PROJECTS, projects });
export const addProject = ({ projectId, title, createdAt }) => ({ type: types.ADD_PROJECT, createdAt, projectId, title });
export const openProjectInfo = project => ({ type: types.OPEN_PROJECT_INFO, project });
export const updateProjectTitle = ({ projectId, title, updatedAt }) => ({ type: types.UPDATE_PROJECT, updatedAt, projectId, title });
export const updateProjectReadKey = ({ projectId, readKeys, updatedAt }) => ({ type: types.UPDATE_PROJECT, updatedAt, projectId, readKeys });
export const updateProjectWriteKey = ({ projectId, writeKeys, updatedAt }) => ({ type: types.UPDATE_PROJECT, updatedAt, projectId, writeKeys });
export const updateProjectMasterKey = ({ projectId, masterKeys, updatedAt }) => ({ type: types.UPDATE_PROJECT, updatedAt, projectId, masterKeys });
export const removeProject = projectId => ({ type: types.REMOVE_PROJECT, projectId });

export const attemptGetProjects = () => dispatch => getProjects().then((data) => {
  dispatch(setProjects(data.projects));
  return data.projects;
}).catch((err) => {
  if (!err.req._query || err.req._query.length === 0) return localForage.removeItem("persist:root").then(() => push("/"));
  return handleError(dispatch);
});

export const attemptAddProject = title => dispatch => postProject({ title }).then((data) => {
  dispatch(addProject(data.project));
  dispatch(Notifications.success({ title: "Success!", message: data.message, position: "tr", autoDismiss: 3 }));
  return data;
}).catch(handleError(dispatch));

export const attemptOpenProjectInfo = projectId => dispatch => getProject({ projectId }).then((data) => {
  dispatch(openProjectInfo(data.project));
  dispatch(push(`/projects/${data.project.projectId}`));
  return data.project;
}).catch(handleError(dispatch));

export const attemptUpdateProjectTitle = ({ projectId, title }) => dispatch => putProject({ projectId, title }).then((data) => {
  dispatch(updateProjectTitle({ projectId, title, updatedAt: data.project.updatedAt }));
  dispatch(Notifications.success({ title: "Success!", message: data.message, position: "tr", autoDismiss: 3 }));
  return data;
}).catch(handleError(dispatch));

export const attemptUpdateProjectReadKey = ({ projectId, readKeys }) => dispatch => putProject({ projectId, readKeys }).then((data) => {
  dispatch(updateProjectReadKey({ projectId, readKeys, updatedAt: data.project.updatedAt }));
  dispatch(Notifications.success({ title: "Success!", message: data.message, position: "tr", autoDismiss: 3 }));
  return data;
}).catch(handleError(dispatch));

export const attemptUpdateProjectWriteKey = ({ projectId, writeKeys }) => dispatch => putProject({ projectId, writeKeys }).then((data) => {
  dispatch(updateProjectWriteKey({ projectId, writeKeys, updatedAt: data.project.updatedAt }));
  dispatch(Notifications.success({ title: "Success!", message: data.message, position: "tr", autoDismiss: 3 }));
  return data;
}).catch(handleError(dispatch));

export const attemptUpdateProjectMasterKey = ({ projectId, masterKeys }) => dispatch => putProject({ projectId, masterKeys })
  .then((data) => {
    dispatch(updateProjectMasterKey({ projectId, masterKeys, updatedAt: data.project.updatedAt }));
    dispatch(Notifications.success({ title: "Success!", message: data.message, position: "tr", autoDismiss: 3 }));
    return data;
  }).catch(handleError(dispatch));

export const attemptDeleteProject = projectId => dispatch => deleteProject({ projectId }).then((data) => {
  dispatch(removeProject(projectId));
  dispatch(Notifications.success({ title: "Success!", message: data.message, position: "tr", autoDismiss: 3 }));
  return data;
}).catch(handleError(dispatch));
