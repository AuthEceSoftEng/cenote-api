const express = require("express");
const passport = require("passport");

const Organization = require("../models/Organization");

const router = express.Router();

router.post("/register", (req, res) => {
	if (!req || !req.body || !req.body.username || !req.body.password) return res.status(400).send({ message: "Username and Password required" });
	req.body.username = req.body.username.toLowerCase().trim();
	const { username } = req.body;
	const newOrganization = Organization(req.body);

	return Organization.find({ username }, (err, organizations) => {
		if (err) return res.status(400).send({ message: "Create organization failed", err });
		if (organizations[0]) return res.status(400).send({ message: "Username exists" });
		return newOrganization.hashPassword().then(() => {
			newOrganization.save((err2, savedOrganization) => {
				if (err2 || !savedOrganization) return res.status(400).send({ message: "Create organization failed", err2 });
				return res.send({ message: "Organization created successfully", organization: savedOrganization.hidePassword() });
			});
		});
	});
});

router.post("/login", (req, res, next) => {
	req.body.username = req.body.username.toLowerCase().trim();
	passport.authenticate("local", (err, organization, info) => {
		if (err) return next(err);
		if (info && info.message === "Missing credentials") return res.status(401).send({ message: "Missing credentials" });
		if (!organization) return res.status(401).send(info);
		return req.login(organization, (err2) => {
			if (err2) return res.status(401).send({ message: "Login failed", err2 });
			return res.send({ message: "Logged in successfully", organization: organization.hidePassword() });
		});
	})(req, res, next);
});

router.post("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) return res.status(400).send({ message: "Logout failed", err });
		req.sessionID = null;
		req.logout();
		return res.send({ message: "Logged out successfully" });
	});
});

module.exports = router;
