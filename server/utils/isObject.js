module.exports = (n) => {
  if (n == null) return false;
  return Object.prototype.toString.call(n) === "[object Object]";
};
