const express = require("express");
const uuid = require("uuid/v4");

const { Project } = require("../models");
const { requireAuth } = require("./middleware");

const router = express.Router({ mergeParams: true });

/**
* @api {get} /projects/:PROJECT_ID/keys Get every object key
* @apiVersion 0.1.0
* @apiName GetAllKeys
* @apiGroup Keys
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiSuccess {Array} readKeys All read keys.
* @apiSuccess {Array} writeKeys All write keys.
* @apiSuccess {Array} masterKeys All master keys.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "readKeys": ["249c8ba8-68c8", "249c8ba8-1234",...]
*       "writeKeys": ["249c8ba8-68c8", "249c8ba8-1234",...]
*       "masterKeys": ["249c8ba8-68c8", "249c8ba8-1234",...]
*     }
* @apiUse ProjectNotFoundError
*/
router.get("/", (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
  return res.json({ readKeys: project.readKeys, writeKeys: project.writeKeys, masterKeys: project.masterKeys });
}));

/**
 * @apiDefine KeyNotFoundError
 * @apiError KeyNotFoundError This key was not found in this project.
 * @apiErrorExample {json} KeyNotFoundError:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "KeyNotFoundError"
 *     }
 */
/**
* @api {get} /projects/:PROJECT_ID/keys/:KEY Get info about a specific key
* @apiVersion 0.1.0
* @apiName GetKeyInfo
* @apiGroup Keys
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} KEY An API key.
* @apiSuccess {String} type Key's type.
* @apiSuccess {String} active If key is active or revoked.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "type": "read"
*       "active": true
*     }
* @apiUse ProjectNotFoundError
* @apiUse KeyNotFoundError
*/
router.get("/:KEY", (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
  if (project.readKeys.includes(req.params.key)) return res.json({ type: "read", active: true });
  if (project.writeKeys.includes(req.params.key)) return res.json({ type: "write", active: true });
  if (project.masterKeys.includes(req.params.key)) return res.json({ type: "master", active: true });
  return res.status(404).json({ error: "KeyNotFoundError" });
}));

/**
* @api {post} /projects/:PROJECT_ID/keys/regenerate Regenerate a key
* @apiVersion 0.1.0
* @apiName RegenerateKey
* @apiGroup Keys
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/writeKey/masterKey The key to regenerate
* @apiHeader {String} Content-Type="application/json"
* @apiHeaderExample {json} Header Example:
* { "Content-Type": "application/json" }
* @apiParamExample {json} body Example:
*{
*   "readKey": "249c8ba8-68c8"
*}
* @apiSuccess {String} message Success Message.
* @apiSuccess {String} readKey/writeKey/masterKey The new key.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "message": "Key successfully regenerated!"
*       "readKey": "249c8ba8-6szdf"
*     }
* @apiUse ProjectNotFoundError
* @apiUse NoDataSentError
* @apiUse KeyNotFoundError
*/
router.post("/regenerate", requireAuth, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, (err2, project) => {
  if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
  const { readKey, writeKey, masterKey } = req.body;
  if (!readKey && !writeKey && !masterKey) return res.status(403).json({ error: "NoDataSentError" });
  if (readKey) {
    if (project.readKeys.includes(readKey)) {
      const newKey = uuid();
      project.readKeys[project.readKeys.indexOf(readKey)] = newKey;
      project.markModified("readKeys");
      return project.save((err3) => {
        if (err3) return res.status(500).json({ error: "Internal server error!", err: err3 });
        return res.json({ message: "Key successfully regenerated!", readKey: newKey });
      });
    }
  }
  if (writeKey) {
    if (project.writeKeys.includes(writeKey)) {
      const newKey = uuid();
      project.writeKeys[project.writeKeys.indexOf(writeKey)] = newKey;
      project.markModified("writeKeys");
      return project.save((err3) => {
        if (err3) return res.status(500).json({ error: "Internal server error!", err: err3 });
        return res.json({ message: "Key successfully regenerated!", writeKey: newKey });
      });
    }
  }
  if (masterKey) {
    if (project.masterKeys.includes(masterKey)) {
      const newKey = uuid();
      project.masterKeys[project.masterKeys.indexOf(masterKey)] = newKey;
      project.markModified("masterKeys");
      return project.save((err3) => {
        if (err3) return res.status(500).json({ error: "Internal server error!", err: err3 });
        return res.json({ message: "Key successfully regenerated!", masterKey: newKey });
      });
    }
  }
  return res.status(500).json({ error: "Internal server error!" });
}));

