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
const { getTrueKeys, bigIntSerializer } = require("./util");
const { getPathTowardsClosestTail } = require("./path");
const { MinMax } = require("./minmax");
const { isTerminal, children, myChildren } = require("./battlesnake_minmax");
const { getStartTime, getRemainingTime } = require("./time");
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
  const otherSnakes = gameState.board.snakes;

  const getFloodFillData = getSquaresCountPerMove(
    gameState,
    configuration.MINMAX_DEPTH
  );
  if (configuration.debug)
    console.log(
      `Return squaresCount ${JSON.stringify(getFloodFillData, null, 4)}`
    );

  let squaresCount;
  if (otherSnakes.length != 2) {
    squaresCount = processMyFill(getFloodFillData);
  } else {
    const remaining = getRemainingTime();
    console.log("REMAINING", remaining);
    const give = Math.max(remaining - 50, 50);
    console.log("GIVE to mm", give);

    const mmstart = Date.now();
    squaresCount = bsMinMax(gameState, 20, give);
    console.log("MM TIME", Date.now() - mmstart);
    console.log("Remaining time after mm", getRemainingTime());
  }

  console.log("FloodFill me : " + JSON.stringify(squaresCount));

  let possibleMoves = { up: false, down: false, left: false, right: false };

  // if (gameState.board.snakes.length == 2) {
  //   const oppSquaresCount = processOppFill(getFloodFillData);
  //   console.log("FloodFill opp: " + JSON.stringify(oppSquaresCount));

  //   const move = twoPlayerSuggestedAttackingMove(squaresCount, oppSquaresCount);

  //   if (move != null) {
  //     possibleMoves[move] = true;
  //     return possibleMoves;
  //   }
  // }

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
      if (pathTowardsClosestTail.length <= squaresCount[move] + 1) {
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

function bsMinMax(gameState, depth, ms) {
  const minmax = new MinMax(isTerminal, children, heuristic);

  // let moveEval = {}
  // const my_children = myChildren(gameState);
  // for (let i = 0; i < my_children.length; i++) {
  //   const child = my_children[i];
  //   console.log(JSON.stringify(child, bigIntSerializer, 2));
  //   const value = minmax.alphabetaTimed(
  //     child,
  //     depth,
  //     -Infinity,
  //     Infinity,
  //     false,
  //     ms
  //   );
  //   console.log(value);
  //   moveEval[child.mm.myMove] = value
  // }

  // return moveEval

  return myChildren(gameState).reduce((moveEval, state) => {
    moveEval[state.mm.myMove] = minmax.alphabetaTimed(
      state,
      depth,
      -Infinity,
      Infinity,
      false,
      ms
    );
    return moveEval;
  }, {});
}

function heuristic(gameState) {
  if (isTerminal(gameState)) {
    if (gameState.you.lost) return 0;
  }

  otherSnake = gameState.board.snakes.find((s) => s.id != gameState.you.id);
  const oppmoves = getTrueKeys(getSnakePossibleMoves(gameState, otherSnake));
  if (oppmoves.length == 0) return FF_MAX_VALUE;

  return floodFillEvaluation(gameState, gameState.you);
}

module.exports = {
  getPossibleMovesFloodFill,
  twoPlayerSuggestedAttackingMove,
  getSquaresCountPerMove,
  floodFillEvaluation,
  bsMinMax,
  heuristic,
};
