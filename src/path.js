const { bsAStar } = require("./battlesnake_astar");

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


module.exports = {
  getPathTowardsClosestTail
}
