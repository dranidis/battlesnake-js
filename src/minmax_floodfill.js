const { configuration } = require("./config");
const {
  processMyFill,
  processOppFill,
  FF_MAX_VALUE,
} = require("./process_ffdata");
const { getFloodFillSquares } = require("./boardfill");
const {
  isTrapped,
  isTrappedSnake,
  isTrappedClose,
  isTrappeCloseForSnake,
} = require("./traps");
const {
  getMyPossibleMoves,
  getSnakePossibleMoves,
  squareAfterMove,
  applyMove,
} = require("./move");
const { getTrueKeys, bigIntSerializer, getMaxKey } = require("./util");
const { getPathTowardsClosestTail } = require("./path");
const { MinMax } = require("./minmax");
const {
  isTerminal,
  children,
  myChildren,
  getPath,
} = require("./battlesnake_minmax");
const { getStartTime, getRemainingTime } = require("./time");

const FF_TIE_VALUE = 30;
/**
 *
 * @param {*} gameState
 * @param {*} start
 * @param {*} depth
 * @returns
 */
function getMinMaxFloodFill(gameState, start, depth, otherHeads = []) {
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id && !s.lost
  );

  if (otherSnakes.length == 1) {
    const otherSnake = otherSnakes[0];

    if (depth == 0) {
      let floodFilldata = {
        you:
          isTrapped(gameState) || isTrappedClose(gameState)
            ? 0
            : getFloodFillSquares(gameState, start),
      };

      // this part is calculated again for each of my moves
      // not necessary
      floodFilldata[otherSnake.id] = floodFillEvaluation(gameState, otherSnake);

      return floodFilldata;
    } else {
      const otherHead = otherSnake.head;
      // console.log(`Other head ${JSON.stringify(otherHead)}`)
      const otherMovesMap = getSnakePossibleMoves(gameState, otherSnake);
      const otherMoves = getTrueKeys(otherMovesMap);

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
      .filter((s) => s.id != gameState.you.id && !s.lost)
      .map((s) => s.head);

    const squares = getMinMaxFloodFill(gameState, start, depth, otherHeads);
    // console.log(
    //   `MM depth ${depth} move ${safeMoves[index]} squaresCount ${squares}`
    // );

    squaresCount[safeMoves[index]] = squares;
  }

  return squaresCount;
}

function getSquaresCountPerLegalMove(gameState) {
  const safeMoves = getTrueKeys(getMyPossibleMoves(gameState));

  let squaresCount = {};
  for (let index = 0; index < safeMoves.length; index++) {
    const start = squareAfterMove(gameState.you.head, safeMoves[index]);
    squaresCount[safeMoves[index]] = getFloodFillSquares(gameState, start);
  }

  return squaresCount;
}

