
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

function applyMove(gameState, newHead, otherHeadList = []) {
  let newGameState = JSON.parse(
    JSON.stringify(
      gameState,
      (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    )
  );

  const mySnake = newGameState.board.snakes.filter(
    (s) => s.id == newGameState.you.id
  )[0];

  applyMoveToSnake(newGameState, mySnake, newHead);

  const snakes = newGameState.board.snakes;
  const otherSnakes = snakes.filter((s) => s.id != newGameState.you.id);

  for (let i = 0; i < otherHeadList.length; i++) {
    applyMoveToSnake(newGameState, otherSnakes[i], otherHeadList[i]);
  }

  // head-to-head collision
  for (let i = 0; i < snakes.length - 1; i++) {
    for (let j = i + 1; j < snakes.length; j++) {
      if (isEqual(snakes[i].head, snakes[j].head)) {
        if (snakes[i].body.length <= snakes[j].body.length) {
          snakes[i].lost = true;
        }
        if (snakes[i].body.length >= snakes[j].body.length) {
          snakes[j].lost = true;
        }
      }
    }
  }

  for (let i = 0; i < snakes.length; i++) {
    if (snakes[i].id == newGameState.you.id) {
      newGameState.you = snakes[i];
      break;
    }
  }

  let newFood = [];
  newGameState.board.food.forEach((f) => {
    if (!f.consumed) newFood.push(f);
  });

  newGameState.board.food = newFood;

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
  getMyPossibleMoves, getSnakePossibleMoves, squareAfterMove, applyMove, isFood
}
