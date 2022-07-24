const { isEmpty, preprocess } = require("./board");
const { isEqual } = require("./util");

function getSnakePossibleMoves(gameState, snake) {
  return {
    up: !snake.lost && isEmpty(gameState, squareAfterMove(snake.head, "up")),
    down:
      !snake.lost && isEmpty(gameState, squareAfterMove(snake.head, "down")),
    left:
      !snake.lost && isEmpty(gameState, squareAfterMove(snake.head, "left")),
    right:
      !snake.lost && isEmpty(gameState, squareAfterMove(snake.head, "right")),
  };
}

function getMyPossibleMoves(gameState) {
  return getSnakePossibleMoves(gameState, gameState.you);
}

function squareAfterMove(sq, aMove) {
  let x = sq.x;
  let y = sq.y;

  switch (aMove) {
    case "up":
      y++;
      break;
    case "down":
      y--;
      break;
    case "right":
      x++;
      break;
    case "left":
      x--;
      break;
    default:
    // code block
  }
  return { x: x, y: y };
}

function applyMoveToSnake(newGameState, snake, newHead) {
  if (!isFood(newGameState, newHead)) {
    snake.body.pop();
  } else {
    // console.log(`FOOD CONSUMED at ${JSON.stringify(newHead)}`)
    newGameState.board.food.filter((f) =>
      isEqual(f, newHead)
    )[0].consumed = true;
  }
  snake.body.unshift(newHead);
  snake.head = newHead;
}

function cloneGameState(gameState) {
  return JSON.parse(
    JSON.stringify(
      gameState,
      (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    )
  );
}

function applyMove(gameState, newHead, otherHeadList = []) {
  let newGameState = cloneGameState(gameState);

  const mySnake = newGameState.board.snakes.filter(
    (s) => s.id == newGameState.you.id
  )[0];

  applyMoveToSnake(newGameState, mySnake, newHead);

  const snakes = newGameState.board.snakes;
  const otherSnakes = snakes.filter((s) => s.id != newGameState.you.id);

  otherHeadList.forEach((head, i) => {
    applyMoveToSnake(newGameState, otherSnakes[i], head);
  });

  // head-to-head collision
  snakes.forEach((s1) => {
    snakes
      .filter((s2) => s2.id != s1.id && isEqual(s2.head, s1.head))
      .forEach((s2) => {
        if (s1.body.length <= s2.body.length) s1.lost = true;
        if (s1.body.length >= s2.body.length) s2.lost = true;
      });
  });

  newGameState.you = snakes.find((s) => s.id == newGameState.you.id);

  newGameState.board.food = newGameState.board.food.filter((f) => !f.consumed);

  preprocess(newGameState);
  // console.log(
  //   `STATE ${newGameState.blocks.toString()} after move ${JSON.stringify(
  //     newHead
  //   )}
  //   } and ${JSON.stringify(otherHeadList)}`
  // );

  return newGameState;
}

function isFood(gameState, coord) {
  return gameState.board.food.some((f) => isEqual(f, coord));
}

module.exports = {
  getMyPossibleMoves,
  getSnakePossibleMoves,
  squareAfterMove,
  applyMove,
  isFood,
  cloneGameState,
};
