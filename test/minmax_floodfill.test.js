const {
  createBattlesnake,
  createGameState,
} = require("./test_util");
const { configuration } = require("../src/config");
const { preprocess } = require("../src/board");
const { resetPreviousDeadlyMove } = require("../src/logic");

const {
  twoPlayerSuggestedAttackingMove,
  getPossibleMovesFloodFill,
  floodFillEvaluation,
} = require("../src/minmax_floodfill");
const { setStartTime } = require("../src/time");

// Applies to all tests in this file
beforeEach(() => {
  resetPreviousDeadlyMove();
  configuration.MINMAX_DEPTH = 2;
  configuration.debug = false;
  setStartTime(Date.now());
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

    // TODO:
    //
    // test succeeds only with depth 7
    // in minmax_floodfill.js
    // IN greated depths results are not correct!!
    //
    if (configuration.MINMAX_DEPTH < 2) return;
    setStartTime(Date.now());

    const me = createBattlesnake("me", [
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
      { x: 1, y: 7 },
      { x: 0, y: 7 },
      { x: 0, y: 6 },
      { x: 0, y: 5 },
    ]);
    const other = createBattlesnake("other", [
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
      { x: 1, y: 3 },
      { x: 0, y: 3 },
    ]);
    const gameState = createGameState(me, [me, other], 8, 8);
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

  test("(next move) avoid getting trapped with 2 steps ahead flood-fill", () => {
    if (configuration.MINMAX_DEPTH < 2) return;

    const me = createBattlesnake("me", [
      { x: 7, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
      { x: 1, y: 7 },
      { x: 0, y: 7 },
      { x: 0, y: 6 },
    ]);
    const other = createBattlesnake("other", [
      { x: 6, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
      { x: 0, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other], 8, 8);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const moves = getPossibleMovesFloodFill(gameState);
    const exp = {
      up: false,
      down: true,
      left: false,
      right: false,
    };
    expect(moves).toStrictEqual(exp);
  });

  
  
  test("left only one option, right more options", () => {
    // other back 2 squares

    configuration.MINMAX_DEPTH = 2;
    // configuration.debug = true;
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

    const gameState = createGameState(me, [me, other], 10, 7);
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

describe("floodFillEvaluation", () => {
  test("floodFillEvaluation", () => {

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
    const gameState = createGameState(me, [me, other], 8, 8);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const val = floodFillEvaluation(gameState, me);
    const exp = 53;
    expect(val).toStrictEqual(exp);
  });
});

