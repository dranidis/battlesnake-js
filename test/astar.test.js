const { aStar } = require("../src/astar");
const { distance, indexToCoord, coordToIndex } = require("../src/util");

const width = 5;

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

});
