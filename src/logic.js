function info() {
  console.log("INFO");
  const response = {
    apiversion: "1",
    author: "DDmits2",
    color: "#ff00ff",
    head: "default",
    tail: "bolt",
  };
  return response;
}

function start(gameState) {
  console.log(`${gameState.game.id} START`);
}

function end(gameState) {
  console.log(`${gameState.game.id} END\n`);
}

function collideSquare(myX, myY, xblock, yblock, possibleMoves) {
  if (myX + 1 == xblock && myY == yblock) possibleMoves.right = false;
  if (myX - 1 == xblock && myY == yblock) possibleMoves.left = false;
  if (myX == xblock && myY + 1 == yblock) possibleMoves.up = false;
  if (myX == xblock && myY - 1 == yblock) possibleMoves.down = false;
}

function collideWithSnake(myHead, mybody, possibleMoves) {
  for (let index = 0; index < mybody.length; index++) {
    collideSquare(
      myHead.x,
      myHead.y,
      mybody[index].x,
      mybody[index].y,
      possibleMoves
    );
  }
}

function avoidLongerHeads(gameState) {
  let possibleMovesAvoidingHeads = {
    up: true,
    down: true,
    left: true,
    right: true,
  };
  const myHead = gameState.you.head;
  const longerSnakeHeads = gameState.otherSnakes
    .filter((s) => s.length >= gameState.you.length)
    .map((s) => s.head);

  for (let index = 0; index < longerSnakeHeads.length; index++) {
    x = longerSnakeHeads[index].x;
    y = longerSnakeHeads[index].y;
    collideSquare(myHead.x, myHead.y, x + 1, y, possibleMovesAvoidingHeads);
    collideSquare(myHead.x, myHead.y, x - 1, y, possibleMovesAvoidingHeads);
    collideSquare(myHead.x, myHead.y, x, y + 1, possibleMovesAvoidingHeads);
    collideSquare(myHead.x, myHead.y, x, y - 1, possibleMovesAvoidingHeads);
  }
  return possibleMovesAvoidingHeads;
}

function distance(myHead, food) {
  return Math.abs(myHead.x - food.x) + Math.abs(myHead.y - food.y);
}

function moveTowardsTarget(myHead, food) {
  let towardsFoodMoves = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  if (food.x > myHead.x) towardsFoodMoves.right = true;
  if (food.x < myHead.x) towardsFoodMoves.left = true;
  if (food.y > myHead.y) towardsFoodMoves.up = true;
  if (food.y < myHead.y) towardsFoodMoves.down = true;

  return towardsFoodMoves;
}

function getPossibleMoves(gameState) {
  let possibleMoves = {
    up: true,
    down: true,
    left: true,
    right: true,
  };
  // Step 0: Don't let your Battlesnake move back on its own neck
  const myHead = gameState.you.head;

  // const myNeck = gameState.you.body[1]
  // if (myNeck.x < myHead.x) {
  //     possibleMoves.left = false
  // } else if (myNeck.x > myHead.x) {
  //     possibleMoves.right = false
  // } else if (myNeck.y < myHead.y) {
  //     possibleMoves.down = false
  // } else if (myNeck.y > myHead.y) {
  //     possibleMoves.up = false
  // }

  // TODO: Step 1 - Don't hit walls.
  // Use information in gameState to prevent your Battlesnake from moving beyond the boundaries of the board.
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  // console.log("SNAKE " + myHead.x + " " + myHead.y)

  if (myHead.x == 0) possibleMoves.left = false;
  if (myHead.x == boardWidth - 1) possibleMoves.right = false;
  if (myHead.y == 0) possibleMoves.down = false;
  if (myHead.y == boardHeight - 1) possibleMoves.up = false;

  // TODO: Step 2 - Don't hit yourself.
  // Use information in gameState to prevent your Battlesnake from colliding with itself.

  // this can be covered by next step
  // but the algorithm or lookahead needs it separately!!
  const mybody = gameState.you.body;
  collideWithSnake(myHead, mybody, possibleMoves);

  // TODO: Step 3 - Don't collide with others.
  // Use information in gameState to prevent your Battlesnake from colliding with others.
  const snakes = gameState.board.snakes;
  for (let index = 0; index < snakes.length; index++) {
    if (snakes[index].id != gameState.you.id)
      collideWithSnake(myHead, snakes[index].body, possibleMoves);
  }

  return possibleMoves;
}

function newSquare(sq, aMove) {
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

function applyMove(gameState, newHead) {
  let newGameState = JSON.parse(JSON.stringify(gameState));

  newGameState.you.body.unshift(newHead);
  newGameState.you.body.pop();
  newGameState.you.head = newHead;

  return newGameState;
}

function deepCopy(arrayCoord) {
  let copy = [];
  for (let i = 0; i < arrayCoord.length; i++) {
    copy.push(arrayCoord[i]);
  }
  return copy;
}

function getPossibleMovesDepth(gameState, depth, visited) {
  let possibleMoves = getPossibleMoves(gameState);
  if (depth == 0) {
    return possibleMoves;
  }
  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key]
  );

  for (let index = 0; index < safeMoves.length; index++) {
    let newHead = newSquare(gameState.you.head, safeMoves[index]);
    if (
      visited.filter((h) => h.x == newHead.x && h.y == newHead.y).length == 0
    ) {
      // newVisited = JSON.parse(JSON.stringify(visited));
      const newVisited = deepCopy(visited);
      newVisited.push(newHead);
      let newGameState = applyMove(gameState, newHead);
      let newPossibleMoves = getPossibleMovesDepth(
        newGameState,
        depth - 1,
        newVisited
      );
      let newSafeMoves = Object.keys(newPossibleMoves).filter(
        (key) => newPossibleMoves[key]
      );
      if (newSafeMoves.length == 0) {
        possibleMoves[safeMoves[index]] = false;
      }
    }
  }
  return possibleMoves;
}

