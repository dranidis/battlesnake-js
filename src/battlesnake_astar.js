const { distance, indexToCoord, coordToIndex } = require("../src/util");
const { aStar } = require("../src/astar");

function matrixNeighbors(matrix) {
  console.log("CALL ");
  console.log(matrix.toString());

  function neighbors(n) {
    console.log("N par" + n)
    const coord = indexToCoord(matrix.width, n);
    console.log(coord.x + " " + coord.y);
    let neigh = [];
    [
      { x: coord.x + 1, y: coord.y },
      { x: coord.x - 1, y: coord.y },
      { x: coord.x, y: coord.y + 1 },
      { x: coord.x, y: coord.y - 1 },
    ].forEach((e) => {
      console.log(e.x + ", " + e.y);
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
    console.log("FUN " + neigh);
    return neigh;
  }

  return neighbors;
}

function bsAStar(matrix, startCoord, goalCoord) {
  const width = matrix.width

  const start = coordToIndex(width, startCoord);
  const goal = coordToIndex(width, goalCoord);

  const h = (n, goal) =>
  distance(indexToCoord(width, n), indexToCoord(width, goal));
  const neighbors = matrixNeighbors(matrix);
  console.log("N6 " + neighbors(6));

  const d = (n1, n2) => 1;

  actual = aStar(start, goal, h, neighbors, d);
  return actual.map(n => indexToCoord(width, n))
}

module.exports = {
  bsAStar,
};