function getPossibleMovesFloodFill(gameState) {
  let squaresCount;

  const allSnakes = gameState.board.snakes;

  if (allSnakes.length == 1) {
    const getFloodFillData = getSquaresCountPerMove(
      gameState,
      configuration.MINMAX_DEPTH
    );
    if (configuration.debug)
      console.log(
        `Return squaresCount ${JSON.stringify(getFloodFillData, null, 4)}`
      );
    squaresCount = processMyFill(getFloodFillData);
  } else {
    const remaining = getRemainingTime();
    console.log("REMAINING", remaining);

    const mmstart = Date.now();
    if (allSnakes.length > 3) {
      const give = Math.max(remaining - 300, 50);
      console.log("GIVE to mm", give);
      squaresCount = bsMinMax(gameState, 1, 50, 0);
    } else if (allSnakes.length == 3) {
      const give = Math.max(remaining - 200, 50);
      console.log("GIVE to mm", give);
      squaresCount = bsMinMax(gameState, 7, give, 0);
    } else {
      const give = Math.max(remaining - 50, 50);
      console.log("GIVE to mm", give);
      squaresCount = bsMinMax(gameState, 11, give, 0);
    }
    console.log("MM TIME", Date.now() - mmstart);
    console.log("Remaining time after mm", getRemainingTime());
  }

  console.log(
    "FloodFill me : " + JSON.stringify(squaresCount),
    configuration.FLOOD_FILL_FACTOR * gameState.you.length
  );

  let possibleMoves = { up: false, down: false, left: false, right: false };

  ["up", "down", "right", "left"].forEach((direction) => {
    possibleMoves[direction] =
      squaresCount[direction] != undefined &&
      squaresCount[direction] >
        configuration.FLOOD_FILL_FACTOR * gameState.you.length;
  });

  const squaresCountValues = Object.values(squaresCount);
  if (squaresCountValues.length > 0) {
    const myAvg =
      squaresCountValues.reduce((a, b) => a + b) / squaresCountValues.length;

    if (myAvg < Infinity) {
      console.log(myAvg, squaresCount);

      // 100.86666666666667 { up: 105.6, down: 101.6, right: 95.4 }
      // should give all moves
      // 70.53333333333333 { up: 79.6, down: 52.6, right: 79.4 }
      // should not give down
      ["up", "down", "right", "left"].forEach((direction) => {
        possibleMoves[direction] =
          squaresCount[direction] > myAvg - 0.1 * myAvg && // threshold 5 below the average
          possibleMoves[direction];
      });
    }
  }

  // no moves satisfy the enter criteria
  // follow the closest tail
  // pick the maximum
  if (
    getTrueKeys(possibleMoves).length == 0 &&
    Object.keys(squaresCount).length > 0
  ) {
    const maxMove = getMaxKey(squaresCount);

    const pathTowardsClosestTail = getPathTowardsClosestTail(gameState);
    if (pathTowardsClosestTail != null) {
      console.log(
        `Examine tail chase ${JSON.stringify(pathTowardsClosestTail)}`
      );
      const move = pathTowardsClosestTail[0];
      if (
        squaresCount[move] > 1 && // to avoid the situation where
        // a snake eats a new food and tail grows
        pathTowardsClosestTail.length <= squaresCount[move] + 1
      ) {
        console.log(`TAIL CHASE! `);
        possibleMoves[move] = true;
        return possibleMoves;
      }
    }
    console.log(`MAX MOVE! ${maxMove}`);
    possibleMoves[maxMove] = true;
    return possibleMoves;
  }
  return possibleMoves;
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
    // console.log(`min: ${min} max: ${max}`);

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

function floodFillEvaluation(gameState, snake) {
  if (snake.lost) throw `Should not be called for lost snakes ${snake.id}`;

  const head = snake.head;
  const moves = getTrueKeys(getSnakePossibleMoves(gameState, snake));

  const ffMoves = moves.map((m) =>
    getFloodFillSquares(gameState, squareAfterMove(head, m))
  );

  const isTrappedClose = isTrappeCloseForSnake(gameState, snake);
  if (isTrappedClose) {
    console.log(`Trapped (close): ${snake.id}`);
  }

  const isTrapped = isTrappedSnake(gameState, snake);
  if (isTrappedClose) {
    console.log(`Trapped: ${snake.id}`);
  }
  return ffMoves.length > 0 && !(isTrappedClose || isTrapped)
    ? Math.max(...ffMoves)
    : 0;
}

function bsMinMax(gameState, depth, ms, timePerRecursiveCall = 2) {
  const start = Date.now();
  const endAt = start + ms;

  const myChildrenStates = myChildren(gameState);

  let bestResult = {};
  let iterDepth = 3;
  while (Date.now() < endAt && iterDepth <= depth) {
    const minmax = new MinMax(isTerminal, children, heuristic, getPath);
    minmax.timePerRecursiveCall = timePerRecursiveCall;
    const timeAvailable = endAt - Date.now();
    const result = myChildrenStates.reduce((moveEval, state) => {
      moveEval[state.mm.myMove] = minmax.alphabetaTimed(
        state,
        iterDepth,
        -Infinity,
        Infinity,
        false,
        timeAvailable / myChildrenStates.length
      );
      return moveEval;
    }, {});
    console.log("Time per call", (Date.now() - start) / minmax.nodesVisited);
    console.log(iterDepth, result);

    const timeOut = Object.values(result).some((v) => v == undefined);

    if (!timeOut) {
      ["up", "down", "left", "right"].forEach((direction) => {
        if (result[direction] != undefined)
          bestResult[direction] = result[direction];
      });
    } else {
      break;
    }

    console.log("bestresult", bestResult);
    iterDepth += 2;
  }

  return bestResult;
}

function heuristic(gameState) {
  const otherSnakes = gameState.board.snakes.filter(
    (s) => s.id != gameState.you.id
  );

  let otherFloodFill = 0;
  if (otherSnakes.length == 1) {
    if (otherSnakes[0].lost) {
      return FF_MAX_VALUE;
    } else {
      otherFloodFill = floodFillEvaluation(gameState, otherSnakes[0]);
    }
  }

  if (isTerminal(gameState)) {
    const myMoves = getTrueKeys(getMyPossibleMoves(gameState));
    // console.log(myMoves);
    if (myMoves.length == 0 || gameState.you.lost) {
      // check if other snake lost too!
      // a tie is better in unavoidable situations
      if (gameState.you.lost && otherSnakes.some((s) => s.lost)) {
        console.log("TIE!!!!");
        return FF_TIE_VALUE;
      }
      //
      // console.log(gameState);
      return 0 + gameState.mm.path.length / 10 - otherFloodFill;
    }
  }

  otherSnakeMoves = gameState.board.snakes
    .filter((s) => s.id != gameState.you.id && !s.lost)
    .map((otherSnake) =>
      getTrueKeys(getSnakePossibleMoves(gameState, otherSnake))
    );

  if (otherSnakeMoves.some((m) => m.length == 0)) return FF_MAX_VALUE;
  // const oppmoves = getTrueKeys(getSnakePossibleMoves(gameState, otherSnake));
  // if (oppmoves.length == 0) return FF_MAX_VALUE;

  const floodFill = floodFillEvaluation(gameState, gameState.you);
  const health = gameState.you.health / 5;
  return floodFill + health - otherFloodFill;
}

module.exports = {
  getPossibleMovesFloodFill,
  twoPlayerSuggestedAttackingMove,
  getSquaresCountPerMove,
  floodFillEvaluation,
  bsMinMax,
  heuristic,
  getSquaresCountPerLegalMove,
};
