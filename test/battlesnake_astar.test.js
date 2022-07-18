const { bsAStar } = require("../src/battlesnake_astar");
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
    expect(actual.length).toBe(7);
  });
});
