const path = require("path");
const express = require("express");
const execa = require("execa");

const { requireAuth } = require("./middleware");

const router = express.Router();

router.get("/update", requireAuth, (req, res) => {
  const args = [
    req.params.PROJECT_ID,
  ];
  return execa("python3", [path.join(__dirname, "../python/alter_table.py")].concat(args))
    .then(({ stdout, code }) => res.json({ stdout, code }))
    .catch(err => res.status(404).json({ ok: false, error: err }));
});

module.exports = router;
