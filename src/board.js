const { Matrix } = require("./bitmatrix");

function isEmpty(gameState, coord) {
  const w = gameState.board.width;
  const h = gameState.board.height;
  return (
    coord.x >= 0 &&
    coord.x < w &&
    coord.y >= 0 &&
    coord.y < h &&
    new Matrix(w, h).set(coord.x, coord.y).and(gameState.blocks).data == 0n
  );
}

function preprocess(gameState) {
  gameState.blocks = new Matrix(gameState.board.width, gameState.board.height);

  gameState.board.snakes
    .filter((s) => !s.lost)
    .forEach((s) => {
      for (let i = 0; i < s.body.length - 1; i++) {
        gameState.blocks.set(s.body[i].x, s.body[i].y);
      }
    });
}

module.exports = {
  isEmpty,
  preprocess,
};
