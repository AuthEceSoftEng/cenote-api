module.exports = (arr) => arr.reduce((acc, obj) => {
	// eslint-disable-next-line no-return-assign
	Object.keys(obj).forEach((k) => acc[k] = (acc[k] || []).concat(obj[k]));
	return acc;
}, {});
