const { configuration } = require("./config");
const { distance, getTrueKeys, isEqual, squareAfterMove } = require("./util");
const { getFloodFillSquares } = require("./boardfill");
const { bsAStar } = require("./battlesnake_astar");
const { isEmpty, preprocess } = require("./board");
const {
  processMyFill,
  processOppFill,
  FF_MAX_VALUE,
} = require("./process_ffdata");

const MAX_DISTANCE = 999;

function collideSquare(myX, myY, xblock, yblock, possibleMoves) {
  if (myX + 1 == xblock && myY == yblock) possibleMoves.right = false;
  if (myX - 1 == xblock && myY == yblock) possibleMoves.left = false;
  if (myX == xblock && myY + 1 == yblock) possibleMoves.up = false;
  if (myX == xblock && myY - 1 == yblock) possibleMoves.down = false;
}

function avoidLongerOrEqualHeads(gameState) {
  let possibleMovesAvoidingHeads = {
    up: true,
    down: true,
    left: true,
    right: true,
  };
  const myHead = gameState.you.head;

  const longerOrEqualSnakeHeads = gameState.board.snakes
    .filter((s) => s.id != gameState.you.id && s.length >= gameState.you.length)
    .map((s) => s.head);

  for (let index = 0; index < longerOrEqualSnakeHeads.length; index++) {
    x = longerOrEqualSnakeHeads[index].x;
    y = longerOrEqualSnakeHeads[index].y;
    collideSquare(myHead.x, myHead.y, x + 1, y, possibleMovesAvoidingHeads);
    collideSquare(myHead.x, myHead.y, x - 1, y, possibleMovesAvoidingHeads);
    collideSquare(myHead.x, myHead.y, x, y + 1, possibleMovesAvoidingHeads);
    collideSquare(myHead.x, myHead.y, x, y - 1, possibleMovesAvoidingHeads);
  }
  return possibleMovesAvoidingHeads;
}

