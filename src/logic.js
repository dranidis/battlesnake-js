const { distance, getTrueKeys, isEqual } = require("./util");
const { Matrix } = require("./bitmatrix");
const { getFloodFillSquares } = require("./boardfill");
const { bsAStar } = require("./battlesnake_astar");
const { processMyFill, processOppFill } = require("./process_ffdata");

var configuration = {
  CHECK_FOOD_CLOSER_TO_OTHERS: true,
  CHECK_DEADLY_ATTACK: true,
  CHECK_DEADLY_DEFENCE: true,
  BFS_DEPTH: 8, // max with Heroku
  MINMAX_DEPTH: 1,
  /**
   * number of extra squares in the area for the snake 
  // to safely enter. 1.5 * length
   */
  FLOOD_FILL_FACTOR: 1.5,
};

function collideSquare(myX, myY, xblock, yblock, possibleMoves) {
  if (myX + 1 == xblock && myY == yblock) possibleMoves.right = false;
  if (myX - 1 == xblock && myY == yblock) possibleMoves.left = false;
  if (myX == xblock && myY + 1 == yblock) possibleMoves.up = false;
  if (myX == xblock && myY - 1 == yblock) possibleMoves.down = false;
}

function avoidLongerHeads(gameState) {
  let possibleMovesAvoidingHeads = {
    up: true,
    down: true,
    left: true,
    right: true,
  };
  const myHead = gameState.you.head;

  const longerSnakeHeads = gameState.board.snakes
    .filter((s) => s.id != gameState.you.id && s.length >= gameState.you.length)
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

function deepCopy(arrayCoord) {
  let copy = [];
  for (let i = 0; i < arrayCoord.length; i++) {
    copy.push(arrayCoord[i]);
  }
  return copy;
}

function getPossibleMovesDepth(gameState, depth, visited) {
  const possibleMoves = getMyPossibleMoves(gameState);
  if (depth == 0) {
    return possibleMoves;
  }
  const safeMoves = getTrueKeys(possibleMoves);

  for (let index = 0; index < safeMoves.length; index++) {
    const newHead = squareAfterMove(gameState.you.head, safeMoves[index]);
    if (visited.filter((h) => isEqual(h, newHead)).length == 0) {
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
      let newSafeMoves = getTrueKeys(newPossibleMoves);

      if (newSafeMoves.length == 0) {
        possibleMoves[safeMoves[index]] = false;
      }
    }
  }
  return possibleMoves;
}

/**
 *
 * @param {*} gameState
 * @param {*} start
 * @param {*} depth
 * @returns
 */
function getMinMaxFloodFill(gameState, start, depth, otherHeads = []) {
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );

  if (otherSnakes.length == 1) {
    const otherSnake = otherSnakes[0];
    const otherHead = otherSnake.head;
    // console.log(`Other head ${JSON.stringify(otherHead)}`)
    const otherMovesMap = getSnakePossibleMoves(gameState, otherSnake);
    const otherMoves = getTrueKeys(otherMovesMap);

    if (depth == 0) {
      let floodFilldata = { you: getFloodFillSquares(gameState, start) };

      let ffMoves = [];
      for (let i = 0; i < otherMoves.length; i++) {
        const newOtherHead = squareAfterMove(otherHead, otherMoves[i]);
        ffMoves.push(getFloodFillSquares(gameState, newOtherHead));
      }
      floodFilldata[otherSnake.id] =
        ffMoves.length > 0 ? Math.max(...ffMoves) : 0;
      return floodFilldata;
    }

    // let maxSquaresCountList = [];
    let maxSquaresCountList = {};

    // get all combinations of moves
    // for each combination of moves

    // TODO: sometimes the returned value is null
    for (let i = 0; i < otherMoves.length; i++) {
      const newOtherHead = squareAfterMove(otherHead, otherMoves[i]);

      const newGameState = applyMove(gameState, start, [newOtherHead]);
      if (newGameState.you.lost == undefined) {
        const squaresCount = getSquaresCountPerMove(newGameState, depth - 1);
        // const maxSquaresCount = Math.max(...Object.values(squaresCount));
        // maxSquaresCountList.push(maxSquaresCount);
        maxSquaresCountList[otherMoves[i]] = squaresCount;
      } else {
        maxSquaresCountList[otherMoves[i]] = {};
      }
    }
    // return Math.min(...maxSquaresCountList);
    return { id: otherSnake.id, data: maxSquaresCountList };
  }

  if (depth == 0) {
    return getFloodFillSquares(gameState, start);
  }

  const newGameState = applyMove(gameState, start);

  const squaresCount = getSquaresCountPerMove(newGameState, depth - 1);
  maxSquaresCount = Math.max(...Object.values(squaresCount));

  return maxSquaresCount;
}

function getSquaresCountPerMove(gameState, depth) {
  const possibleMoves = getMyPossibleMoves(gameState);
  const myHead = gameState.you.head;

  const safeMoves = getTrueKeys(possibleMoves);

  let squaresCount = {};
  for (let index = 0; index < safeMoves.length; index++) {
    const start = squareAfterMove(gameState.you.head, safeMoves[index]);

    const otherHeads = gameState.board.snakes
      .filter((s) => s.id != gameState.you.id)
      .map((s) => s.head);

    const squares = getMinMaxFloodFill(gameState, start, depth, otherHeads);
    // console.log(
    //   `MM depth ${depth} move ${safeMoves[index]} squaresCount ${squares}`
    // );

    squaresCount[safeMoves[index]] = squares;
  }

  return squaresCount;
}

