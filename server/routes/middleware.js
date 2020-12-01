// eslint-disable-next-line no-negated-condition
const requireAuth = (req, res, next) => (!req.user ? res.status(401).send({ ok: false, results: "KeyNotAuthorizedError" }) : next());

const canAccessForCollection = (req, res, next) => {
	if (!req.query.readKey && !req.query.masterKey) return res.status(403).json({ ok: false, results: "NoCredentialsSentError" });
	if (!req.query.event_collection) return res.status(400).json({ ok: false, results: "No `event_collection` param provided!" });
	return next();
};

const hasWriteAccess = (req, res, next) => ((!req.query.writeKey && !req.query.masterKey)
	? res.status(403).json({ ok: false, results: "NoCredentialsSentError" })
	: next());

module.exports = { requireAuth, canAccessForCollection, hasWriteAccess };
