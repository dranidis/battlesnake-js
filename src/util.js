function distance(from, to) {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function coordToIndex(width, coord) {
  return coord.y * width + coord.x;
}

function indexToCoord(width, n) {
  const x = n % width;
  const y = Math.floor(n / width);
  return { x: x, y: y };
}

function getTrueKeys(obj) {
  return Object.keys(obj).filter((key) => obj[key]);
}

function isEqual(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y
}

module.exports = {
  distance,
  coordToIndex,
  indexToCoord,
  getTrueKeys,
  isEqual
};
