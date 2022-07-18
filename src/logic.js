const { distance } = require("./util");
const { Matrix } = require("./bitmatrix");
const { BoardFill } = require("./boardfill");
const { bsAStar } = require("./battlesnake_astar");

const configuration = {
  CHECK_FOOD_CLOSER_TO_OTHERS: true,
  CHECK_DEADLY_ATTACK: true,
  CHECK_DEADLY_DEFENCE: true,
  BFS_DEPTH: 8, // max with Heroku
  /**
   * number of extra squares in the area for the snake 
  // to safely enter. 1.5 * length
   */
  FLOOD_FILL_FACTOR: 1.5,
};

function info() {
  console.log("INFO");
  const response = {
    apiversion: "1",
    author: "DDmits2",
    color: "#736CCB",
    head: "tongue",
    tail: "freckled",
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

function moveTowardsTarget(myHead, target) {
  let towardsTargetMoves = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  if (target.x > myHead.x) towardsTargetMoves.right = true;
  if (target.x < myHead.x) towardsTargetMoves.left = true;
  if (target.y > myHead.y) towardsTargetMoves.up = true;
  if (target.y < myHead.y) towardsTargetMoves.down = true;

  return towardsTargetMoves;
}

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

function getPossibleMoves(gameState) {
  let possibleMoves = {
    up: true,
    down: true,
    left: true,
    right: true,
  };
  const myHead = gameState.you.head;
  const w = gameState.board.width;
  const h = gameState.board.height;

  possibleMoves.right =
    myHead.x + 1 < w &&
    new Matrix(w, h).set(myHead.x + 1, myHead.y).and(gameState.blocks).data ==
      0n;

  possibleMoves.left =
    myHead.x - 1 >= 0 &&
    new Matrix(w, h).set(myHead.x - 1, myHead.y).and(gameState.blocks).data ==
      0n;

  possibleMoves.up =
    myHead.y + 1 < h &&
    new Matrix(w, h).set(myHead.x, myHead.y + 1).and(gameState.blocks).data ==
      0n;

  possibleMoves.down =
    myHead.y - 1 >= 0 &&
    new Matrix(w, h).set(myHead.x, myHead.y - 1).and(gameState.blocks).data ==
      0n;

  return possibleMoves;
}

// function getPossibleMoves(gameState) {
//   let possibleMoves = {
//     up: true,
//     down: true,
//     left: true,
//     right: true,
//   };
//   const myHead = gameState.you.head;

//   // Step 0: Don't let your Battlesnake move back on its own neck

//   // const myNeck = gameState.you.body[1]
//   // if (myNeck.x < myHead.x) {
//   //     possibleMoves.left = false
//   // } else if (myNeck.x > myHead.x) {
//   //     possibleMoves.right = false
//   // } else if (myNeck.y < myHead.y) {
//   //     possibleMoves.down = false
//   // } else if (myNeck.y > myHead.y) {
//   //     possibleMoves.up = false
//   // }

//   // TODO: Step 1 - Don't hit walls.
//   // Use information in gameState to prevent your Battlesnake from moving beyond the boundaries of the board.
//   const boardWidth = gameState.board.width;
//   const boardHeight = gameState.board.height;
//   // console.log("SNAKE " + myHead.x + " " + myHead.y)

//   if (myHead.x == 0) possibleMoves.left = false;
//   if (myHead.x == boardWidth - 1) possibleMoves.right = false;
//   if (myHead.y == 0) possibleMoves.down = false;
//   if (myHead.y == boardHeight - 1) possibleMoves.up = false;

//   // TODO: Step 2 - Don't hit yourself.
//   // Use information in gameState to prevent your Battlesnake from colliding with itself.

//   // this can be covered by next step
//   // but the algorithm or lookahead needs it separately!!
//   const mybody = gameState.you.body;
//   collideWithSnake(myHead, mybody, possibleMoves);

//   // TODO: Step 3 - Don't collide with others.
//   // Use information in gameState to prevent your Battlesnake from colliding with others.
//   const otherSnakes = gameState.otherSnakes;
//   for (let index = 0; index < otherSnakes.length; index++) {
//     collideWithSnake(myHead, otherSnakes[index].body, possibleMoves);
//   }

//   return possibleMoves;
// }

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

function applyMove(gameState, newHead) {
  let newGameState = JSON.parse(
    JSON.stringify(
      gameState,
      (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    )
  );

  newGameState.you.body.unshift(newHead);
  newGameState.you.body.pop();
  newGameState.you.head = newHead;

  // just remove the tail, don't know where the head is heading
  newGameState.otherSnakes.forEach((s) => s.body.pop());
  newGameState.board.snakes.forEach((s) => s.body.pop());

  preprocess(newGameState);

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
  const possibleMoves = getPossibleMoves(gameState);
  if (depth == 0) {
    return possibleMoves;
  }
  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key]
  );

  for (let index = 0; index < safeMoves.length; index++) {
    const newHead = squareAfterMove(gameState.you.head, safeMoves[index]);
    if (
      visited.filter((h) => h.x == newHead.x && h.y == newHead.y).length == 0
    ) {
      // newVisited = JSON.parse(JSON.stringify(visited));
      const newVisited = deepCopy(visited);
      newVisited.push(newHead);
      const newGameState = applyMove(gameState, newHead);
      // console.log(
      //   "AFTER MOVE: " +
      //     safeMoves[index] +
      //     " at state " +
      //     newGameState.blocks.toString()
      // );
      const newPossibleMoves = getPossibleMovesDepth(
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

function getPossibleMovesFloodFill(gameState) {
  const possibleMoves = getPossibleMoves(gameState);
  const myHead = gameState.you.head;

  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key]
  );

  let moveSquares = {};

  for (let index = 0; index < safeMoves.length; index++) {
    const start = squareAfterMove(gameState.you.head, safeMoves[index]);
    const boardFill = new BoardFill(gameState.blocks, start);
    boardFill.fill();
    const squares = boardFill.get();
    moveSquares[safeMoves[index]] = squares;
    possibleMoves[safeMoves[index]] =
      squares > configuration.FLOOD_FILL_FACTOR * gameState.you.length;
  }
  console.log("FloodFill: " + JSON.stringify(moveSquares));

  if (
    Object.keys(possibleMoves).filter((key) => possibleMoves[key]).length ==
      0 &&
    safeMoves.length > 0
  ) {
    const maxMove = Object.keys(moveSquares).reduce(function (a, b) {
      return moveSquares[a] > moveSquares[b] ? a : b;
    });
    possibleMoves[maxMove] = true;
  }
  return possibleMoves;
}

function pickMove(gameState, safeMoves) {
  let newSafeMoves = safeMoves;
  if (gameState.you.head.x < gameState.board.width / 2) {
    newSafeMoves = newSafeMoves.filter((m) => m != "left");
  } else {
    newSafeMoves = newSafeMoves.filter((m) => m != "right");
  }
  if (gameState.you.head.y < gameState.board.height / 2) {
    newSafeMoves = newSafeMoves.filter((m) => m != "down");
  } else {
    newSafeMoves = newSafeMoves.filter((m) => m != "up");
  }
  if (newSafeMoves.length > 0)
    return newSafeMoves[Math.floor(Math.random() * newSafeMoves.length)];

  return safeMoves[Math.floor(Math.random() * safeMoves.length)];
}

function closerFoodAndDistance(gameState, myHead, boardfood) {
  if (boardfood.length == 0) {
    return [{}, 999, []];
  }

  const paths = boardfood.map((f) => pathToFoodAStar(gameState, myHead, f));
  console.log("PATHS: " + JSON.stringify(paths));
  const distances = paths.map((p) => p.length);
  const minIndex = distances.indexOf(Math.min(...distances));
  if (minIndex == -1) return [{}, 999, []];
  return [boardfood[minIndex], distances[minIndex], paths[minIndex]];
}

function pathToFoodAStar(gameState, h, food) {
  // TODO: Cache these calculations
  const path = bsAStar(gameState.blocks, h, food);
  // console.log("PATH to food " + JSON.stringify(path));
  return path;
}

function minFoodDistanceFromLongerOrSameSnakes(gameState, food) {
  const longerOrSameHeads = gameState.otherSnakes
    .filter((s) => s.length >= gameState.you.length)
    .map((s) => s.head);
  return Math.min(
    ...longerOrSameHeads.map((h) =>
      distanceOfPath(pathToFoodAStar(gameState, h, food))
    )
  );
}

/**
 * If path is empty there is no route, so distance is infinite
 * @param {*} path
 * @returns
 */
function distanceOfPath(path) {
  if (path.length == 0) return Infinity;
  return path.length;
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

  let minDistanceFood = {};
  let distanceToCloserFood = 999;
  let pathToFood = [];

  if (configuration.CHECK_FOOD_CLOSER_TO_OTHERS) {
    const otherHeads = gameState.board.snakes
      .filter((s) => s.id != gameState.you.id)
      .map((s) => s.head);

    const foodNotCloserToLongerSnakes = boardfood.filter(
      (f) =>
        distanceOfPath(pathToFoodAStar(gameState, myHead, f)) <
        minFoodDistanceFromLongerOrSameSnakes(gameState, f)
      // (f) => minFoodDistanceFromLongerOrSameSnakes(gameState, f) > 1
    );

    console.log(
      "foodNotCloserToLongerSnakes: " +
        JSON.stringify(foodNotCloserToLongerSnakes)
    );

    [minDistanceFood, distanceToCloserFood, pathToFood] =
      foodNotCloserToLongerSnakes.length > 0
        ? closerFoodAndDistance(gameState, myHead, foodNotCloserToLongerSnakes)
        : closerFoodAndDistance(gameState, myHead, boardfood);
  } else {
    [minDistanceFood, distanceToCloserFood, pathToFood] = closerFoodAndDistance(
      gameState,
      myHead,
      boardfood
    );
  }

  if (pathToFood.length > 0) {
    // towardsFoodMoves = moveTowardsTarget(myHead, minDistanceFood);
    towardsFoodMoves[pathToFood[0]] = true;
  }

  return [towardsFoodMoves, distanceToCloserFood];
}

function foodPathsAStar(gameState) {
  let towardsFoodMoves = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  let distanceToCloserFood = 999;
  const boardfood = gameState.board.food;
  const myHead = gameState.you.head;

  let paths = [];
  for (let i = 0; i < boardfood.length; i++) {
    const path = bsAStar(gameState.blocks, myHead, boardfood[i]);
    paths.push(path);
    console.log(
      "PATH to " + JSON.stringify(boardfood[i]) + " " + JSON.stringify(path)
    );
  }

  if (paths.length > 0) {
    const lengths = paths.map((p) => p.length);
    const shortestIndex = lengths.indexOf(Math.min(...lengths));
    distanceToCloserFood = paths[shortestIndex].length;

    towardsFoodMoves[paths[shortestIndex][0]] = true;
  }

  return [towardsFoodMoves, distanceToCloserFood];
}

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
  const snakes = gameState.otherSnakes;
  const mySnake = gameState.you;

  for (let i = 0; i < snakes.length; i++) {
    const [dMove, distance] = getDeadlyMoveToSnake(
      gameState,
      mySnake,
      snakes[i]
    );
    if (dMove != undefined) return dMove;
  }

  return undefined;
}

function detectDeadlyMove(gameState) {
  const snakes = gameState.otherSnakes;
  const mySnake = gameState.you;

  for (let i = 0; i < snakes.length; i++) {
    const [dMove, distance] = getDeadlyMoveToSnake(
      gameState,
      snakes[i],
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

function preprocess(gameState) {
  gameState.otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );

  gameState.blocks = new Matrix(gameState.board.width, gameState.board.height);

  // gameState.you.body.forEach((b) => gameState.blocks.set(b.x, b.y));
  // for each block except the last (tail)
  for (let i = 0; i < gameState.you.body.length - 1; i++) {
    gameState.blocks.set(gameState.you.body[i].x, gameState.you.body[i].y);
  }

  gameState.board.snakes.forEach((s) =>
    // s.body.forEach((b) => gameState.blocks.set(b.x, b.y))
    // for each block except the last (tail)
    {
      for (let i = 0; i < s.body.length - 1; i++) {
        gameState.blocks.set(s.body[i].x, s.body[i].y);
      }
    }
  );
}

// cache previous move
var previousDeadlyMove = undefined;

function move(gameState) {
  console.log("\nTURN " + gameState.turn);
  preprocess(gameState);

  const possibleMoves = getPossibleMoves(gameState);
  const nextMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key]
  );

  // const possibleMovesLookAhead = getPossibleMovesDepth(
  //   gameState,
  //   configuration.BFS_DEPTH,
  //   []
  // );

  const possibleMovesLookAhead = getPossibleMovesFloodFill(gameState);

  const myHead = gameState.you.head;

  const longest = Math.max(...gameState.otherSnakes.map((s) => s.length));

  const possibleMovesAvoidingLongerHeads = avoidLongerHeads(gameState);

  const totallySafeMoves = Object.keys(possibleMovesLookAhead).filter(
    (key) =>
      possibleMovesLookAhead[key] && possibleMovesAvoidingLongerHeads[key]
  );

  const safeMoves =
    totallySafeMoves.length > 0
      ? totallySafeMoves
      : Object.keys(possibleMovesLookAhead).filter(
          (key) => possibleMovesLookAhead[key]
        );

  let isAttacking =
    gameState.otherSnakes.length > 0 && gameState.you.length > longest;
  let target = undefined;
  let targetDistance = 999;
  let safeTargetMoves = undefined;

  if (isAttacking) {
    console.log("isAttacking");
    // TODO: now picks first other snake as target
    // target = gameState.otherSnakes[0].head;
    target = gameState.otherSnakes.sort((s) => distance(myHead, s.head))[0]
      .head;
    targetDistance = distance(myHead, target);
    let towardsSnake = moveTowardsTarget(myHead, target);
    safeTargetMoves = Object.keys(towardsSnake).filter(
      (key) =>
        possibleMovesLookAhead[key] &&
        possibleMovesAvoidingLongerHeads[key] &&
        towardsSnake[key]
    );
  }

  const [towardsFoodMoves, distanceToCloserFood] =
    movesTowardsClosestFood(gameState);
  // const [towardsFoodMoves, distanceToCloserFood] = foodPathsAStar(gameState);

  let safeFoodMoves = Object.keys(possibleMovesLookAhead).filter(
    (key) =>
      possibleMovesLookAhead[key] &&
      towardsFoodMoves[key] &&
      possibleMovesAvoidingLongerHeads[key]
  );

  console.log("NEXT MOVES:     " + nextMoves);
  console.log("SAF FOOD MOVES: " + safeFoodMoves);
  console.log("TOT SAFE MOVES: " + totallySafeMoves);
  console.log("FIN SAFE MOVES: " + safeMoves);
  console.log("SAF TARG MOVES: " + safeTargetMoves);

  let moveToMake = undefined;
  let detectedDeadlyMoveFrom = undefined;
  let deadlyMove = undefined;

  if (configuration.CHECK_DEADLY_ATTACK) {
    deadlyMove = getDeadlyMove(gameState);
  }

  if (configuration.CHECK_DEADLY_DEFENCE)
    detectedDeadlyMoveFrom = detectDeadlyMove(gameState);

    
  if (previousDeadlyMove && safeMoves.includes(previousDeadlyMove)) {
    console.log("CONTINUE ATTACK!!!");
    deadlyMove = previousDeadlyMove;
  } else {
    previousDeadlyMove = undefined;
  }

  if (detectedDeadlyMoveFrom && safeMoves.includes(detectedDeadlyMoveFrom)) {
    console.log("AVOID DEADLY MOVE blocking");
    moveToMake = detectedDeadlyMoveFrom;
  } else if (deadlyMove && safeMoves.includes(deadlyMove)) {
    console.log("DEADLY MOVE blocking");
    moveToMake = deadlyMove;
    previousDeadlyMove = deadlyMove;
  } else if (
    safeFoodMoves.length > 0 &&
    distanceToCloserFood < targetDistance
  ) {
    moveToMake = pickMove(gameState, safeFoodMoves);
  } else if (isAttacking && safeTargetMoves.length > 0) {
    moveToMake = pickMove(gameState, safeTargetMoves);
  } else if (safeFoodMoves.length > 0) {
    moveToMake = pickMove(gameState, safeFoodMoves);
  } else {
    moveToMake = pickMove(gameState, safeMoves);
  }

  if (moveToMake == undefined) {
    console.log("Desperate move!");
    moveToMake = pickMove(gameState, nextMoves);
  }

  response = {
    move: moveToMake,
  };

  console.log(`${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`);
  return response;
}

module.exports = {
  configuration: configuration,
  info: info,
  start: start,
  move: move,
  end: end,
  getPossibleMoves: getPossibleMoves,
  preprocess: preprocess,
};
