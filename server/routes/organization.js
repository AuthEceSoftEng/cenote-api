const express = require("express");
const { Pool } = require("pg");
const asyncRedis = require("async-redis");
const { Organization, Project } = require("../models");

const router = express.Router();

const client = new Pool({
  user: "cockroach",
  host: process.env.COCKROACH_URL,
  database: process.env.COCKROACH_DBNAME || "cenote",
  port: process.env.COCKROACH_PORT || 26257,
});
client.connect(err => err && console.error(err));
const r = asyncRedis.createClient({ host: process.env.REDIS_URL, port: process.env.REDIS_PORT || 6379, password: process.env.REDIS_PASSWORD });
r.on("error", err => console.error(`Redis error: ${err}`));

/**
 * @apiDefine OrganizationNotFoundError
 * @apiError OrganizationNotFoundError The name of the Organization was not found.
 * @apiErrorExample {json} OrganizationNotFoundError:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "OrganizationNotFoundError"
 *     }
 */
/**
* @api {get} /:ORG_NAME/projects Get all projects of an organization
* @apiVersion 0.1.0
* @apiName GetProjects
* @apiGroup Organization
* @apiParam {String} ORG_NAME Organization's name
* @apiHeader {String} Authorization Organization's unique ID.
* @apiHeaderExample {json} Header Example:
* { "Authorization": "234534jklsd2" }
* @apiSuccess {Array} projects Projects found.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "projects": [...]
*     }
* @apiUse OrganizationNotFoundError
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
*/
router.get("/:ORG_NAME/projects", (req, res) => {
  Organization.findOne({ username: req.params.ORG_NAME }, {}, { lean: true }, (err, org) => {
    if (err || !org) return res.status(404).json({ error: "OrganizationNotFoundError" });
    const orgKey = req.headers.authorization;
    if (!orgKey) return res.status(403).json({ error: "NoCredentialsSentError" });
    if (orgKey !== org.organizationId) return res.status(401).json({ error: "KeyNotAuthorizedError" });
    return Project.find({ organization: org._id }, { _id: 0, __v: 0, organization: 0 }, { lean: true }, (err2, projects) => {
      if (err2 || projects.length === 0) return res.status(404).json({ message: `Can't find projects of ${req.params.ORG_NAME}!`, err });
      return res.status(200).json({ projects });
    });
  });
});


/**
* @api {post} /:ORG_NAME/projects Create a new project
* @apiVersion 0.1.0
* @apiName CreateProject
* @apiGroup Organization
* @apiParam {String} ORG_NAME Organization's name
* @apiParam {String} title New project's name
* @apiHeader {String} Authorization Organization's unique ID.
* @apiHeader {String} Content-Type="application/json"
* @apiHeaderExample {json} Header Example:
* { "Content-Type": "application/json", "Authorization": "234534jklsd2" }
* @apiParamExample {json} body Example:
*{
*   "title": "eeris"
*}
* @apiSuccess {String} message Success Message.
* @apiSuccess {String} project Project info.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "message": "Project successfully created!",
*       "project": (...)
*     }
* @apiUse OrganizationNotFoundError
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse NoDataSentError
* @apiUse AlreadyExistsError
*/
router.post("/:ORG_NAME/projects", (req, res) => {
  Organization.findOne({ username: req.params.ORG_NAME }, {}, { lean: true }, (err, org) => {
    if (err || !org) return res.status(404).json({ error: "OrganizationNotFoundError" });
    const orgKey = req.headers.authorization;
    if (!orgKey) return res.status(403).json({ error: "NoCredentialsSentError" });
    if (orgKey !== org.organizationId) return res.status(401).json({ error: "KeyNotAuthorizedError" });
    if (!req.body.title) return res.status(400).json({ error: "NoDataSentError" });
    return Project.count({ organization: org._id, title: req.body.title }, (err2, count) => {
      if (err2) return res.status(400).send({ message: "Create project failed", err });
      if (count > 0) return res.status(409).send({ error: "AlreadyExistsError" });
      const newProject = Project({ organization: org._id, title: req.body.title });
      return newProject.save((err3, savedProject) => {
        if (err3) return res.status(400).send({ message: "Create project failed", err });
        return res.send({ message: "Project successfully created!", project: savedProject.hide() });
      });
    });
  });
});

