import request from "superagent";
import { handleSuccess, handleError } from "./helpers";

export const postRegister = organization => request.post("/api/auth/register").send(organization).then(handleSuccess).catch(handleError);

export const postLogin = organization => request.post("/api/auth/login").send(organization).then(handleSuccess).catch(handleError);

export const postLogout = () => request.post("/api/auth/logout").then(handleSuccess).catch(handleError);
