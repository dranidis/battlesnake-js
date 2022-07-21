const { configuration } = require("./config");
const {
  processMyFill,
  processOppFill,
  FF_MAX_VALUE,
} = require("./process_ffdata");
const { getFloodFillSquares } = require("./boardfill");
const {
  isTrapped,
  isTrappedClose,
  isTrappeCloseForSnake,
} = require("./traps");
const {getMyPossibleMoves, getSnakePossibleMoves, squareAfterMove, applyMove} =  require("./move")
const { getTrueKeys } = require("./util");
const { getPathTowardsClosestTail } = require("./path")


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

      const otherIsTrapped = isTrappeCloseForSnake(gameState, otherSnake);
      if (otherIsTrapped) {
        console.log("other snake trapped");
      }
      floodFilldata[otherSnake.id] =
        ffMoves.length > 0 && !otherIsTrapped ? Math.max(...ffMoves) : 0;
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

module.exports = {
  getPossibleMovesFloodFill,
  twoPlayerSuggestedAttackingMove
}
