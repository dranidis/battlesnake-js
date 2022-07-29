const { bsAStar } = require("./battlesnake_astar");
const { squareAfterMove, isFood } = require("./move");


const MAX_DISTANCE = 999;

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

function closerFoodAndDistance(gameState, myHead, boardfood, safeMoves) {
  if (boardfood.length == 0) {
    return [{}, MAX_DISTANCE, []];
  }

  let shortestPath;
  let fromMove;

  let shortestPathLength = Infinity;

  safeMoves.forEach((m) => {
    const sq = squareAfterMove(myHead, m);
    if (isFood(gameState, sq)) {
      shortestPath = []
      fromMove = m;
    } else {
      const paths = boardfood.map((f) => pathToTargetAStar(gameState, sq, f));
      paths.filter(p => p.length > 0).forEach((p) => {
        if (p.length < shortestPathLength) {
          shortestPath = p;
          shortestPathLength = p.length;
          fromMove = m;
        }
      });
    }

  });

  if (shortestPath == undefined) return [{}, MAX_DISTANCE, []];

  shortestPath.unshift(fromMove);
  return [{}, shortestPath.length, shortestPath];
}

function pathToTargetAStar(gameState, h, food) {
  // TODO: Cache these calculations
  const path = bsAStar(gameState.blocks, h, food);
  // console.log("PATH to food " + JSON.stringify(path));
  return path;
}


module.exports = {
  getPathTowardsClosestTail,
  closerFoodAndDistance, 
  pathToTargetAStar
}
