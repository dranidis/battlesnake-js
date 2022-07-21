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

function squareAfterMove(sq, aMove) {
  let x = sq.x;
  let y = sq.y;

  switch (aMove) {
    case "up":
      y++;
      break;
    case "down":
      y--;
      break;
    case "right":
      x++;
      break;
    case "left":
      x--;
      break;
    default:
    // code block
  }
  return { x: x, y: y };
}


module.exports = {
  distance,
  coordToIndex,
  indexToCoord,
  getTrueKeys,
  isEqual, squareAfterMove
};
