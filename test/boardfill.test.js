const { Matrix } = require("../src/bitmatrix");
const { BoardFill} = require("../src/boardfill")

describe("FloodFill", () => {
  test("empty Board", () => {
    const boardFill = new BoardFill(new Matrix(11, 11), { x: 1, y: 1 });
    boardFill.fill();
    expect(boardFill.get()).toBe(121);
  });

  test("second row filled", () => {
    const boardFill = new BoardFill(new Matrix(5, 5, 992n), { x: 0, y: 0 });
    boardFill.fill();
    expect(boardFill.get()).toBe(5);
  });

  test("second row almost filled", () => {
    const boardFill = new BoardFill(new Matrix(5, 5, 864n), { x: 0, y: 0 });
    boardFill.fill();
    expect(boardFill.get()).toBe(21);
  });

  test("first square blocked", () => {
    const boardFill = new BoardFill(new Matrix(5, 5, 866n), { x: 0, y: 0 });
    boardFill.fill();
    expect(boardFill.get()).toBe(1);
  });
});
