module.exports = (str) => {
	try {
		return (JSON.parse(str) && !!str);
	} catch {
		return false;
	}
};
