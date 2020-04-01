const express = require("express");
const path = require("path");
const auth = require("./auth");
const organization = require("./organization");
const organizations = require("./organizations");
const projects = require("./projects");

const router = express.Router();

router.use("/api/auth", auth);
router.use("/api/organization", organization);
router.use("/api/projects", projects);
router.use("/api/organizations", organizations);

router.get("/works", (req, res) => res.send("<h1 align=\"center\">It does!</h1>"));

const docs = path.join(__dirname, "../../docs");
router.use("/docs", express.static(docs));
router.get("/docs/*", (req, res) => res.sendFile("index.html", { root: docs }));

const client = path.join(__dirname, "../../client/dist");
router.use(express.static(client));
router.get("/*", (req, res) => res.sendFile("index.html", { root: client }));

module.exports = router;