function moveTowardsTargetDirection(myHead, target) {
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

function getPathTowardsClosestTail(gameState) {
  const myHead = gameState.you.head;
  const snakeTails = gameState.board.snakes.map((s) => s.body.slice(-1)[0]);
  const pathsToSnakeTails = snakeTails.map((tail) =>
    bsAStar(gameState.blocks, myHead, tail)
  );
  // console.log(`paths ${JSON.stringify(pathsToSnakeTails)}`);
  const minLength = Math.min(
    ...pathsToSnakeTails.filter((p) => p.length > 0).map((p) => p.length)
  );
  // console.log(`minLength ${minLength}`);

  const shortestPathIndex = pathsToSnakeTails.findIndex(
    (p) => p.length == minLength
  );
  // console.log(`shortestPathIndex ${shortestPathIndex}`);
  return shortestPathIndex == -1 ? null : pathsToSnakeTails[shortestPathIndex];
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
      let floodFilldata = {
        you:
          isTrapped(gameState) || isTrappedClose(gameState)
            ? 0
            : getFloodFillSquares(gameState, start),
      };

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

function twoPlayerSuggestedAttackingMove(squaresCount, oppSquaresCount) {
  const oppSquaresCountValues = Object.values(oppSquaresCount);
  if (oppSquaresCountValues.length > 0) {
    // const avg =
    //   oppSquaresCountValues.reduce((a, b) => a + b) /
    //   oppSquaresCountValues.length;

    // const min = Math.min(...oppSquaresCountValues.filter((v) => v < avg));
    const min = Math.min(...oppSquaresCountValues);
    const max = Math.max(
      ...oppSquaresCountValues.filter((v) => v != FF_MAX_VALUE)
    );
    console.log(`min: ${min} max: ${max}`);

    if (max != -Infinity && min < max / 2) {
      console.log("BLOCKING OPPORTUNITY!");
      const squaresCountValues = Object.values(squaresCount);

      const myMax = Math.max(...squaresCountValues);
      const myAvg =
        squaresCountValues.reduce((a, b) => a + b) / squaresCountValues.length;
      console.log(`myAvg: ${myAvg} `);

      // const min = Math.min(...oppSquaresCountValues.filter((v) => v < avg));
      // const move = Object.keys(oppSquaresCount).filter(
      //   (k) => oppSquaresCount[k] == min
      // )[0];

      const products = squaresCountValues.map(
        (x, i) => x - oppSquaresCountValues[i]
      );
      const maxProduct = Math.max(...products);
      const maxIndex = products.indexOf(maxProduct);

      const move = Object.keys(oppSquaresCount)[maxIndex];

      console.log(`Move ${move} ${squaresCount[move]} products ${products}`);
      if (squaresCount[move] > myMax / 1.5) {
        console.log("ATTACKING move: " + move);
        return move;
      }
    }
  }
  return null;
}

function getPossibleMovesFloodFill(gameState) {
  // console.log(`INIT STATE ${gameState.blocks.toString()}`);

  const getFloodFillData = getSquaresCountPerMove(
    gameState,
    configuration.MINMAX_DEPTH
  );
  if (configuration.debug)
    console.log(
      `Return squaresCount ${JSON.stringify(getFloodFillData, null, 4)}`
    );

  const squaresCount = processMyFill(getFloodFillData);
  console.log("FloodFill me : " + JSON.stringify(squaresCount));

  let possibleMoves = { up: false, down: false, left: false, right: false };

  if (gameState.board.snakes.length == 2) {
    const oppSquaresCount = processOppFill(getFloodFillData);
    console.log("FloodFill opp: " + JSON.stringify(oppSquaresCount));

    const move = twoPlayerSuggestedAttackingMove(squaresCount, oppSquaresCount);

    if (move != null) {
      possibleMoves[move] = true;
      return possibleMoves;
    }
  }

  ["up", "down", "right", "left"].forEach((direction) => {
    possibleMoves[direction] =
      squaresCount[direction] != undefined &&
      squaresCount[direction] >
        configuration.FLOOD_FILL_FACTOR * gameState.you.length;
  });

  // no moves satisfy the enter criteria
  // follow the closest tail
  // pick the maximum
  if (
    getTrueKeys(possibleMoves).length == 0 &&
    Object.keys(squaresCount).length > 0
  ) {
    const pathTowardsClosestTail = getPathTowardsClosestTail(gameState);
    if (pathTowardsClosestTail != null) {
      console.log(
        `Examine tail chase ${JSON.stringify(pathTowardsClosestTail)}`
      );
      const move = pathTowardsClosestTail[0];
      if (pathTowardsClosestTail.length <= squaresCount[move]) {
        console.log(`TAIL CHASE! `);
        possibleMoves[move] = true;
        return possibleMoves;
      }
    }
    console.log(`MAX MOVE! `);

    const maxMove = Object.keys(squaresCount).reduce(function (a, b) {
      return squaresCount[a] > squaresCount[b] ? a : b;
    });
    console.log(`MAX MOVE! ${maxMove}`);
    possibleMoves[maxMove] = true;
    return possibleMoves;
    // squaresCount[maxMove] > gameState.you.length; // get the max move when all moves look bad
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
    return [{}, MAX_DISTANCE, []];
  }

  const paths = boardfood.map((f) => pathToFoodAStar(gameState, myHead, f));
  // console.log("PATHS: " + JSON.stringify(paths));
  const distances = paths.map((p) => p.length);
  const minIndex = distances.indexOf(Math.min(...distances));
  if (minIndex == -1) return [{}, MAX_DISTANCE, []];
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
  let distanceToCloserFood = MAX_DISTANCE;
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
      !gameState.board.food.some(f => f.y == myHead.y) && 
      longerSnakeHeads.some((h) => h.x == myHead.x && h.y == myHead.y - 2) &&
      isEmpty(gameState, { x: myHead.x, y: myHead.y - 1 })) ||
    // bottom case
    (myHead.y == 0 &&
      !gameState.board.food.some(f => f.y == myHead.y) && 
      longerSnakeHeads.some((h) => h.x == myHead.x && h.y == myHead.y + 2) &&
      isEmpty(gameState, { x: myHead.x, y: myHead.y + 1 })) ||
    // left case
    (myHead.x == 0 &&
      !gameState.board.food.some(f => f.x == myHead.x) && 
      longerSnakeHeads.some((h) => h.y == myHead.y && h.x == myHead.x + 2) &&
      isEmpty(gameState, { y: myHead.y, x: myHead.x + 1 })) ||
    // right case
    (myHead.x == gameState.board.width - 1 &&
      !gameState.board.food.some(f => f.x == myHead.x) && 
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

function isTrappedClose(gameState) {
  const myHead = gameState.you.head;
  const myBody = gameState.you.body;
  const myDirection = direction(myBody);
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );

  if (
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
  ) {
    console.log("TRAPPED CLOSE");
    return true;
  }
  return false;
}



// cache previous move
var previousDeadlyMove = undefined;

function resetPreviousDeadlyMove() {
  previousDeadlyMove = undefined;
}

function isFood(gameState, coord) {
  return gameState.board.food.some((f) => isEqual(f, coord));
}

function isHungry(gameState) {
  return gameState.you.health < 30;
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
  console.log(
    `LOOK ahead moves: ${JSON.stringify(getTrueKeys(possibleMovesLookAhead))}`
  );
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );
  const myHead = gameState.you.head;

  const longest = Math.max(...otherSnakes.map((s) => s.length));

  const possibleMovesAvoidingLongerHeads = avoidLongerOrEqualHeads(gameState);

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
  let targetDistance = MAX_DISTANCE;
  let safeTargetMoves = undefined;

  if (isAttacking) {
    console.log("isAttacking");
    // TODO: now picks first other snake as target
    // target = otherSnakes[0].head;
    target = otherSnakes.sort((s) => distance(myHead, s.head))[0].head;
    targetDistance = distance(myHead, target);
    let towardsSnake = moveTowardsTargetDirection(myHead, target);
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
    (isHungry(gameState) ||
      distanceToCloserFood <= configuration.DISTANCE_TO_FOOD_WHILE_ATTACKING)
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
  twoPlayerSuggestedAttackingMove,
  isTrapped,
  getMoveTowardsClosestTail: getPathTowardsClosestTail,
  isTrappedClose,
};
