const { cloneGameState } = require("./move");
const {
  getMyPossibleMoves,
  getSnakePossibleMoves,
  squareAfterMove,
  applyMove,
} = require("./move");
const { getTrueKeys } = require("./util");
const { MinMax } = require("./minmax");

function isTerminal(gameState) {
  const moves = getTrueKeys(getMyPossibleMoves(gameState));
  const otherSnake = gameState.board.snakes.find(
    (s) => s.id != gameState.you.id
  );
  const oppMoves = getTrueKeys(getSnakePossibleMoves(gameState, otherSnake));

  return (
    moves.length == 0 ||
    gameState.you.lost ||
    gameState.board.snakes.filter((s) => s.id != gameState.you.id && !s.lost)
      .length == 0
  );
}

function myChildren(gameState) {
  const myHead = gameState.you.head;
  const otherSnake = gameState.board.snakes.find(
    (s) => s.id != gameState.you.id
  );
  const moves = getTrueKeys(getMyPossibleMoves(gameState));

  return moves.map((m) => {
    const sq = squareAfterMove(myHead, m);
    newGameState = cloneGameState(gameState);
    newGameState.mm = {};
    newGameState.mm.myMove = m;
    newGameState.mm.newHead = sq;
    newGameState.mm.turnId = otherSnake.id;
    return newGameState;
  });
}

// Adds a structure mm to gameState for minmax
function children(gameState) {
  const myHead = gameState.you.head;
  const otherSnake = gameState.board.snakes.find(
    (s) => s.id != gameState.you.id
  );

  if (gameState.mm.turnId == gameState.you.id) {
    return myChildren(gameState);
  } else {
    const oppMoves = getTrueKeys(
      getSnakePossibleMoves(gameState, otherSnake)
    );
    // console.log("children: oppMoves", oppMoves)

    return oppMoves.map((move) => {
      const otherHead = squareAfterMove(otherSnake.head, move);
      newGameState = applyMove(gameState, gameState.mm.newHead, [otherHead]);
      newGameState.mm.oppMove = move ;
      newGameState.mm.oppHead = [otherHead] ;
      newGameState.mm.turnId = gameState.you.id;
      return newGameState;
    });
  }
}

module.exports = {
  myChildren,
  children,
  isTerminal,
};
