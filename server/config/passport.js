require("dotenv").config();
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);
const uuid = require("uuid");

const { Organization } = require("../models");

const Strategies = require("./strategies");

module.exports = (app) => {
	const sessionConfig = {
		store: new MongoStore({
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
		.then((organization) => done(null, organization))
		.catch((error) => console.warn(`err at deserialize: ${error}`)));

	passport.use(Strategies.local);
};
