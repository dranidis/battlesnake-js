const { distance, indexToCoord, coordToIndex } = require("../src/util");
const { aStar } = require("../src/astar");

function matrixNeighbors(matrix) {
  // console.log(matrix.toString());

  function neighbors(n) {
    const coord = indexToCoord(matrix.width, n);
    let neigh = [];
    [
      { x: coord.x + 1, y: coord.y },
      { x: coord.x - 1, y: coord.y },
      { x: coord.x, y: coord.y + 1 },
      { x: coord.x, y: coord.y - 1 },
    ].forEach((e) => {
      if (
        e.x >= 0 &&
        e.x < matrix.width &&
        e.y >= 0 &&
        e.y < matrix.height &&
        !matrix.is(e.x, e.y)
      ) {
        neigh.push(coordToIndex(matrix.width, { x: e.x, y: e.y }));
      }
    });
    return neigh;
  }

  return neighbors;
}

function moveFromTo(from, to) {
  const xd = to.x - from.x;
  const yd = to.y - from.y;
  if (xd > 0) return "right";
  if (xd < 0) return "left";
  if (yd > 0) return "up";
  return "down";
}

function coordsToMoves(path) {
  let moves = [];
  for (let i = 0; i < path.length - 1; i++) {
    moves.push(moveFromTo(path[i], path[i + 1]));
  }
  return moves;
}

// TODO: Take into account tail reductions every step
/**
 *
 * @param {*} matrix
 * @param {*} startCoord
 * @param {*} goalCoord
 * @returns
 */
function bsAStar(matrix, startCoord, goalCoord) {
  const width = matrix.width;

  const start = coordToIndex(width, startCoord);
  const goal = coordToIndex(width, goalCoord);

  const h = (n, goal) =>
    distance(indexToCoord(width, n), indexToCoord(width, goal));
  const neighbors = matrixNeighbors(matrix);

  const d = (n1, n2) => 1;

  actual = aStar(start, goal, h, neighbors, d);
  return coordsToMoves(actual.map((n) => indexToCoord(width, n)));
}

module.exports = {
  bsAStar,
  coordsToMoves,
};
