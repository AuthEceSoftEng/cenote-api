/* eslint-disable max-len */
const express = require("express");
const { Pool, types } = require("pg");
const asyncRedis = require("async-redis");
const moment = require("moment");

const { Project } = require("../models");
const { requireAuth, canAccessForCollection } = require("./middleware");
const {
  isJSON,
  applyFilter,
  parseTimeframe,
  groupBy,
  getFilterQuery,
  groupByInterval,
  percentile: percentle,
  getRemoveOutliersQuery,
  toObjectOfArrays,
} = require("../utils");

const router = express.Router({ mergeParams: true });
const client = new Pool({
  user: "cockroach",
  host: process.env.COCKROACH_URL,
  database: process.env.COCKROACH_DBNAME || "cenote",
  port: process.env.COCKROACH_PORT || 26257,
});
client.connect(err => err && console.error(err));
types.setTypeParser(20, val => parseFloat(val, 10)); // 20 -> int8 (for count, min, etc)
types.setTypeParser(1700, val => parseFloat(val, 10)); // 1700 -> numeric
types.setTypeParser(1114, val => moment(val).valueOf()); // 1114 -> timestamp
const r = asyncRedis.createClient({ host: process.env.REDIS_URL, port: process.env.REDIS_PORT || 6379, password: process.env.REDIS_PASSWORD });
r.on("error", err => console.error(`Redis error: ${err}`));

/**
 * @apiDefine BadQueryError
 * @apiError BadQueryError The query can't be executed
 * @apiErrorExample {json} BadQueryError:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "results": "BadQueryError",
 *       "message": "<The error that occured>"
 *     }
 */
/**
 * @apiDefine TargetNotProvidedError
 * @apiError TargetNotProvidedError The `target_property` parameter must be provided.
 * @apiErrorExample {json} TargetNotProvidedError:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "TargetNotProvidedError"
 *     }
 */
