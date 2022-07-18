const { aStar } = require("../src/astar");
const { Matrix } = require("../src/bitmatrix");
const { distance, indexToCoord, coordToIndex } = require("../src/util");

const width = 5;

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

describe("A*", () => {
  test("call", () => {
    const start = coordToIndex(width, { x: 0, y: 0 });
    const goal = start;
    const h = () => 0;
    const neighbors = (node) => [];
    const d = (n1, n2) => 0;
    actual = aStar(start, goal, h, neighbors, d);
    expect(actual).toStrictEqual([start]);
  });

  test("one step", () => {
    const start = coordToIndex(width, { x: 0, y: 0 });
    const goal = coordToIndex(width, { x: 1, y: 1 });
    const h = (n, goal) =>
      distance(indexToCoord(width, n), indexToCoord(width, goal));
    const neighbors = (n) => {
      n = indexToCoord(width, n);
      let neigh = [];
      neigh.push(coordToIndex(width, { x: n.x + 1, y: n.y }));
      neigh.push(coordToIndex(width, { x: n.x, y: n.y + 1 }));
      return neigh;
    };
    const d = (n1, n2) => 1;
    actual = aStar(start, goal, h, neighbors, d);
    console.log("PATH " + actual);
    expect(actual.length).toBe(3);
  });

  test("matrix", () => {
    const start = coordToIndex(width, { x: 1, y: 1 });
    const goal = coordToIndex(width, { x: 2, y: 4 });
    const h = (n, goal) =>
      distance(indexToCoord(width, n), indexToCoord(width, goal));

    const matrix = new Matrix(width, width, 71808n);
    // . . o . .
    // . X . . .
    // . X X . .
    // . o X . .
    // . . . . .

    const neighbors = matrixNeighbors(matrix);
    console.log("N6 " + neighbors(6));

    const d = (n1, n2) => 1;

    actual = aStar(start, goal, h, neighbors, d);
    console.log("PATH " + JSON.stringify(actual.map(n => indexToCoord(width, n))));
    expect(actual.length).toBe(7);
  });
});
