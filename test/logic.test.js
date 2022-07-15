const { info, move } = require("../src/logic");

function createGameState(myBattlesnake, allSnakes) {
  return {
    game: {
      id: "",
      ruleset: { name: "", version: "" },
      timeout: 0,
    },
    turn: 0,
    board: {
      height: 5,
      width: 5,
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

describe("Battlesnake API Version", () => {
  test("should be api version 1", () => {
    const result = info();
    expect(result.apiversion).toBe("1");
  });
});

describe("Battlesnake Moves", () => {
  test("should never move into its own neck", () => {
    // Arrange
    const me = createBattlesnake("me", [
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ]);
    const gameState = createGameState(me, [me]);

    const moveResponse = move(gameState);
    // In this state, we should NEVER move left.
    const allowedMoves = ["up", "down", "right"];
    expect(allowedMoves).toContain(moveResponse.move);
  });

  test("should never get trapped inside its own body", () => {
    // Arrange
    const me = createBattlesnake("me", [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ]);
    const gameState = createGameState(me, [me]);

    const moveResponse = move(gameState);
    // In this state, we should NEVER move left.
    const allowedMoves = ["right"];
    expect(allowedMoves).toContain(moveResponse.move);
  });

  test("can escape due to its length", () => {
    // Arrange
    const me = createBattlesnake("me", [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
    const gameState = createGameState(me, [me]);

    const moveResponse = move(gameState);
    // In this state, we should NEVER move left.
    const allowedMoves = ["right", "left"];
    expect(allowedMoves).toContain(moveResponse.move);
  });

  test("goes towards closest food", () => {
    // Arrange
    console.log("goes towards closest food");
    const me = createBattlesnake("me", [{ x: 1, y: 1 }]);
    const gameState = createGameState(me, [me]);
    addFood(gameState, { x: 3, y: 1 });
    addFood(gameState, { x: 1, y: 4 });

    const moveResponse = move(gameState);
    const allowedMoves = ["right"];
    expect(allowedMoves).toContain(moveResponse.move);
  });

  test("goes towards closest food unless there is another snake closer to the food", () => {
    // Arrange
    console.log(
      "goes towards closest food unless there is another snake closer to the food"
    );

    const me = createBattlesnake("me", [{ x: 1, y: 1 }]);
    const other = createBattlesnake("other", [{ x: 4, y: 1 }]);
    const gameState = createGameState(me, [me, other]);
    addFood(gameState, { x: 3, y: 1 });
    addFood(gameState, { x: 1, y: 4 });

    const moveResponse = move(gameState);
    const allowedMoves = ["up"];
    expect(allowedMoves).toContain(moveResponse.move);
  });
});
