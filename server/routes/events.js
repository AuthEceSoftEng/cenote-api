const express = require("express");
const { KafkaClient, Producer } = require("kafka-node");
const uuid = require("uuid/v4");
const moment = require("moment");

const { Project } = require("../models");
const { flattenJSON, isObject } = require("../utils");

const router = express.Router({ mergeParams: true });

const producer = new Producer(new KafkaClient({ kafkaHost: process.env.KAFKA_SERVERS }), { requireAcks: 0, partitionerType: 2 });
producer.on("error", error => console.error(error));

/**
 * @apiDefine ProjectNotFoundError
 * @apiError ProjectNotFoundError The id of the Project was not found.
 * @apiErrorExample {json} ProjectNotFoundError:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "ProjectNotFoundError"
 *     }
 */
/**
* @apiDefine NoCredentialsSentError
* @apiError NoCredentialsSentError No key credentials sent.
* @apiErrorExample {json} NoCredentialsSentError:
*     HTTP/1.1 403 Forbidden
*     {
*       "error": "NoCredentialsSentError"
*     }
*/
/**
* @apiDefine KeyNotAuthorizedError
* @apiError KeyNotAuthorizedError Key hasn't authorization.
* @apiErrorExample {json} KeyNotAuthorizedError:
*     HTTP/1.1 401 Unauthorized
*     {
*       "error": "KeyNotAuthorizedError"
*     }
*/
/**
* @apiDefine NoDataSentError
* @apiError NoDataSentError No data sent.
* @apiErrorExample {json} NoDataSentError:
*     HTTP/1.1 400 Bad Request
*     {
*       "error": "NoDataSentError"
*     }
*/
/**
* @apiDefine InvalidCollectionNameError
* @apiError InvalidCollectionNameError Wrong collection name used.
* @apiErrorExample {json} InvalidCollectionNameError:
*     HTTP/1.1 400 Bad Request
*     {
*       "error": "InvalidCollectionNameError"
*     }
*/
/**
* @apiDefine InvalidPropertyNameError
* @apiError InvalidPropertyNameError Wrong property name used.
* @apiErrorExample {json} InvalidPropertyNameError:
*     HTTP/1.1 400 Bad Request
*     {
*       "error": "InvalidPropertyNameError"
*     }
*/
/**
* @api {post} /projects/:PROJECT_ID/events/:EVENT_COLLECTION?writeKey=:WRITE_KEY&MASTER_KEY=:MASTER_KEY Record events
* @apiVersion 0.1.0
* @apiName RecordEvents
* @apiGroup Events
* @apiHeader {String} Content-Type="application/json"
* @apiHeaderExample {json} Header Example:
* { "Content-Type": "application/json" }
* @apiParam {String} PROJECT_ID Project's unique ID.
* @apiParam {String} EVENT_COLLECTION The event collection name.<br/><strong><u>Note:</u></strong> Event collection names must start with a
* letter and can contain only lowercase letters and numbers.
* @apiParam {String} WRITE_KEY/MASTER_KEY Key for authorized write.
* @apiParam {Object/Object[]} payload Event data.<br/><strong><u>Note:</u></strong> Property names must start with a
* letter and can contain only lowercase letters and numbers.<br/><strong><u>Note:</u></strong> Nested properties will be flattened using
* '$' as separator.<br/><strong><u>WARNING:</u></strong> `timestamp` is treated as milliseconds!
* @apiParamExample {json} payload Example:
* {"payload": [{"data": {"current": 7.5,"voltage": 10000,"note": "That's weird."},"timestamp": 1549622362926}]}
* @apiSuccess (Accepted 202) {String} message Success Message.
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 202 ACCEPTED
*     {
*       "message": "Event Sent."
*     }
* @apiUse ProjectNotFoundError
* @apiUse NoCredentialsSentError
* @apiUse KeyNotAuthorizedError
* @apiUse NoDataSentError
* @apiUse InvalidCollectionNameError
* @apiUse InvalidPropertyNameError
*/
router.post("/:EVENT_COLLECTION", (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, async (err2, project) => {
  if (!/^[a-z]+[a-z0-9]*$/g.test(req.params.EVENT_COLLECTION)) {
    return res.status(400).json({
      message: "Event collection names must start with a letter and can contain only lowercase letters and numbers.",
      error: "InvalidCollectionNameError",
    });
  }
  let { payload } = req.body;
  if (!payload) return res.status(400).json({ error: "NoDataSentError" });
  if (Object.keys(flattenJSON(payload)).some(propertyName => propertyName.split("💩").some(el => !/^[a-z]+[a-z0-9]*$/g.test(el)))) {
    return res.status(400).json({
      message: "Property names must start with a letter and can contain only lowercase letters and numbers.",
      error: "InvalidPropertyNameError",
    });
  }
  if (err2 || !project) return res.status(404).json({ error: "ProjectNotFoundError" });
  const { writeKey, masterKey } = req.query;
  if (!writeKey && !masterKey) return res.status(403).json({ error: "NoCredentialsSentError" });
  if (!(writeKey === project.writeKey || masterKey === project.masterKey)) return res.status(401).json({ message: "KeyNotAuthorizedError" });
  const cenote = {
    created_at: moment().valueOf(),
    id: uuid(),
    url: `/projects/${req.params.PROJECT_ID}/events/${req.params.EVENT_COLLECTION.replace(/-/g, "").toLowerCase()}`,
  };
  if (!Array.isArray(payload)) payload = [payload];
  let shouldShowWarningForTimestamp = false;
  for (let i = 0; i < payload.length; i += 1) {
    const { data, timestamp } = payload[i];
    if (!data || !isObject(data)) return res.status(400).json({ error: "NoDataSentError" });
    if (timestamp && moment(timestamp).isValid() && moment(timestamp).isBefore(moment())) {
      cenote.timestamp = moment(timestamp).toISOString(true);
      if (moment(timestamp).isBefore(moment("2000-01-01"))) shouldShowWarningForTimestamp = true;
    } else {
      cenote.timestamp = moment(cenote.created_at).toISOString(true);
    }
    cenote.id = uuid();
    payload[i].cenote = { ...cenote };
  }
  try {
    const NUM_OF_SLICES = parseInt(process.env.NUM_OF_SLICES, 10) || 2000;
    for (let i = 0; i < payload.length; i += NUM_OF_SLICES) {
      const slicedPayload = payload.slice(i, Math.min(i + NUM_OF_SLICES, payload.length));
      await new Promise((cool, notCool) => producer.send([{
        topic: process.env.KAFKA_TOPIC,
        messages: [JSON.stringify(slicedPayload)],
      }], err => (err ? notCool(err) : cool())));
    }
    return res.status(202).json({ message: `Events sent!${shouldShowWarningForTimestamp
      ? " HEADS UP: Timestamp(s) appear to be very old. Maybe you accidentally used seconds instead of milliseconds?" : ""}` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}));

module.exports = router;
