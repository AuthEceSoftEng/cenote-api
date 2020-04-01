import request from "superagent";
import { handleSuccess, handleError } from "./helpers";

export const getOrganization = () => request.get("/api/organizations").then(handleSuccess).catch(handleError);

export const putOrganization = info => request.put("/api/organizations").send(info).then(handleSuccess).catch(handleError);

export const putOrganizationPassword = passwordInfo => request.put("/api/organizations/password")
  .send(passwordInfo).then(handleSuccess).catch(handleError);

export const putNewOrganizationPassword = passwordInfo => request.post("/api/organizations/password")
  .send(passwordInfo).then(handleSuccess).catch(handleError);

export const putOrganizationEmail = emailInfo => request.put("/api/organizations/email")
  .send(emailInfo).then(handleSuccess).catch(handleError);

export const putOrganizationUsername = usernameInfo => request.put("/api/organizations/username")
  .send(usernameInfo).then(handleSuccess).catch(handleError);

export const resetPassword = emailInfo => request.post("/api/organizations/reset").send(emailInfo).then(handleSuccess).catch(handleError);

export const postCheckUsername = username => request.post("/api/organizations/checkUsername")
  .send({ username }).then(handleSuccess).catch(handleError);

export const postCheckEmail = email => request.post("/api/organizations/checkEmail").send({ email }).then(handleSuccess).catch(handleError);