function getPossibleMovesFloodFill(gameState) {
  // console.log(`INIT STATE ${gameState.blocks.toString()}`);

  const getFloodFillData = getSquaresCountPerMove(
    gameState,
    configuration.MINMAX_DEPTH
  );
  // console.log(
  //   `Return squaresCount ${JSON.stringify(getFloodFillData, null, 4)}`
  // );

  const squaresCount = processMyFill(getFloodFillData);
  console.log("FloodFill me : " + JSON.stringify(squaresCount));

  let possibleMoves = { up: false, down: false, left: false, right: false };

  if (gameState.board.snakes.length == 2) {
    const oppSquaresCount = processOppFill(getFloodFillData);
    console.log("FloodFill opp: " + JSON.stringify(oppSquaresCount));

    const oppSquaresCountValues = Object.values(oppSquaresCount);
    if (oppSquaresCountValues.length > 0) {
      const avg =
        oppSquaresCountValues.reduce((a, b) => a + b) /
        oppSquaresCountValues.length;
      const min = Math.min(...oppSquaresCountValues.filter((v) => v < avg));

      if (min < Infinity) {
        // const squaresCountValues = Object.values(squaresCount);
        // const myAvg =
        //   squaresCountValues.reduce((a, b) => a + b) /
        //   squaresCountValues.length;

        const min = Math.min(...oppSquaresCountValues.filter((v) => v < avg));

        const move = Object.keys(oppSquaresCount).filter(
          (k) => oppSquaresCount[k] == min
        )[0];
        if (squaresCount[move] > 
          configuration.FLOOD_FILL_FACTOR * gameState.you.length
          // myAvg
          ) {
          console.log("ATTACKING move: " + move);
          possibleMoves[move] = true;
          return possibleMoves;
        }
      }
    }
  }

  ["up", "down", "right", "left"].forEach((direction) => {
    possibleMoves[direction] =
      squaresCount[direction] != undefined &&
      squaresCount[direction] >
        configuration.FLOOD_FILL_FACTOR * gameState.you.length;
  });

  if (
    getTrueKeys(possibleMoves).length == 0 &&
    Object.keys(squaresCount).length > 0
  ) {
    const maxMove = Object.keys(squaresCount).reduce(function (a, b) {
      return squaresCount[a] > squaresCount[b] ? a : b;
    });
    possibleMoves[maxMove] = true; // get the max move when all moves look bad
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
  // console.log("PATHS: " + JSON.stringify(paths));
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
  const longerOrSameHeads = gameState.board.snakes
    .filter((s) => s.id != gameState.you.id && s.length >= gameState.you.length)
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

    // [minDistanceFood, distanceToCloserFood, pathToFood] =
    //   foodNotCloserToLongerSnakes.length > 0
    //     ? closerFoodAndDistance(gameState, myHead, foodNotCloserToLongerSnakes)
    //     : closerFoodAndDistance(gameState, myHead, boardfood);

    [minDistanceFood, distanceToCloserFood, pathToFood] = closerFoodAndDistance(
      gameState,
      myHead,
      foodNotCloserToLongerSnakes
    );
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

function preprocess(gameState) {
  gameState.blocks = new Matrix(gameState.board.width, gameState.board.height);

  // gameState.you.body.forEach((b) => gameState.blocks.set(b.x, b.y));
  // for each block except the last (tail)
  for (let i = 0; i < gameState.you.body.length - 1; i++) {
    gameState.blocks.set(gameState.you.body[i].x, gameState.you.body[i].y);
  }

  gameState.board.snakes
    .filter((s) => !s.lost)
    .forEach((s) =>
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

function resetPreviousDeadlyMove() {
  previousDeadlyMove = undefined;
}

function isFood(gameState, coord) {
  return gameState.board.food.filter((f) => isEqual(f, coord)).length > 0;
}

function move(gameState) {
  console.log("\nTURN " + gameState.turn);
  preprocess(gameState);

  const possibleMoves = getMyPossibleMoves(gameState);
  const nextMoves = getTrueKeys(possibleMoves);

  // const possibleMovesLookAhead = getPossibleMovesDepth(
  //   gameState,
  //   configuration.BFS_DEPTH,
  //   []
  // );

  const possibleMovesLookAhead = getPossibleMovesFloodFill(gameState);
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );
  const myHead = gameState.you.head;

  const longest = Math.max(...otherSnakes.map((s) => s.length));

  const possibleMovesAvoidingLongerHeads = avoidLongerHeads(gameState);

  const totallySafeMoves = Object.keys(possibleMovesLookAhead).filter(
    (key) =>
      possibleMovesLookAhead[key] && possibleMovesAvoidingLongerHeads[key]
  );

  const safeMoves =
    totallySafeMoves.length > 0
      ? totallySafeMoves
      : getTrueKeys(possibleMovesLookAhead);

  let isAttacking = otherSnakes.length > 0 && gameState.you.length > longest;
  let target = undefined;
  let targetDistance = 999;
  let safeTargetMoves = undefined;

  if (isAttacking) {
    console.log("isAttacking");
    // TODO: now picks first other snake as target
    // target = otherSnakes[0].head;
    target = otherSnakes.sort((s) => distance(myHead, s.head))[0].head;
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
  move: move,
  preprocess: preprocess,
  resetPreviousDeadlyMove,
  getPossibleMovesFloodFill,
  applyMove,
  isFood,
  getMyPossibleMoves,
};