/**
* @api {get} /projects/:PROJECT_ID/queries/count Count
* @apiVersion 0.1.0
* @apiName QueryCount
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "count": 153
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/count", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, group_by, latest, interval, outliers, outliers_in } = req.query;
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} COUNT(*)`} FROM ${req.params.PROJECT_ID}_${event_collection
      } ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by ? `GROUP BY ${group_by}` : ""} LIMIT ${latest
        || req.app.locals.GLOBAL_LIMIT}`;
      const { rows: answer } = await client.query(query);
      let results = JSON.parse(JSON.stringify(answer).replace(/system\.\w*\(|\)/g, ""));
      if (interval) results = groupByInterval(results, interval, "count");
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/minimum Minimum
* @apiVersion 0.1.0
* @apiName QueryMin
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "min": 0.0001
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/minimum", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, target_property, group_by, latest, interval, outliers, outliers_in } = req.query;
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} MIN("${target_property}")`} FROM ${req.params.PROJECT_ID
      }_${event_collection} ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by ? `GROUP BY ${group_by}` : ""} LIMIT ${
        latest || req.app.locals.GLOBAL_LIMIT}`;
      const { rows: answer } = await client.query(query);
      let results = JSON.parse(JSON.stringify(answer).replace(/system\.\w*\(|\)/g, ""));
      if (interval) results = groupByInterval(results, interval, "minimum", target_property);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/maximum Maximum
* @apiVersion 0.1.0
* @apiName QueryMax
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "max": 9.999
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/maximum", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, target_property, group_by, latest, interval, outliers, outliers_in } = req.query;
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} MAX("${target_property}")`} FROM ${req.params.PROJECT_ID
      }_${event_collection} ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by ? `GROUP BY ${group_by}` : ""} LIMIT ${
        latest || req.app.locals.GLOBAL_LIMIT}`;
      const { rows: answer } = await client.query(query);
      let results = JSON.parse(JSON.stringify(answer).replace(/system\.\w*\(|\)/g, ""));
      if (interval) results = groupByInterval(results, interval, "maximum", target_property);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/sum Sum
* @apiVersion 0.1.0
* @apiName QuerySum
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "sum": 337231
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/sum", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, target_property, group_by, latest, interval, outliers, outliers_in } = req.query;
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} SUM("${target_property}")`} FROM ${req.params.PROJECT_ID
      }_${event_collection} ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by ? `GROUP BY ${group_by}` : ""} LIMIT ${
        latest || req.app.locals.GLOBAL_LIMIT}`;
      const { rows: answer } = await client.query(query);
      let results = JSON.parse(JSON.stringify(answer).replace(/system\.\w*\(|\)/g, ""));
      if (interval) results = groupByInterval(results, interval, "sum", target_property);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/average Average
* @apiVersion 0.1.0
* @apiName QueryAvg
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "avg":  1.92
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/average", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, target_property, group_by, latest, interval, outliers, outliers_in } = req.query;
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} AVG("${target_property}")`} FROM ${req.params.PROJECT_ID
      }_${event_collection} ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by ? `GROUP BY ${group_by}` : ""} LIMIT ${
        latest || req.app.locals.GLOBAL_LIMIT}`;
      const { rows: answer } = await client.query(query);
      let results = JSON.parse(JSON.stringify(answer).replace(/system\.\w*\(|\)/g, ""));
      if (interval) results = groupByInterval(results, interval, "average", target_property);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/median Median
* @apiVersion 0.1.0
* @apiName QueryMedian
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "median":  1.1
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/median", canAccessForCollection, (req, res) => {
  req.url = "/percentile";
  req.query = { ...req.query, percentile: 50, isMedian: true };
  return router.handle(req, res);
});

/**
* @api {get} /projects/:PROJECT_ID/queries/percentile Percentile
* @apiVersion 0.1.0
* @apiName QueryPercentile
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number{0-100}} percentile Desired percentile.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "percentile": 0.945
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/percentile", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, target_property, percentile, group_by, latest, interval, outliers, outliers_in } = req.query;
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!percentile) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${group_by || interval ? "*" : `"${target_property}"`} FROM ${req.params.PROJECT_ID}_${event_collection} ${timeframeQuery
      } ${removeOutliersQuery} ${filterQuery} LIMIT ${latest || req.app.locals.GLOBAL_LIMIT}`;
      let { rows: answer } = await client.query(query);
      filters.forEach(filter => answer = applyFilter(filter, answer));
      let results = [];
      if (!interval && !group_by) {
        results.push({
          [req.query.isMedian ? "median" : "percentile"]: percentle(answer.map(el => el[target_property]),
            percentile),
        });
      } else if (!interval && group_by) {
        if (!Object.keys(answer[0]).includes(group_by)) throw Object({ message: `column "${group_by}" does not exist` });
        results = groupBy(answer, group_by, "percentile", target_property, percentile).map((el) => {
          delete Object.assign(el, { [req.query.isMedian ? "median" : "percentile"]: el.result }).result;
          return el;
        });
      } else if (interval) {
        results = groupByInterval(answer, interval, "percentile", target_property, percentile);
      }
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/count_unique Count Unique
* @apiVersion 0.1.0
* @apiName QueryCountUnique
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "voltage": 9
*            }
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse BadQueryError
*/
router.get("/count_unique", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError", err: err2 });
      const { readKey, masterKey, event_collection, target_property, latest, group_by, interval, outliers, outliers_in } = req.query;
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} COUNT(DISTINCT "${target_property}")`} FROM ${req.params.PROJECT_ID
      }_${event_collection} ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by ? `GROUP BY ${group_by}` : ""} LIMIT ${
        latest || req.app.locals.GLOBAL_LIMIT}`;
      let { rows: answer } = await client.query(query);
      filters.forEach(filter => answer = applyFilter(filter, answer));
      let results = answer;
      if (interval) results = groupByInterval(results, interval, "count_unique", target_property);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/select_unique Select Unique
