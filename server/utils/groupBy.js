const percentile = require("./percentile");

module.exports = (items, key, wayOfGrouping, target = "", p = 100) => {
	const tmp = items.reduce((result, item) => ({ ...result, [item[key]]: [...(result[item[key]] || []), item] }), {});
	const results = [];
	if (wayOfGrouping === "count") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: tmp[value].length }));
	} else if (wayOfGrouping === "minimum") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: Math.min(...tmp[value].map((el) => el[target])) }));
	} else if (wayOfGrouping === "maximum") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: Math.max(...tmp[value].map((el) => el[target])) }));
	} else if (wayOfGrouping === "sum") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: tmp[value].map((el) => el[target]).reduce((a, b) => a + b, 0) }));
	} else if (wayOfGrouping === "average") {
		Object.keys(tmp).forEach((value) => results.push({
			[key]: value,
			result: tmp[value].map((el) => el[target]).reduce((a, b) => a + b, 0) / tmp[value].length,
		}));
	} else if (wayOfGrouping === "median") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: percentile(tmp[value].map((el) => el[target]), 50) }));
	} else if (wayOfGrouping === "percentile") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: percentile(tmp[value].map((el) => el[target]), p) }));
	} else if (wayOfGrouping === "count_unique") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: [...new Set(tmp[value].map((el) => el[target]))].length }));
	} else if (wayOfGrouping === "select_unique") {
		Object.keys(tmp).forEach((value) => results.push({ [key]: value, result: [...new Set(tmp[value].map((el) => el[target]))] }));
	}
	return results.length ? results : items;
};
