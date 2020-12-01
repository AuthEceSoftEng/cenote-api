const chrono = require("chrono-node");
const moment = require("moment");

const isJSON = require("./isJSON");

module.exports = (timeframe) => {
	const now = moment();
	if (isJSON(timeframe)) {
		const time = JSON.parse(timeframe);
		return `WHERE ${moment(time.start).toISOString(true) ? `"cenote$timestamp" >= '${moment(time.start).toISOString(true)}' AND` : ""
		} "cenote$timestamp" <= '${moment(time.end || undefined).toISOString(true)}'`;
	}
	if (!timeframe || typeof timeframe !== "string" || timeframe.split("_").length !== 3) {
		return `WHERE "cenote$timestamp" <= '${now.toISOString(true)}'`;
	}
	timeframe = timeframe.split("_");
	const nlpDate = `${timeframe[1]} ${timeframe[2]} ago`;
	const jsDate = moment(chrono.parseDate(nlpDate, now.toDate()));
	return `WHERE "cenote$timestamp" >= '${jsDate.toISOString(true)}' AND "cenote$timestamp" ${timeframe[0] === "this" ? "<=" : "<"} '${
		now.toISOString(true)}'`;
};