* @apiVersion 0.1.0
* @apiName QuerySelectUnique
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {String} [group_by] Group by a property.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {String=minutely,hourly,daily,weekly,monthly,yearly} [interval] Group by a time interval.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            1.1,
*            4.546,
*            8.637,
*            ...
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse BadQueryError
*/
router.get("/select_unique", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError", err: err2 });
      const { readKey, masterKey, event_collection, target_property, latest, group_by, interval, outliers, outliers_in } = req.query;
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${interval ? "*" : `${group_by ? `${group_by},` : ""} ARRAY_AGG(DISTINCT "${target_property}") AS "${target_property}"`
      } FROM ${req.params.PROJECT_ID}_${event_collection} ${timeframeQuery} ${removeOutliersQuery} ${filterQuery} ${!interval && group_by
        ? `GROUP BY ${group_by}` : ""} LIMIT ${latest || req.app.locals.GLOBAL_LIMIT}`;
      let { rows: answer } = await client.query(query);
      filters.forEach(filter => answer = applyFilter(filter, answer));
      let results = answer;
      if (interval) results = groupByInterval(results, interval, "select_unique", target_property);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/extraction Data Extraction
* @apiVersion 0.1.0
* @apiName QueryExtraction
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} [target_property] Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {String='include', 'exclude', 'only'} [outliers='include'] Toggle inclusion/exclusion of outlier values.
* Must provide `outliers_in`, if used.
* @apiParam {String} [outliers_in] Desired property for outlier detection.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties are flattened using
* '$' as separator.
* @apiParam {Object[]="[{'property_name':'A column name','operator': 'eq'|'gt'|'gte'|'lt'|'lte'|'ne','property_value':'Some value'},...]"} [filters]
* Apply custom filters.
* @apiParam {Object/String="{'start':ISOString, 'end':ISOString}", "[this|previous]_[n]_[seconds|minutes|days|...]"} [timeframe] Specify a timeframe.
* @apiParam {Number} [latest=5000] Limit events taken into account.
* @apiParam {Boolean=true,false} [concat_results=false] Transforms `results` array of objects to an object of arrays.<br/><strong><u>Note: </u></strong>
* If object keys are not identical, resulting arrays may differ in size.
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": [
*            {
*               "voltage": 153,
*               "current": 3,
*               "Note": "A note",
*            },
*            {
*               "voltage": 123,
*               "current": 9,
*               "Note": "A note",
*            },
*            ...
*       ]
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/extraction", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError", err: err2 });
      const { readKey, masterKey, event_collection, target_property, latest, outliers, outliers_in, concat_results } = req.query;
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }
      let removeOutliersQuery = "";
      if (["exclude", "only"].includes(outliers)) {
        if (!outliers_in) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
        removeOutliersQuery += await getRemoveOutliersQuery(r, `${req.params.PROJECT_ID}_${event_collection}`, outliers_in, outliers);
      }
      const filters = isJSON(req.query.filters) ? JSON.parse(req.query.filters) : [];
      const timeframeQuery = parseTimeframe(req.query.timeframe);
      const filterQuery = getFilterQuery(filters);
      const query = `SELECT ${target_property ? `${target_property.split(",").map(el => `"${el}"`)}` : "*"} FROM ${req.params.PROJECT_ID}_${event_collection} ${timeframeQuery
      } ${removeOutliersQuery} ${filterQuery} ORDER BY "cenote$timestamp" DESC LIMIT ${latest || req.app.locals.GLOBAL_LIMIT}`;
      const { rows: answer } = await client.query(query);
      let results = answer;
      filters.forEach(filter => results = applyFilter(filter, results));
      if (concat_results) results = toObjectOfArrays(results);
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

/**
* @api {get} /projects/:PROJECT_ID/queries/eeris eeRIS Historical Average
* @apiVersion 0.1.0
* @apiName eerisHistAvg
* @apiGroup Queries
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} readKey/masterKey Key for authorized read.
* @apiParam {String} event_collection Event collection.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} target_property Desired Event collection's property.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} installationId ID of the installation
* @apiParam {String} type Type of query (week, month, day)
* @apiParam {String} dt Date of specific day in case of day query. Format: YYYY-MM-DD
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 SUCCESS
*     {
*       "ok": true
*       "results": {
          "values": [...],
          "stats": {
            "avg": 50,
            "min": 10,
            "max": 100
          }
        }
    }
*     }
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse ProjectNotFoundError
* @apiUse TargetNotProvidedError
* @apiUse BadQueryError
*/
router.get("/eeris", canAccessForCollection, (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }).lean()
  .exec(async (err2, project) => {
    try {
      if (err2 || !project) return res.status(404).json({ ok: false, results: "ProjectNotFoundError" });
      const { readKey, masterKey, event_collection, target_property, type, dt } = req.query;
      if (!target_property) return res.status(400).json({ ok: false, results: "TargetNotProvidedError" });
      if (!(readKey === project.readKey || masterKey === project.masterKey)) {
        return res.status(401).json({ ok: false, results: "KeyNotAuthorizedError" });
      }

      const keyName = `${req.params.PROJECT_ID}_${event_collection}_${target_property}_hist`;
      const date = dt ? new Date(dt) : new Date();
      const values = [];
      const stats = {};
      switch (type) {
        case "week": {
          const value = await r.get(keyName);
          const jsonValue = JSON.parse(value);
          stats.avg = 0;
          stats.min = Number.POSITIVE_INFINITY;
          stats.max = Number.NEGATIVE_INFINITY;
          let count = 0;
          let sum = 0;
          for (let i = 0; i < 7; i += 1) {
            const year = date.getFullYear();
            const month = (`0${date.getMonth() + 1}`).slice(-2);
            const day = (`0${date.getDate()}`).slice(-2);
            count += jsonValue[`count_${year}-${month}-${day}`] || 0;
            sum += jsonValue[`sum_${year}-${month}-${day}`] || 0;
            const avg = jsonValue[`avg_${year}-${month}-${day}`] || 0;
            const min = jsonValue[`min_${year}-${month}-${day}`] || 0;
            const max = jsonValue[`max_${year}-${month}-${day}`] || 0;
            values.unshift(avg);
            if (min < stats.min && min !== 0) stats.min = min;
            if (max > stats.max) stats.max = max;
            date.setDate(date.getDate() - 1);
          }
          stats.avg = sum / count;
          break;
        }
        case "month": {
          const value = await r.get(keyName);
          const jsonValue = JSON.parse(value);
          const year = date.getFullYear();
          const month = (`0${date.getMonth() + 1}`).slice(-2);
          stats.avg = jsonValue[`avg_${year}-${month}`] || 0;
          stats.min = jsonValue[`min_${year}-${month}`] || 0;
          stats.max = jsonValue[`max_${year}-${month}`] || 0;
          while (date.getMonth() === new Date().getMonth()) {
            const day = (`0${date.getDate()}`).slice(-2);
            values.unshift(jsonValue[`avg_${year}-${month}-${day}`] || 0);
            date.setDate(date.getDate() - 1);
          }
          break;
        }
        case "day": {
          const value = await r.get(keyName);
          const jsonValue = JSON.parse(value);
          date.setHours(0);
          const year = date.getFullYear();
          const month = (`0${date.getMonth() + 1}`).slice(-2);
          while (date.getDate() === new Date(dt).getDate()) {
            const day = (`0${date.getDate()}`).slice(-2);
            const hours = (`0${date.getHours()}`).slice(-2);
            values.push(jsonValue[`avg_${year}-${month}-${day}_${hours}`] || 0);
            date.setTime(date.getTime() + (60 * 60 * 1000));
          }
          stats.avg = jsonValue[`avg_${dt}`] || 0;
          stats.min = jsonValue[`min_${dt}`] || 0;
          stats.max = jsonValue[`max_${dt}`] || 0;
          break;
        }
        default:
          return res.status(400).json({ ok: false, results: "BadQueryError", message: "Wrong or missing `type` parameter" });
      }

      const results = { values, stats };
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
    }
  }));

router.get("/collections", requireAuth, (req, res) => {
  const query = "SELECT * from information_schema.columns WHERE table_schema='public'";
  return client.query(query)
    .then(({ rows: answer }) => {
      const results = {};
      answer.filter(el => el.table_name.startsWith(req.params.PROJECT_ID)).forEach((prop) => {
        if (prop.column_name === "rowid") return;
        const collection = prop.table_name.split("_")[1];
        if (!results[collection]) results[collection] = [];
        results[collection].push({ column_name: prop.column_name, type: prop.crdb_sql_type });
      });
      res.json(results);
    })
    .catch(err3 => res.status(400).json({ ok: false, results: "BadQueryError", message: err3.message }));
});

router.put("/addColumn", requireAuth, (req, res) => {
  const query = `ALTER TABLE ${req.params.PROJECT_ID}_${req.body.event_collection} ADD COLUMN IF NOT EXISTS "${req.body.name}" ${req.body.type}`;
  return client.query(query)
    .then(() => res.status(204).json({ ok: true }))
    .catch(err3 => res.status(400).json({ ok: false, results: "BadQueryError", message: err3.message }));
});

router.delete("/dropColumn", requireAuth, async (req, res) => {
  try {
    const query = `ALTER TABLE ${req.params.PROJECT_ID}_${req.body.event_collection} DROP COLUMN IF EXISTS "${req.body.columnToDrop}"`;
    const redisKey = `${req.params.PROJECT_ID}_${req.body.event_collection}_${req.body.columnToDrop}`;
    await client.query(query);
    await r.del(redisKey);
    await r.del(`${redisKey}_hist`);
    return res.status(202).json({ ok: true });
  } catch (error) {
    return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
  }
});

router.delete("/dropTable", requireAuth, async (req, res) => {
  try {
    const queryForKeys = `SHOW COLUMNS FROM ${req.params.PROJECT_ID}_${req.body.event_collection}`;
    const columns = (await client.query(queryForKeys)).rows
      .filter(el => !el.column_name.startsWith("cenote") && el.data_type.toLowerCase() === "decimal").map(el => el.column_name);
    for (const column of columns) {
      const redisKey = `${req.params.PROJECT_ID}_${req.body.event_collection}_${column}`;
      await r.del(redisKey);
      await r.del(`${redisKey}_hist`);
    }
    const query = `ALTER TABLE IF EXISTS ${req.params.PROJECT_ID}_${req.body.event_collection} RENAME TO deleted_${req.params.PROJECT_ID}_${req.body.event_collection}`;
    await client.query(query);
    return res.status(202).json({ ok: true });
  } catch (error) {
    return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
  }
});

router.delete("/testCleanup", async (req, res) => {
  try {
    const { eventCollection } = req.query;
    const queryForKeys = `SHOW COLUMNS FROM ${req.params.PROJECT_ID}_${eventCollection}`;
    const columns = (await client.query(queryForKeys)).rows
      .filter(el => !el.column_name.startsWith("cenote") && el.data_type.toLowerCase() === "decimal").map(el => el.column_name);
    for (const column of columns) {
      const redisKeyDefault = `${req.params.PROJECT_ID}_${eventCollection}_${column}`;
      const redisKeyeeRIS = `${req.params.PROJECT_ID}_${eventCollection}_${column}_hist`;
      await r.del(redisKeyDefault);
      await r.del(redisKeyeeRIS);
    }
    const query = `DROP TABLE IF EXISTS ${req.params.PROJECT_ID}_${eventCollection}`;
    client.query(query);
    return res.status(204).json({ ok: true });
  } catch (error) {
    return res.status(400).json({ ok: false, results: "BadQueryError", message: error.message });
  }
});

router.all("/*", (req, res) => res.status(400).json({ ok: false, results: "This is not a valid query!" }));

/**
* @api {get} /projects/:PROJECT_ID/queries/sum?event_collection=measurements&group_by=current&filters=[{"property_name":"voltage","operator":"ne","property_value":241}]&outliers=exclude&outliers_in=current&timeframe={"start":"2019-05-10T00:00:00.0Z","end":"2019-05-10T13:10:03.0Z"}&readKey=:READ_KEY&target_property=voltage Sum
* @apiVersion 0.1.0
* @apiName Example
* @apiGroup Example
* @apiSuccess {Boolean} ok If the query succeded.
* @apiSuccess {Array} results Query result.
* @apiSuccessExample {json} Success-Response:
* {"ok": true, "results": [{"current": 21.5,"sum": 9850},{"current": 8.5,"sum": 9500},{"current": 7.5,"sum": 10000},{"current": 9.25,"sum": 10025}]}
*/

module.exports = router;
