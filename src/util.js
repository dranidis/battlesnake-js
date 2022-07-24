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
  return p1.x == p2.x && p1.y == p2.y;
}

//
// https://stackoverflow.com/questions/4683539/variable-amount-of-nested-for-loops
// callManyTimes([2,3,5], doSomething);
//
function callManyTimes(maxIndices, func) {
  doCallManyTimes(maxIndices, func, [x, y, z], 0);
}

function doCallManyTimes(maxIndices, func, args, index) {
  if (maxIndices.length == 0) {
    func(args);
  } else {
    var rest = maxIndices.slice(1);
    for (args[index] = 0; args[index] < maxIndices[0]; ++args[index]) {
      doCallManyTimes(rest, func, args, index + 1);
    }
  }
}

const bigIntSerializer = (key, value) =>
  typeof value === "bigint" ? value.toString() : value;

module.exports = {
  distance,
  coordToIndex,
  indexToCoord,
  getTrueKeys,
  isEqual,
  bigIntSerializer
};
