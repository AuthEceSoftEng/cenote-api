const express = require("express");
const { Pool } = require("pg");
const asyncRedis = require("async-redis");
const { requireAuth } = require("./middleware");
const { Project, Organization } = require("../models");
const queries = require("./queries");
const keys = require("./keys");
const alter = require("./alter");

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

router.get("/", requireAuth, (req, res) => {
  Project.find({ $or: [{ organization: req.user._id }, { collaborators: req.user._id }] }).populate("organization").exec((err, projects) => {
    if (err) return res.status(400).send({ message: "Get projects failed", err });
    projects = projects.map((project) => {
      project = project.toObject();
      project.owner = project.organization.username;
      delete project.organization;
      return project;
    });
    return res.send({ message: "Projects retrieved successfully", projects });
  });
});

router.post("/", requireAuth, (req, res) => {
  req.body.organization = req.user.id;
  const newProject = Project(req.body);
  newProject.save((err, savedProject) => {
    if (err) return res.status(400).send({ message: "Create project failed", err });
    return res.send({ message: "Project created successfully", project: savedProject.hide() });
  });
});

router.post("/project", requireAuth, (req, res) => {
  Project.findOne({ projectId: req.body.projectId }).populate("organization").exec((err, project) => {
    if (err) return res.status(400).send({ message: "Toggle project failed", err });
    project = project.hide();
    project.owner = project.organization.username;
    delete project.organization;
    return res.send({ message: "Toggled complete project successfully", project });
  });
});

router.get("/:PROJECT_ID/collaborators", requireAuth, (req, res) => {
  Project.findOne({ projectId: req.params.PROJECT_ID }).populate("collaborators").exec((err, project) => {
    if (err) return res.status(400).send({ message: "Get project failed", err });
    return res.send({
      message: "Collaborators retrieved successfully",
      collaborators: project.collaborators.map(el => ({ username: el.username, _id: el._id })) || [],
    });
  });
});

router.put("/:PROJECT_ID/collaborator", async (req, res) => {
  const { username } = req.body;
  if (!username) res.status(400).send({ message: "Update project failed", err: "`username` is required!" });
  if (!Array.isArray(username)) res.status(400).send({ message: "Update project failed", err: "Expected array of collaborators!" });
  const newArray = [];
  for (const usrname of username) {
    const collaborator = await Organization.findOne({ username: usrname }, "-__v").exec();
    if (!collaborator) return res.status(404).json({ message: "Collaborator not found!" });
    newArray.push(collaborator._id);
  }
  return Project.findOneAndUpdate({ projectId: req.params.PROJECT_ID },
    { collaborators: newArray }, (err, savedProject) => {
      if (err) return res.status(400).send({ message: "Update project failed", err });
      return res.send({ message: "Updated project successfully", project: savedProject.hide() });
    });
});

router.put("/", requireAuth, (req, res) => {
  Project.findOneAndUpdate({ projectId: req.body.projectId },
    { ...req.body, updatedAt: Date.now() }, { __v: 0, organization: 0 }, (err, savedProject) => {
      if (err) return res.status(400).send({ message: "Update project failed", err });
      return res.send({ message: "Updated project successfully", project: savedProject.hide() });
    });
});

router.delete("/", requireAuth, (req, res) => {
  const { projectId } = req.body;
  Project.deleteOne({ projectId }, (err) => {
    if (err) return res.status(400).send({ message: "Delete project failed", err });
    const selectQuery = "SELECT * from information_schema.columns WHERE table_schema='public'";
    client.query(selectQuery)
      .then(({ rows: answer }) => {
        answer.filter(el => el.table_name.startsWith(projectId)).forEach((prop) => {
          const renameTableQuery = `ALTER TABLE IF EXISTS ${prop.table_name} RENAME TO deleted_${prop.table_name}_${Date.now()}`;
          client.query(renameTableQuery);
          const redisKey = `${prop.table_name}_${prop.column_name}`;
          r.del(redisKey);
          r.del(`${redisKey}_hist`);
        });
      })
      .catch(err3 => res.status(400).json({ ok: false, results: "BadQueryError", message: err3.message }));
    return res.send({ message: "Project successfully deleted" });
  });
});

router.use("/:PROJECT_ID/queries", queries);
router.use("/:PROJECT_ID/keys", keys);
router.use("/:PROJECT_ID/alter", alter);
if (process.env.NODE_ENV !== "test") router.use("/:PROJECT_ID/events", require("./events"));

module.exports = router;
