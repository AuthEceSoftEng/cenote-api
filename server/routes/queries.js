const express = require('express');
const Drpcjs = require('drpcjs');

const { Project } = require('../models');

const router = express.Router({ mergeParams: true });
const drpc = new Drpcjs({ host: process.env.DRPC_URL });

router.get('/count', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!(readKey === project.readKey || masterKey === project.masterKey)) return res.status(401).json({ message: 'Key hasn\'t authorization' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'count' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/count_unique', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!(readKey === project.readKey || masterKey === project.masterKey)) return res.status(401).json({ message: 'Key hasn\'t authorization' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'count_unique' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/minimum', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!(readKey === project.readKey || masterKey === project.masterKey)) return res.status(401).json({ message: 'Key hasn\'t authorization' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'minimum' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/maximum', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!(readKey === project.readKey || masterKey === project.masterKey)) return res.status(401).json({ message: 'Key hasn\'t authorization' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'maximum' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/sum', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!(readKey === project.readKey || masterKey === project.masterKey)) return res.status(401).json({ message: 'Key hasn\'t authorization' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'sum' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/average', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!(readKey === project.readKey || masterKey === project.masterKey)) return res.status(401).json({ message: 'Key hasn\'t authorization' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'average' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/median', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'median' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/percentile', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property, percentile } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!percentile) return res.status(400).json({ error: 'No `percentile` param provided!' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'percentile' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/select_unique', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property, percentile } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!percentile) return res.status(400).json({ error: 'No `percentile` param provided!' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'select_unique' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

router.get('/extraction', (req, res) => Project.findOne({ projectId: req.params.PROJECT_ID }, {}, { lean: true }, (err2, project) => {
  if (err2 || !project) {
    return res.status(404).json({ message: `Can't find project with id ${req.params.PROJECT_ID} in ${req.params.ORG_NAME}!`, err2 });
  }
  const { readKey, masterKey, event_collection, target_property, percentile } = req.query;
  if (!readKey && !masterKey) return res.status(403).json({ error: 'No key credentials sent!' });
  if (!event_collection) return res.status(400).json({ error: 'No `event_collection` param provided!' });
  if (!target_property) return res.status(400).json({ error: 'No `target_property` param provided!' });
  if (!percentile) return res.status(400).json({ error: 'No `percentile` param provided!' });
  return drpc.execute('read', JSON.stringify({ ...req.query, ...req.params, queryType: 'select_unique' }))
    .then(answer => res.json({ ...answer }))
    .catch(err3 => res.status(404).json({ message: 'Can\'t execute query!', err: err3 }));
}));

module.exports = router;
