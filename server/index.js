require("dotenv").config();
const chalk = require("chalk");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const compression = require("compression");
const morgan = require("morgan");

const routes = require("./routes");
const configPassport = require("./config/passport");

const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

if (process.env.DATABASE_URL.includes("authSource")) {
  mongooseOptions.user = process.env.DATABASE_USER;
  mongooseOptions.pass = process.env.DATABASE_PASS;
  mongooseOptions.auth = { authSource: process.env.DATABASE_AUTH_DB };
}

const db = `${(process.env.DATABASE_URL || "mongodb://localhost:27017/cenote-db").split("?")[0]}`;
mongoose.connect(db, mongooseOptions).catch(err => console.error(err.message));

const app = express();

if (process.env.NODE_ENV !== "test") app.use(morgan("dev", { skip(req) { return req.originalUrl.includes("/docs/"); } }));
app.use(compression());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.locals.GLOBAL_LIMIT = process.env.GLOBAL_LIMIT || 5000;
configPassport(app);

app.use("/", routes);

const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";
if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i += 1) cluster.fork();
  if (process.env.NODE_ENV !== "test") console.log(chalk.bold.cyan(`>>> Live at http://${host}:${port}`));
  cluster.on("exit", (worker) => {
    console.log(`Worker: ${worker.id} died. Trying to restart it...`);
    cluster.fork();
  });
} else {
  app.listen(port, host);
}

module.exports = app;