/**
 * @apiDefine AlreadyExistsError
 * @apiError AlreadyExistsError This payload already exists in this project.
 * @apiErrorExample {json} AlreadyExistsError:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "error": "AlreadyExistsError"
 *     }
 */
/**
* @api {post} /projects/:PROJECT_ID/keys/ Create a new key
* @apiVersion 0.1.0
* @apiName CreateKey
* @apiGroup Keys
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/writeKey/masterKey The new key
* @apiHeader {String} Content-Type="application/json"
* @apiHeaderExample {json} Header Example:
* { "Content-Type": "application/json" }
* @apiParamExample {json} body Example:
*{
*   "readKey": "249c8ba8-68c8"
*}
* @apiSuccess {String} message Success Message.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "message": "Key successfully generated!"
*     }
* @apiUse ProjectNotFoundError
* @apiUse NoDataSentError
* @apiUse KeyNotFoundError
* @apiUse AlreadyExistsError
*/
router.post("/", (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, (err2, project) => {
  if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
  const { readKey, writeKey, masterKey } = req.body;
  if (!readKey && !writeKey && !masterKey) return res.status(403).json({ error: "NoDataSentError" });
  if (readKey) {
    if (project.readKeys.includes(readKey)) return res.status(409).json({ error: "AlreadyExistsError" });
    project.readKeys.push(readKey);
    return project.save((err3) => {
      if (err3) return res.status(500).json({ message: "Internal server error!", err: err3 });
      return res.status(201).json({ message: "Key successfully created!" });
    });
  }
  if (writeKey) {
    if (project.writeKeys.includes(writeKey)) return res.status(409).json({ error: "AlreadyExistsError" });
    project.writeKeys.push(writeKey);
    return project.save((err3) => {
      if (err3) return res.status(500).json({ message: "Internal server error!", err: err3 });
      return res.status(201).json({ message: "Key successfully created!" });
    });
  }
  if (masterKey) {
    if (project.masterKeys.includes(masterKey)) return res.status(409).json({ error: "AlreadyExistsError" });
    project.masterKeys.push(masterKey);
    return project.save((err3) => {
      if (err3) return res.status(500).json({ message: "Internal server error!", err: err3 });
      return res.status(201).json({ message: "Key successfully created!" });
    });
  }
  return res.status(500).json({ message: "Internal server error!" });
}));

/**
* @api {delete} /projects/:PROJECT_ID/keys/:KEY Delete a specific key
* @apiVersion 0.1.0
* @apiName DeleteKey
* @apiGroup Keys
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} KEY An API key.
* @apiSuccess {String} message Success Message.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "message": "Key successfully deleted!"
*     }
* @apiUse ProjectNotFoundError
* @apiUse NoDataSentError
*/
router.delete("/:KEY", (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID}!`, err2 });
  }
  const key = req.params.KEY;
  if (!key) return res.status(403).json({ message: "No key sent!" });
  if (project.readKeys.includes(key)) project.readKeys.splice(project.readKeys.indexOf(key), 1);
  if (project.writeKeys.includes(key)) project.writeKeys.splice(project.writeKeys.indexOf(key), 1);
  if (project.masterKeys.includes(key)) project.masterKeys.splice(project.masterKeys.indexOf(key), 1);
  return project.save((err3) => {
    if (err3) return res.status(500).json({ message: "Internal server error!" });
    return res.json({ message: "Key successfully deleted!" });
  });
}));

module.exports = router;