/**
* @api {get} /:ORG_NAME/projects/:PROJECT_ID Get info about a specific project
* @apiVersion 0.1.0
* @apiName GetProjectInfo
* @apiGroup Organization
* @apiParam {String} ORG_NAME Organization's name
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiHeader {String} Authorization Organization's unique ID.
* @apiHeaderExample {json} Header Example:
* { "Authorization": "234534jklsd2" }
* @apiSuccess {String} project Project info.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "project": (...)
*     }
* @apiUse OrganizationNotFoundError
* @apiUse ProjectNotFoundError
* @apiUse KeyNotFoundError
* @apiUse KeyNotAuthorizedError
*/
router.get("/:ORG_NAME/projects/:PROJECT_ID", (req, res) => {
  Organization.findOne({ username: req.params.ORG_NAME }, {}, { lean: true }, (err, org) => {
    if (err || !org) return res.status(404).json({ error: "OrganizationNotFoundError" });
    const orgKey = req.headers.authorization;
    if (!orgKey) return res.status(403).json({ error: "NoCredentialsSentError" });
    if (orgKey !== org.organizationId) return res.status(401).json({ error: "KeyNotAuthorizedError" });
    return Project.findOne({ organization: org._id, projectId: req.params.PROJECT_ID },
      { _id: 0, __v: 0, organization: 0 }, { lean: true }, (err2, project) => {
        if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
        return res.status(200).json({ project });
      });
  });
});

/**
* @api {put} /:ORG_NAME/projects/:PROJECT_ID Update a specific project
* @apiVersion 0.1.0
* @apiName GetProjectInfo
* @apiGroup Organization
* @apiParam {String} ORG_NAME Organization's name
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParamExample {json} body example:
*     {
*       "title": (...),
*       "organizationId": (...),
*     }
* @apiHeader {String} Authorization Organization's unique ID.
* @apiHeaderExample {json} Header Example:
* { "Authorization": "234534jklsd2" }
* @apiSuccess {String} message Success Message.
* @apiSuccess {String} project Project info.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "message": "Project successfully updated!",
*       "project": (...)
*     }
* @apiUse OrganizationNotFoundError
* @apiUse ProjectNotFoundError
* @apiUse KeyNotFoundError
* @apiUse KeyNotAuthorizedError
*/
router.put("/:ORG_NAME/projects/:PROJECT_ID", (req, res) => {
  Organization.findOne({ username: req.params.ORG_NAME }, {}, { lean: true }, (err, org) => {
    if (err || !org) return res.status(404).json({ error: "OrganizationNotFoundError" });
    const orgKey = req.headers.authorization;
    if (!orgKey) return res.status(403).json({ error: "NoCredentialsSentError" });
    if (orgKey !== org.organizationId) return res.status(401).json({ error: "KeyNotAuthorizedError" });
    return Project.findOneAndUpdate({ organization: org._id, projectId: req.params.PROJECT_ID }, { ...req.body, updatedAt: Date.now() },
      { new: true, lean: true }, (err2, project) => {
        if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
        return res.status(200).json({ message: "Project successfully updated!", project });
      });
  });
});

/**
* @api {delete} /:ORG_NAME/projects/:PROJECT_ID Delete a specific project
* @apiVersion 0.1.0
* @apiName DeleteProject
* @apiGroup Organization
* @apiParam {String} ORG_NAME Organization's name
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiHeader {String} Authorization Organization's unique ID.
* @apiHeaderExample {json} Header Example:
* { "Authorization": "234534jklsd2" }
* @apiSuccess {String} message Success Message.
* @apiSuccess {String} project Project info.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "message": "Project successfully deleted!",
*       "project": (...)
*     }
* @apiUse OrganizationNotFoundError
* @apiUse ProjectNotFoundError
* @apiUse KeyNotFoundError
* @apiUse KeyNotAuthorizedError
*/
router.delete("/:ORG_NAME/projects/:PROJECT_ID", (req, res) => {
  Organization.findOne({ username: req.params.ORG_NAME }, {}, { lean: true }, async (err, org) => {
    if (err || !org) return res.status(404).json({ error: "OrganizationNotFoundError" });
    const orgKey = req.headers.authorization;
    if (!orgKey) return res.status(403).json({ error: "NoCredentialsSentError" });
    if (orgKey !== org.organizationId) return res.status(401).json({ error: "KeyNotAuthorizedError" });
    const selectQuery = "SELECT * from information_schema.columns WHERE table_schema='public'";
    await client.query(selectQuery)
      .then(({ rows: answer }) => {
        answer.filter(el => el.table_name.startsWith(req.params.PROJECT_ID)).forEach((prop) => {
          const DropTableQuery = `DROP TABLE IF EXISTS ${prop.table_name}`;
          client.query(DropTableQuery);
          const redisKey = `${prop.table_name}_${prop.column_name}`;
          r.del(redisKey);
          r.del(`${redisKey}_hist`);
        });
      })
      .catch(err3 => res.status(400).json({ ok: false, results: "BadQueryError", message: err3.message }));
    return Project.findOneAndDelete({ organization: org._id, projectId: req.params.PROJECT_ID }, { lean: true }, (err2, project) => {
      if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
      return res.status(200).json({ message: "Project successfully deleted!", project });
    });
  });
});

module.exports = router;
