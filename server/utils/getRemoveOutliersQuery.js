module.exports = async (r, tableName, propertyName, outlierSetting) => {
	const redisKey = `${tableName}_${propertyName}`;
	const { ODV2L, ODV2U } = JSON.parse(await r.get(redisKey));

	return outlierSetting === "exclude"
		? `AND (${propertyName} <= ${ODV2U} AND ${propertyName} >= ${ODV2L})`
		: `AND (${propertyName} > ${ODV2U} OR ${propertyName} < ${ODV2L})`;
};
