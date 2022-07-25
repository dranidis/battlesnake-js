const { cloneGameState } = require("./move");
const {
  getMyPossibleMoves,
  getSnakePossibleMoves,
  squareAfterMove,
  applyMove,
} = require("./move");
const { getTrueKeys, combine } = require("./util");
const { MinMax } = require("./minmax");

function isTerminal(gameState) {
  const myMoves = getTrueKeys(getMyPossibleMoves(gameState));

  return (
    myMoves.length == 0 ||
    gameState.you.lost ||
    gameState.board.snakes
      .filter((snake) => snake.id != gameState.you.id)
      .every((snake) => snake.lost)
  );
}

function myChildren(gameState) {
  const myHead = gameState.you.head;
  const moves = getTrueKeys(getMyPossibleMoves(gameState));

  return moves.map((m) => {
    const sq = squareAfterMove(myHead, m);
    let newGameState = cloneGameState(gameState);
    newGameState.mm = {};
    newGameState.mm.myMove = m;
    newGameState.mm.newHead = sq;
    newGameState.mm.turnId = "opponents";
    return newGameState;
  });
}

// Adds a structure mm to gameState for minmax
function children(gameState) {
  if (gameState.mm.turnId == gameState.you.id) {
    return myChildren(gameState);
  } else {
    const otherSnakes = gameState.board.snakes.filter(
      (s) => s.id != gameState.you.id
    );

    // oppMoves :
    // combine receives : [[u, r], [d, u], [d, l,r]] a list for each snake
    // and produces a list of all combinations:
    // [[u,d,d], [u,d,l], [u,d,r],
    //  [u,u,d], [u,u,l], [u,u,r],
    //  [r,d,d], [r,d,l], [r,d,r],
    //  [r,u,d], [r,u,l], [r,u,r]]
    const oppMovesCombinations = combine(
      otherSnakes.map((otherSnake) =>
        getTrueKeys(getSnakePossibleMoves(gameState, otherSnake))
      )
    );
    // console.log("children: oppMoves", oppMoves)

    return oppMovesCombinations.map((oppMovesComb) => {

      const otherHeads = oppMovesComb.map((move, i) => squareAfterMove(otherSnakes[i].head, move));
      let newGameState = applyMove(gameState, gameState.mm.newHead, otherHeads);
      newGameState.mm.oppMoves = oppMovesComb;
      newGameState.mm.oppHeads = otherHeads;
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
