const TIMES = 10;
var boardHeight = 5;
var boardWidth = 5;

function setBoardDimensions(w, h) {
  boardWidth = w;
  boardHeight = h;
}

function createGameState(myBattlesnake, allSnakes) {
  return {
    game: {
      id: "",
      ruleset: { name: "", version: "" },
      timeout: 0,
    },
    turn: 0,
    board: {
      height: boardHeight,
      width: boardWidth,
      food: [],
      snakes: allSnakes,
      hazards: [],
    },
    you: myBattlesnake,
  };
}

function createBattlesnake(id, bodyCoords) {
  return {
    id: id,
    name: id,
    health: 0,
    body: bodyCoords,
    latency: "",
    head: bodyCoords[0],
    length: bodyCoords.length,
    shout: "",
    squad: "",
  };
}

function addFood(gameState, coord) {
  gameState.board.food.push(coord);
}

module.exports = {
  createGameState,
  createBattlesnake,
  addFood,
  setBoardDimensions,
  boardHeight,
  boardWidth
};
