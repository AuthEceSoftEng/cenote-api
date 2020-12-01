const LocalStrategy = require("passport-local").Strategy;

const { Organization } = require("../models");

const Strategies = module.exports;

Strategies.local = new LocalStrategy((username, password, done) => {
	Organization.findOne({ username }, (err, organization) => {
		if (err) { return done(err); }
		if (!organization) {
			return done(null, false, { message: "Username doesn't exist" });
		}
		if (!organization.validPassword(password)) {
			return done(null, false, { message: "Incorrect username or password" });
		}
		return done(null, organization);
	});
});
