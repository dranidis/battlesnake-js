const { isEmpty } = require("./board");

function blockFilled(gameState, fromX, toX, fromY, toY) {
  for (let x = fromX; x <= toX; x++) {
    for (let y = fromY; y <= toY; y++) {
      if (!gameState.blocks.is(x, y)) return false;
    }
  }
  return true;
}

function getDeadlyMoveToSnake(gameState, mySnake, snake) {
  const xDistance = mySnake.head.x - snake.head.x;
  const yDistance = mySnake.head.y - snake.head.y;
  const halfHeight = Math.floor(gameState.board.height / 2);
  const halfWidth = Math.floor(gameState.board.width / 2);
  if (
    (xDistance >= 2 &&
      blockFilled(
        gameState,
        mySnake.head.x - xDistance,
        mySnake.head.x,
        mySnake.head.y,
        mySnake.head.y
      ) &&
      mySnake.head.x <= gameState.board.width - 2) || // there is still room to maneavure
    (xDistance <= -2 &&
      blockFilled(
        gameState,
        mySnake.head.x,
        mySnake.head.x - xDistance,
        mySnake.head.y,
        mySnake.head.y
      ) &&
      mySnake.head.x >= 1) // there is still room to maneavure
  ) {
    if (mySnake.head.y == snake.head.y + 1) {
      if (snake.head.y < halfHeight) {
        return ["down", xDistance];
      }
    } else if (mySnake.head.y == snake.head.y - 1) {
      if (snake.head.y > halfHeight) {
        return ["up", xDistance];
      }
    }
  } else if (
    (yDistance >= 2 &&
      blockFilled(
        gameState,
        mySnake.head.x,
        mySnake.head.x,
        mySnake.head.y - yDistance,
        mySnake.head.y
      ) &&
      mySnake.head.y <= gameState.board.height - 2) || // there is still room to maneavure
    (yDistance <= -2 &&
      blockFilled(
        gameState,
        mySnake.head.x,
        mySnake.head.x,
        mySnake.head.y,
        mySnake.head.y - yDistance
      ) &&
      mySnake.head.y >= 1) // there is still room to maneavure
  ) {
    if (mySnake.head.x == snake.head.x + 1) {
      if (snake.head.x < halfWidth) {
        return ["left", yDistance];
      }
    } else if (mySnake.head.x == snake.head.x - 1) {
      if (snake.head.x > halfWidth) {
        return ["right", yDistance];
      }
    }
  }
  return [undefined, undefined];
}

function getDeadlyMove(gameState) {
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );
  const mySnake = gameState.you;

  for (let i = 0; i < otherSnakes.length; i++) {
    const [dMove, distance] = getDeadlyMoveToSnake(
      gameState,
      mySnake,
      otherSnakes[i]
    );
    if (dMove != undefined) return dMove;
  }

  return undefined;
}

function detectDeadlyMove(gameState) {
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );
  const mySnake = gameState.you;

  for (let i = 0; i < otherSnakes.length; i++) {
    const [dMove, distance] = getDeadlyMoveToSnake(
      gameState,
      otherSnakes[i],
      mySnake
    );
    if (dMove != undefined) {
      switch (dMove) {
        case "up":
        case "down":
          return distance < 0 ? "right" : "left";
        case "left":
        case "right":
          return distance < 0 ? "up" : "down";
      }
    }
  }

  return undefined;
}

// . . . < X
// . . . . .
// . . . ^ .
// . . . X .
// . . . X .
// It should also check if squares on the second row are blocked and then
// free. In that case the snake can escape!
// Also if there is food, the snake can grow and escape!
// Lazy check for food!
function isTrapped(gameState) {
  const myHead = gameState.you.head;

  const longerSnakeHeads = gameState.board.snakes
    .filter((s) => s.id != gameState.you.id && s.length > gameState.you.length)
    .map((s) => s.head);

  if (
    // top case
    (myHead.y == gameState.board.height - 1 &&
      !gameState.board.food.some((f) => f.y == myHead.y) &&
      longerSnakeHeads.some((h) => h.x == myHead.x && h.y == myHead.y - 2) &&
      isEmpty(gameState, { x: myHead.x, y: myHead.y - 1 })) ||
    // bottom case
    (myHead.y == 0 &&
      !gameState.board.food.some((f) => f.y == myHead.y) &&
      longerSnakeHeads.some((h) => h.x == myHead.x && h.y == myHead.y + 2) &&
      isEmpty(gameState, { x: myHead.x, y: myHead.y + 1 })) ||
    // left case
    (myHead.x == 0 &&
      !gameState.board.food.some((f) => f.x == myHead.x) &&
      longerSnakeHeads.some((h) => h.y == myHead.y && h.x == myHead.x + 2) &&
      isEmpty(gameState, { y: myHead.y, x: myHead.x + 1 })) ||
    // right case
    (myHead.x == gameState.board.width - 1 &&
      !gameState.board.food.some((f) => f.x == myHead.x) &&
      longerSnakeHeads.some((h) => h.y == myHead.y && h.x == myHead.x - 2) &&
      isEmpty(gameState, { y: myHead.y, x: myHead.x - 1 }))
  ) {
    console.log("TRAPPED!");
    return true;
  }
  return false;
}

function direction(snakeBody) {
  if (snakeBody[0].x > snakeBody[1].x) return "right";
  if (snakeBody[0].x < snakeBody[1].x) return "left";
  if (snakeBody[0].y > snakeBody[1].y) return "up";
  return "down";
}

function isTrappeCloseForSnake(gameState, snake) {
  const myHead = snake.head;
  const myBody = snake.body;
  const myDirection = direction(myBody);
  const otherSnakes = gameState.board.snakes.filter((s) => s.id != snake.id);

  return (
    (myHead.y == gameState.board.height - 1 &&
      otherSnakes.some(
        (snake) =>
          snake.head.y == myHead.y - 1 &&
          myDirection == direction(snake.body) &&
          snake.head.x == myHead.x + (myDirection == "right" ? 1 : -1)
      )) ||
    (myHead.y == 0 &&
      otherSnakes.some(
        (snake) =>
          snake.head.y == myHead.y + 1 &&
          myDirection == direction(snake.body) &&
          snake.head.x == myHead.x + (myDirection == "right" ? 1 : -1)
      )) ||
    (myHead.x == 0 &&
      otherSnakes.some(
        (snake) =>
          snake.head.x == myHead.x + 1 &&
          myDirection == direction(snake.body) &&
          snake.head.y == myHead.y + (myDirection == "up" ? 1 : -1)
      )) ||
    (myHead.x == gameState.board.width - 1 &&
      otherSnakes.some(
        (snake) =>
          snake.head.x == myHead.x - 1 &&
          myDirection == direction(snake.body) &&
          snake.head.y == myHead.y + (myDirection == "up" ? 1 : -1)
      ))
  );
}

function isTrappedClose(gameState) {
  if (isTrappeCloseForSnake(gameState, gameState.you)) {
    console.log("TRAPPED CLOSE for my snake");
    return true;
  }
  return false;
}

module.exports = {
  isTrapped,
  isTrappedClose,
  isTrappeCloseForSnake,
  detectDeadlyMove, getDeadlyMove
};
