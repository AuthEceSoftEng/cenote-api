module.exports = (arr, per) => {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  if (per <= 0) return arr[0];
  if (per >= 100) return arr[arr.length - 1];
  return arr[Math.ceil(arr.length * (per / 100)) - 1];
};
