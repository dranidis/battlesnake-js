const { FloodFill } = require("../src/floodfill");
const { Matrix } = require("../src/bitmatrix");

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

function getFloodFillSquares(gameState, start) {
  const boardFill = new BoardFill(gameState.blocks, start);
  boardFill.fill();
  const squares = boardFill.get();  
  return squares;
}

module.exports = {
  BoardFill,
  getFloodFillSquares: getFloodFillSquares,
};

