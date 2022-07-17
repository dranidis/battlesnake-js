const { Matrix } = require("../src/bitmatrix");
const { FloodFill } = require("../src/floodfill");

class BoardFill {
  constructor(board, start) {
    this.board = board;
    this.start = start;
    this.count = 0;
    this.floodFill = new FloodFill(this);
    this.setMatrix = new Matrix(board.width, board.height);
  }

  inside(coord) {
    const w = this.board.width;
    const h = this.board.height;
    return (
      coord.x >= 0 &&
      coord.x < w &&
      coord.y >= 0 &&
      coord.y < h &&
      new Matrix(w, h).set(coord.x, coord.y).and(this.board).data == 0n
    );
  }

  set(coord) {
    this.setMatrix.set(coord.x, coord.y);
    this.count++;
  }

  isSet(coord) {
    return this.setMatrix.is(coord.x, coord.y);
  }

  fill() {
    this.floodFill.floodfill(this.start);
  }

  get() {
    return this.count;
  }
}

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
});
