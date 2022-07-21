const { configuration } = require("./config");
const { distance, getTrueKeys } = require("./util");
const { bsAStar } = require("./battlesnake_astar");
const { preprocess } = require("./board");
const {
  detectDeadlyMove,
  getDeadlyMove,
} = require("./traps");
const {getMyPossibleMoves} =  require("./move")
const { getPossibleMovesFloodFill} = require("./minmax_floodfill")
const { getPathTowardsClosestTail } = require("./path")


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

    // console.log(
    //   "foodNotCloserToLongerSnakes: " +
    //     JSON.stringify(foodNotCloserToLongerSnakes)
    // );

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

// cache previous move
var previousDeadlyMove = undefined;

function resetPreviousDeadlyMove() {
  previousDeadlyMove = undefined;
}


function isHungry(gameState) {
  return gameState.you.health < 30;
}

function move(gameState) {
  console.log("\nTURN " + gameState.turn);
  preprocess(gameState);

  const possibleMoves = getMyPossibleMoves(gameState);
  const nextMoves = getTrueKeys(possibleMoves);

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
    console.log(">> AVOID DEADLY MOVE blocking");
    moveToMake = detectedDeadlyMoveFrom;
  } else if (deadlyMove && safeMoves.includes(deadlyMove)) {
    console.log(">> DEADLY MOVE blocking");
    moveToMake = deadlyMove;
    previousDeadlyMove = deadlyMove;
  } else if (
    safeFoodMoves.length > 0 &&
    (isHungry(gameState) ||
      distanceToCloserFood <= configuration.DISTANCE_TO_FOOD_WHILE_ATTACKING)
  ) {
    console.log(">> Picking up close food");
    moveToMake = pickMove(gameState, safeFoodMoves);
  } else if (isAttacking && safeTargetMoves.length > 0) {
    console.log(">> Attacking");
    moveToMake = pickMove(gameState, safeTargetMoves);
  } else if (safeFoodMoves.length > 0) {
    console.log(">> Going for food");
    moveToMake = pickMove(gameState, safeFoodMoves);
  } else {
    const pathTowardsClosestTail = getPathTowardsClosestTail(gameState);
    if (pathTowardsClosestTail != null) {
      console.log(
        `Examine tail chase ${JSON.stringify(pathTowardsClosestTail)}`
      );
      const chaseTailMove = pathTowardsClosestTail[0];
      if (safeMoves.includes(chaseTailMove)) {
        console.log(">> Chasing tails...");
        moveToMake = chaseTailMove;
      } else {
        console.log(">> Wandering...");
        moveToMake = pickMove(gameState, safeMoves);
      }
    }
  }

  if (moveToMake == undefined) {
    console.log(">>>>>> Desperate move!");
    moveToMake = pickMove(gameState, nextMoves);
  }

  response = {
    move: moveToMake,
  };

  console.log(`${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`);
  return response;
}

module.exports = {
  move: move,
  resetPreviousDeadlyMove,
  getMoveTowardsClosestTail: getPathTowardsClosestTail,
};
