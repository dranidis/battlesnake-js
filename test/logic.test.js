const {
  move,
  configuration,
  getPossibleMoves,
  preprocess,
  resetPreviousDeadlyMove
} = require("../src/logic");

const { info} = require("../src/bs_info")

const TIMES = 10;
const boardHeight = 5;
const boardWidth = 5;

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

// Applies to all tests in this file
beforeEach(() => {
  resetPreviousDeadlyMove();
});

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

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["up", "down", "right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("should never move outside the board bottom left", () => {
    // Arrange
    const me = createBattlesnake("me", [{ x: 0, y: 0 }]);
    const gameState = createGameState(me, [me]);

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["up", "right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("should never move outside the board top left", () => {
    // Arrange
    const me = createBattlesnake("me", [{ x: 0, y: boardHeight - 1 }]);
    const gameState = createGameState(me, [me]);

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["down", "right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("should never move outside the board top right", () => {
    // Arrange
    const me = createBattlesnake("me", [
      { x: boardWidth - 1, y: boardHeight - 1 },
    ]);
    const gameState = createGameState(me, [me]);

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["down", "left"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("should never move outside the board bottom right", () => {
    // Arrange
    const me = createBattlesnake("me", [{ x: boardWidth - 1, y: 0 }]);
    const gameState = createGameState(me, [me]);

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["up", "left"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("should never move to another snake, except to its tail", () => {
    // Arrange
    const me = createBattlesnake("me", [{ x: 3, y: 3 }]);
    const other = createBattlesnake("other", [
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 3 }, // this will go away
    ]);
    const gameState = createGameState(me, [me, other]);

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["up", "right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
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

    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
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

    for (let i = 0; i < 1; i++) {
      const moveResponse = move(gameState);
      // In this state, we should NEVER move left.
      const allowedMoves = ["right", "left"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("can escape because other snake's tail is reduced", () => {
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);

    for (let i = 0; i < 1; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["up"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
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

    if (configuration.CHECK_FOOD_CLOSER_TO_OTHERS)
      expect(allowedMoves).toContain(moveResponse.move);
  });

  test("goes towards closest food when there is shorter snake with same distance", () => {
    // Arrange
    if (!configuration.CHECK_FOOD_CLOSER_TO_OTHERS) return;
    console.log(
      "goes towards closest food when there is shorter snake with same distance"
    );

    const me = createBattlesnake("me", [
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ]);
    const other = createBattlesnake("other", [{ x: 4, y: 1 }]);
    const longer = createBattlesnake("longer", [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other,longer]);
    addFood(gameState, { x: 3, y: 1 });
    addFood(gameState, { x: 2, y: 0 });

    const moveResponse = move(gameState);
    const allowedMoves = ["right"];

    expect(allowedMoves).toContain(moveResponse.move);
  });

  test("deadly attack down", () => {
    if (!configuration.CHECK_DEADLY_ATTACK) return;
    // Arrange
    console.log("deadly attack");

    // 4
    // 3
    // 2   X
    // 1 o X X >
    // 0 o )
    //   0 1 2 3 4
    const me = createBattlesnake("me", [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    // other back 2 squares
    const other = createBattlesnake("other", [
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
    const gameState = createGameState(me, [me, other]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["down"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("deadly attack up", () => {
    if (!configuration.CHECK_DEADLY_ATTACK) return;

    // Arrange
    console.log("deadly attack");

    const me = createBattlesnake("me", [
      { x: 3, y: boardHeight - 2 },
      { x: 2, y: boardHeight - 2 },
      { x: 1, y: boardHeight - 2 },
      { x: 1, y: boardHeight - 3 },
    ]);
    // other back 2 squares
    const other = createBattlesnake("other", [
      { x: 1, y: boardHeight - 1 },
      { x: 0, y: boardHeight - 1 },
      { x: 0, y: boardHeight - 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["up"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("deadly attack left", () => {
    if (!configuration.CHECK_DEADLY_ATTACK) return;

    // Arrange
    console.log("deadly attack");

    const me = createBattlesnake("me", [
      { y: 3, x: 1 },
      { y: 2, x: 1 },
      { y: 1, x: 1 },
      { y: 1, x: 2 },
    ]);
    // other back 2 squares
    const other = createBattlesnake("other", [
      { y: 1, x: 0 },
      { y: 0, x: 0 },
      { y: 0, x: 1 },
    ]);
    const gameState = createGameState(me, [me, other]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["left"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("deadly attack right", () => {
    if (!configuration.CHECK_DEADLY_ATTACK) return;

    // Arrange
    console.log("deadly attack");

    const me = createBattlesnake("me", [
      { y: 3, x: boardWidth - 2 },
      { y: 2, x: boardWidth - 2 },
      { y: 1, x: boardWidth - 2 },
      { y: 1, x: boardHeight - 3 },
    ]);
    // other back 2 squares
    const other = createBattlesnake("other", [
      { y: 1, x: boardWidth - 1 },
      { y: 0, x: boardWidth - 1 },
      { y: 0, x: boardWidth - 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("avoid deadly attack down", () => {
    if (!configuration.CHECK_DEADLY_DEFENCE) return;

    const other = createBattlesnake("other", [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
    // other back 2 squares
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["left"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("prefer going towards the center 1", () => {
    // other back 2 squares
    const me = createBattlesnake("me", [{ x: 1, y: 1 }]);
    const gameState = createGameState(me, [me]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["right", "up"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("prefer going towards the center 2", () => {
    // other back 2 squares
    const me = createBattlesnake("me", [{ x: 1, y: boardHeight - 1 }]);
    const gameState = createGameState(me, [me]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["right", "down"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("prefer going towards the center 1", () => {
    // other back 2 squares
    const me = createBattlesnake("me", [{ x: boardWidth - 1, y: 1 }]);
    const gameState = createGameState(me, [me]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["left", "up"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("prefer going towards the center 2", () => {
    // other back 2 squares
    const me = createBattlesnake("me", [
      { x: boardWidth - 1, y: boardHeight - 1 },
    ]);
    const gameState = createGameState(me, [me]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["left", "down"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });

  test("can move to a snake's tail 1", () => {
    // other back 2 squares

    // 4
    // 3
    // 2 ~ ~ ~
    // 1 X > ] ] ]
    // 0 X [ [ [
    //   0 1 2 3 4
    const me = createBattlesnake("me", [
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ]);
    const other = createBattlesnake("other", [
      { x: 4, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
    ]);
    const other2 = createBattlesnake("other2", [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    const other3 = createBattlesnake("other3", [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other, other2, other3]);
    for (let i = 0; i < TIMES; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["right"];
      expect(allowedMoves).toContain(moveResponse.move);
    }
  });
});

describe("getPossibleMoves", () => {
  test("can go to it's tail", () => {
    // other back 2 squares
    const me = createBattlesnake("me", [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ]);
    const gameState = createGameState(me, [me]);
    preprocess(gameState);

    const moves = getPossibleMoves(gameState);
    const exp = {
      up: true,
      down: true,
      left: true,
      right: false,
    };
    expect(moves).toStrictEqual(exp);
  });

  test("can go to it's tail 2", () => {
    // other back 2 squares

    // 4
    // 3
    // 2
    // 1 [ X
    // 0 < X
    //   0 1 2 3 4
    const me = createBattlesnake("me", [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    const gameState = createGameState(me, [me]);
    preprocess(gameState);

    const moves = getPossibleMoves(gameState);
    const exp = {
      up: true,
      down: false,
      left: false,
      right: false,
    };
    expect(moves).toStrictEqual(exp);
  });

  test("can go to a snake's tail 1", () => {
    // other back 2 squares

    // 4
    // 3
    // 2
    // 1 X > ] X >
    // 0 X
    //   0 1 2 3 4
    const me = createBattlesnake("me", [
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ]);
    const other = createBattlesnake("other", [
      { x: 4, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);

    const moves = getPossibleMoves(gameState);
    const exp = {
      up: true,
      down: true,
      left: false,
      right: true,
    };
    expect(moves).toStrictEqual(exp);
  });
});
