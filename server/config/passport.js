require("dotenv").config();
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);
const uuid = require("uuid");
const mongoose = require("mongoose");

const Strategies = require("./strategies");
const { Organization } = require("../models");

module.exports = (app) => {
  const sessionConfig = {
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      collection: "sessions",
      uri: process.env.DATABASE_STORE,
    }),
    genid: () => uuid.v4(),
    cookie: { secure: false },
    secret: process.env.COOKIE_SECRET || "cenote-secret",
    resave: false,
    saveUninitialized: false,
  };

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((organization, done) => done(null, organization.id));

  passport.deserializeUser((id, done) => Organization.findById({ _id: id })
    .then(organization => done(null, organization))
    .catch(err => console.warn(`err at deserialize: ${err}`)));

  passport.use(Strategies.local);
};
