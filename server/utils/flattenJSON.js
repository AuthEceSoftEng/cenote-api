module.exports = (data) => {
	const result = {};
	function recurse(cur, prop) {
		// eslint-disable-next-line no-new-object
		if (new Object(cur) !== cur) {
			result[prop] = cur;
		} else if (Array.isArray(cur)) {
			const l = cur.length;
			for (let i = 0; i < l; i += 1) recurse(cur[i], prop ? `${prop}💩array${i}` : `array${i}`);
			if (l === 0) result[prop] = [];
		} else {
			let isEmpty = true;
			for (const p of Object.keys(cur)) {
				isEmpty = false;
				recurse(cur[p], prop ? `${prop}💩${p}` : p);
			}
			if (isEmpty) { result[prop] = {}; }
		}
	}
	recurse(data, "");
	return result;
};