function pickMove(safeMoves) {
  return safeMoves[Math.floor(Math.random() * safeMoves.length)];
}

function closerFoodAndDistance(myHead, boardfood) {
  if (boardfood.length == 0) return [{}, 999];

  const distances = boardfood.map((f) => distance(myHead, f));
  const index = distances.indexOf(Math.min(...distances));
  if (index == -1) return [{}, 999];
  return [boardfood[index], distances[index]];
}

function minFoodDistanceFromOtherSnakes(gameState, food) {
  const otherHeads = gameState.otherSnakes.map((s) => s.head);
  return Math.min(...otherHeads.map((h) => distance(h, food)));
}

function movesTowardsClosestFood(gameState) {
  // TODO:
  //  Find food that is closer to you than to any other snake.
  let towardsFoodMoves = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  const boardfood = gameState.board.food;
  const myHead = gameState.you.head;
  const otherHeads = gameState.board.snakes
    .filter((s) => s.id != gameState.you.id)
    .map((s) => s.head);

  const foodNotCloseToOthers = boardfood.filter(
    (f) => distance(myHead, f) < minFoodDistanceFromOtherSnakes(gameState, f)
  );

  // boardfood.forEach((f) => {
  //   console.log("My DIST: " + JSON.stringify(f) + distance(myHead, f));
  //   console.log(
  //     "MIN DIST: " +
  //       JSON.stringify(f) +
  //       minFoodDistanceFromOtherSnakes(gameState, f)
  //   );
  // });
  // console.log("ALL FOOD: " + JSON.stringify(boardfood));
  // console.log("FOOD: " + JSON.stringify(foodNotCloseToOthers));

  let [minDistanceFood, distanceToCloserFood] =
    foodNotCloseToOthers.length > 0
      ? closerFoodAndDistance(myHead, foodNotCloseToOthers)
      : closerFoodAndDistance(myHead, boardfood);

  if (minDistanceFood != {}) {
    towardsFoodMoves = moveTowardsTarget(myHead, minDistanceFood);
  }

  return [towardsFoodMoves, distanceToCloserFood];
}

function getDeadlyMove(gameState) {
  const myHead = gameState.you.head;
  const snakes = gameState.otherSnakes;

  return undefined;
}

function preprocess(gameState) {
  gameState.otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );
}

function move(gameState) {
  console.log("\nTURN " + gameState.turn);
  preprocess(gameState);

  const possibleMoves = getPossibleMovesDepth(gameState, 7, []);

  const myHead = gameState.you.head;

  const longest = Math.max(...gameState.otherSnakes.map((s) => s.length));

  const possibleMovesAvoidingLongerHeads = avoidLongerHeads(gameState);

  const totallySafeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key] && possibleMovesAvoidingLongerHeads[key]
  );

  const safeMoves =
    totallySafeMoves.length > 0
      ? totallySafeMoves
      : Object.keys(possibleMoves).filter((key) => possibleMoves[key]);

  let isAttacking =
    gameState.otherSnakes.length > 0 && gameState.you.length > longest;
  let target = undefined;
  let safeTargetMoves = undefined;

  if (isAttacking) {
    console.log("isAttacking");
    // TODO: now picks first other snake as target
    target = gameState.otherSnakes[0].head;
    let towardsSnake = moveTowardsTarget(myHead, target);
    safeTargetMoves = Object.keys(towardsSnake).filter(
      (key) =>
        possibleMoves[key] &&
        possibleMovesAvoidingLongerHeads[key] &&
        towardsSnake[key]
    );
  }

  const [towardsFoodMoves, distanceToCloserFood] =
    movesTowardsClosestFood(gameState);

  let safeFoodMoves = Object.keys(possibleMoves).filter(
    (key) =>
      possibleMoves[key] &&
      towardsFoodMoves[key] &&
      possibleMovesAvoidingLongerHeads[key]
  );

  console.log("SAF FOOD MOVES: " + safeFoodMoves);
  console.log("TOT SAFE MOVES: " + totallySafeMoves);
  console.log("FIN SAFE MOVES: " + safeMoves);
  console.log("SAF TARG MOVES: " + safeTargetMoves);

  let moveToMake = undefined;

  const deadlyMove = getDeadlyMove(gameState);

  if (deadlyMove && safeMoves.includes(deadlyMove)) {
    moveToMake = deadlyMove;
  } else if (safeFoodMoves.length > 0 && distanceToCloserFood < 3) {
    moveToMake = pickMove(safeFoodMoves);
  } else if (isAttacking && safeTargetMoves.length > 0) {
    moveToMake = pickMove(safeTargetMoves);
  } else if (safeFoodMoves.length > 0) {
    moveToMake = pickMove(safeFoodMoves);
  } else {
    moveToMake = pickMove(safeMoves);
  }

  if (moveToMake == undefined) {
    moveToMake = pickMove(
      Object.keys(getPossibleMoves(gameState)).filter(
        (key) => possibleMoves[key]
      )
    );
  }

  response = {
    move: moveToMake,
  };

  console.log(`${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`);
  return response;
}

module.exports = {
  info: info,
  start: start,
  move: move,
  end: end,
};
