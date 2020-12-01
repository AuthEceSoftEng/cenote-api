module.exports = arr => arr.reduce((acc, obj) => {
  Object.keys(obj).forEach(k => acc[k] = (acc[k] || []).concat(obj[k]));
  return acc;
}, {});
