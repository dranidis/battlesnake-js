const {
  move,
  configuration,
  getPossibleMoves,
  preprocess,
  resetPreviousDeadlyMove,
  getPossibleMovesFloodFill,
  applyMove, isFood,
} = require("../src/logic");

const { info } = require("../src/bs_info");

const TIMES = 10;
var boardHeight = 5;
var boardWidth = 5;

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
      { x: 0, y: 4 },
    ]);
    const gameState = createGameState(me, [me]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    for (let i = 0; i < 1; i++) {
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
      { x: 0, y: 3 },
    ]);
    const gameState = createGameState(me, [me]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

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
      { x: 0, y: 3 },
      { x: 0, y: 4 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

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
      { x: 0, y: 1 },
    ]);
    const other = createBattlesnake("other", [
      { x: 4, y: 1 },
      { x: 4, y: 0 },
    ]);
    const longer = createBattlesnake("longer", [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other, 
      // TODO: add the longer snake when look ahead for more than1 snake is implemented
      // longer
    ]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    addFood(gameState, { x: 3, y: 1 });
    // addFood(gameState, { x: 2, y: 0 });

    expect(isFood(gameState, {x:3, y:1})).toBe(true)

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
    for (let i = 0; i < 1; i++) {
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
      { x: 2, y: 3 },
    ]);
    // other back 2 squares
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    for (let i = 0; i < 1; i++) {
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

  test("null values in flood fill look ahead", () => {
  // other back 2 squares

    // 4
    // 3
    // 2 ~ ~ 
    // 1     x x 
    // 0 
    //   0 1 2 3 4
    const me = createBattlesnake("me", [
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]);
    
    const gameState = createGameState(me, [me, other]);
    for (let i = 0; i < 1; i++) {
      const moveResponse = move(gameState);
      const allowedMoves = ["up"];
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

describe("getPossibleMovesFloodFill", () => {
  test("avoid getting trapped with 2 steps ahead flood-fill", () => {
    if (configuration.MINMAX_DEPTH < 2) return;

    boardWidth = 8;
    boardHeight = 8;
    const me = createBattlesnake("me", [
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
    ]);
    const other = createBattlesnake("other", [
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const moves = getPossibleMovesFloodFill(gameState);
    const exp = {
      up: false,
      down: false,
      left: true,
      right: false,
    };
    expect(moves).toStrictEqual(exp);
  });
});

describe("applyMove", () => {
  test("applyMove changes right head of other snake", () => {
    boardWidth = 8;
    boardHeight = 8;
    const me = createBattlesnake("me", [
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
    ]);
    const other = createBattlesnake("other", [
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const newHead = { x: 6, y: 4 };
    const newOtherHead = { x: 6, y: 2 };
    const newGameState = applyMove(gameState, newHead, [newOtherHead]);

    expect(
      newGameState.board.snakes.filter((s) => s.id == "other")[0].body[0]
    ).toBe(newOtherHead);
  });

  test("applyMove changes head of you and your snake in snakes", () => {
    boardWidth = 8;
    boardHeight = 8;
    const me = createBattlesnake("me", [
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
    ]);
    const other = createBattlesnake("other", [
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const newHead = { x: 6, y: 4 };
    const newOtherHead = { x: 6, y: 2 };
    const newGameState = applyMove(gameState, newHead, [newOtherHead]);

    expect(
      newGameState.board.snakes.filter((s) => s.id == "me")[0].body[0]
    ).toBe(newHead);
    expect(newGameState.board.snakes.filter((s) => s.id == "me")[0].head).toBe(
      newHead
    );
  });
});
