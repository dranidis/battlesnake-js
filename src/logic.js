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
    collideSquare(myHead.x, myHead.y, mybody[index].x, mybody[index].y, possibleMoves);
  }
}

function avoidLongHeads(myHead, longerSnakeHeads) {
  let possibleMovesAvoidingHeads = {
    up: true,
    down: true,
    left: true,
    right: true,
  };
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

function applyMove(gameState, aMove) {
  let newGameState = JSON.parse(JSON.stringify(gameState));

  let x = gameState.you.head.x;
  let y = gameState.you.head.y;

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
  newGameState.you.body.unshift({ x: x, y: y });
  newGameState.you.body.pop();
  newGameState.you.head.x = x;
  newGameState.you.head.y = y;

  return newGameState;
}

function getPossibleMovesDepth(gameState, depth) {
  let possibleMoves = getPossibleMoves(gameState);
  if (depth == 0) {
    return possibleMoves;
  }
  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key]
  );

  for (let index = 0; index < safeMoves.length; index++) {
    let newGameState = applyMove(gameState, safeMoves[index]);
    let newPossibleMoves = getPossibleMovesDepth(newGameState, depth - 1);
    let newSafeMoves = Object.keys(newPossibleMoves).filter(
      (key) => newPossibleMoves[key]
    );
    if (newSafeMoves.length == 0) {
      possibleMoves[safeMoves[index]] = false;
    }
  }
  return possibleMoves;
}

function pickMove(safeMoves) {
  return safeMoves[Math.floor(Math.random() * safeMoves.length)];
}

function move(gameState) {
  console.log("\nTURN " + gameState.turn);

  let possibleMoves = getPossibleMovesDepth(gameState, 7);

  const myHead = gameState.you.head;
  const snakes = gameState.board.snakes;

  // TODO: Step 4 - Find food.
  // Use information in gameState to seek out and find food.
  let minDistanceFoodIndex = undefined;
  const boardfood = gameState.board.food;
  const distances = boardfood.map((f) => distance(myHead, f));
  minDistanceFoodIndex = distances.indexOf(Math.min(...distances));

  let towardsFoodMoves = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  // if (minDistanceFoodIndex != undefined)
  towardsFoodMoves = moveTowardsTarget(myHead, boardfood[minDistanceFoodIndex]);

  console.log("DIST " + distances);
  console.log("MIN: " + minDistanceFoodIndex);
  console.log("TOW FOOD: " + JSON.stringify(towardsFoodMoves));

  const otherSnakes = snakes.filter((s) => s.id != gameState.you.id);

  const snakeLengths = otherSnakes.map((s) => s.length);

  const longest = Math.max(...snakeLengths);

  // avoid losing head-to-head
  longerSnakeHeads = otherSnakes
    .filter((s) => s.length >= gameState.you.length)
    .map((s) => s.head);
  console.log("LONGER SNAKE HEADS" + JSON.stringify(longerSnakeHeads));

  let possibleMovesAvoidingHeads = avoidLongHeads(myHead, longerSnakeHeads);

  // TODO: Step 5 - Select a move to make based on strategy, rather than random.
  const totallySafeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key] && possibleMovesAvoidingHeads[key]
  );

  let safeMoves = undefined;
  if (totallySafeMoves.length > 0) {
    safeMoves = totallySafeMoves;
  } else {
    safeMoves = Object.keys(possibleMoves).filter((key) => possibleMoves[key]);
  }

  let isAttacking = snakes.length > 1 && gameState.you.length > longest + 1;

  let target = undefined;
  let safeTargetMoves = undefined;

  if (isAttacking) {
    console.log("isAttacking");
    // todo: now picks first other snake as target
    target = otherSnakes[0].head;
    let towardsSnake = moveTowardsTarget(myHead, target);
    safeTargetMoves = Object.keys(towardsSnake).filter(
      (key) =>
        possibleMoves[key] &&
        possibleMovesAvoidingHeads[key] &&
        towardsSnake[key]
    );
  }

  let safeFoodMoves = Object.keys(possibleMoves).filter(
    (key) =>
      possibleMoves[key] &&
      towardsFoodMoves[key] &&
      possibleMovesAvoidingHeads[key]
  );

  console.log("SAF FOOD MOVES: " + safeFoodMoves);
  console.log("TOT SAFE MOVES: " + totallySafeMoves);
  console.log("FIN SAFE MOVES: " + safeMoves);
  console.log("SAF TARG MOVES: " + safeTargetMoves);

  // console.log("SAFE TO FOOD " + JSON.stringify(safeFoodMoves))

  let moveToMake = undefined;

  if (isAttacking && safeTargetMoves.length > 0) {
    moveToMake = pickMove(safeTargetMoves);
  } else if (safeFoodMoves.length > 0) {
    moveToMake = pickMove(safeFoodMoves);
  } else {
    moveToMake = pickMove(safeMoves);
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
