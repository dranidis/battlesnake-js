const { bsAStar, coordsToMoves } = require("../src/battlesnake_astar");
const { Matrix } = require("../src/bitmatrix");

describe("Battlesnake A*", () => {
  test("board matrix", () => {
    const start = { x: 1, y: 1 };
    const goal = { x: 2, y: 4 };
    const width = 5;

    const matrix = new Matrix(width, width, 71808n);
    // . . o . .
    // . X . . .
    // . X X . .
    // . o X . .
    // . . . . .

    actual = bsAStar(matrix, start, goal);
    console.log("PATH " + JSON.stringify(actual));
    expect(actual.length).toBe(6);
    expect(actual[0]).toBe("left");
  });
});

describe("coords to moves", () => {
  test("coords to moves", () => {
    const path = [{x: 0, y:0}, {x: 1, y: 0}, {x:1, y:1},{x:0, y:1}, {x:0, y:0}]
    actual = coordsToMoves(path);
    expect(actual).toStrictEqual(["right", "up", "left", "down"]);
  });
});

