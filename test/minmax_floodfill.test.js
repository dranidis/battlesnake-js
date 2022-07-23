const { createBattlesnake, createGameState, addFood, setBoardDimensions, boardHeight, boardWidth } = require("./test_util");
const { configuration } = require("../src/config");
const { preprocess } = require("../src/board")
const { resetPreviousDeadlyMove } = require("../src/logic");


const {
  twoPlayerSuggestedAttackingMove,
  getPossibleMovesFloodFill,
} = require("../src/minmax_floodfill");

// Applies to all tests in this file
beforeEach(() => {
  resetPreviousDeadlyMove();
  setBoardDimensions(5,5)
  configuration.MINMAX_DEPTH = 2
});

describe("twoPlayerSuggestedAttackingMove", () => {
  test("opponent loses anyway we should prefer the correct move from our FF", () => {
    // happened in a game
    const squaresCount = { left: 61, right: 3 };
    const oppSquaresCount = { left: 7, right: 3 };
    expect(twoPlayerSuggestedAttackingMove(squaresCount, oppSquaresCount)).toBe(
      "left"
    );
  });

  test("one of the best two moves reduces also the opponent", () => {
    // happened in a game
    const squaresCount = { up: 31, down: 46, left: 46 };
    const oppSquaresCount = { up: 13, down: 46, left: 15 };
    expect(twoPlayerSuggestedAttackingMove(squaresCount, oppSquaresCount)).toBe(
      "left"
    );
  });

  test("take an attacking move reducing the opponent. It will also reduce your territory", () => {
    // happened in a game
    const squaresCount = { up: 31, down: 46, left: 46 };
    const oppSquaresCount = { up: 13, down: 46, left: 40 };
    expect(twoPlayerSuggestedAttackingMove(squaresCount, oppSquaresCount)).toBe(
      "up"
    );
  });
});

describe("getPossibleMovesFloodFill", () => {
  test("avoid getting trapped with 2 steps ahead flood-fill", () => {
    if (configuration.MINMAX_DEPTH < 2) return;
    setBoardDimensions(8,8)

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

  test("solving bug in FF 0 value is wrong for all moves (check with depth 2)", () => {
    // other back 2 squares
    configuration.MINMAX_DEPTH = 1;
    const me = createBattlesnake("me", [
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
      { x: 0, y: 4 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
    ]);

    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    configuration.MINMAX_DEPTH = 2;
    console.log("MIN_MAN_DEPTH " + configuration.MINMAX_DEPTH);
    const moves = getPossibleMovesFloodFill(gameState);
    console.log(`moves ${JSON.stringify(moves)}`);
    const exp = {
      up: false,
      down: true,
      left: false, // does not fit
      right: false,
    };
    expect(moves).toStrictEqual(exp);
  });

  test("solving bug in FF 0 value is wrong for all moves (check with depth 1)", () => {
    // other back 2 squares
    configuration.MINMAX_DEPTH = 1;
    const me = createBattlesnake("me", [
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
      { x: 0, y: 4 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
    ]);

    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    configuration.MINMAX_DEPTH = 1;
    console.log("MIN_MAN_DEPTH " + configuration.MINMAX_DEPTH);
    const moves = getPossibleMovesFloodFill(gameState);
    console.log(`moves ${JSON.stringify(moves)}`);
    const exp = {
      up: false,
      down: true,
      left: false, // does not fit
      right: false,
    };
    expect(moves).toStrictEqual(exp);
  });

  test("left only one option, right more options", () => {
    // other back 2 squares
    setBoardDimensions(10,7)

    configuration.MINMAX_DEPTH = 2;
    configuration.debug = true;
    const me = createBattlesnake("me", [
      { x: 5, y: 6 },
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 5, y: 3 },
      { x: 5, y: 2 },
    ]);
    const other = createBattlesnake("other", [
      { x: 4, y: 3 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ]);

    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    console.log("MIN_MAN_DEPTH " + configuration.MINMAX_DEPTH);
    const moves = getPossibleMovesFloodFill(gameState);
    console.log(`moves ${JSON.stringify(moves)}`);
    const exp = {
      up: false,
      down: false,
      left: false, // will lose here
      right: true,
    };
    expect(moves).toStrictEqual(exp);
  });

  test("chase tail", () => {
    configuration.MINMAX_DEPTH = 2;
    const me = createBattlesnake("me", [
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
      { x: 0, y: 4 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 3 },
    ]);

    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const moves = getPossibleMovesFloodFill(gameState);
    console.log(`moves ${JSON.stringify(moves)}`);
    const exp = {
      up: false,
      down: false,
      left: false,
      right: true, //chase the tail
    };
    expect(moves).toStrictEqual(exp);
  });
});
