function distance(from, to) {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function coordToIndex(width, coord) {
  return coord.y * width + coord.x
}

function indexToCoord(width, n) {
  const x = n % width
  const y = Math.floor(n / width)
  return {x:x, y:y}
}

module.exports = {
  distance,
  coordToIndex,
  indexToCoord
};
