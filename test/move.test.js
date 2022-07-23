const {
  createBattlesnake,
  createGameState,
  addFood,
  setBoardDimensions,
} = require("./test_util");
const { preprocess } = require("../src/board");
const { applyMove, isFood } = require("../src/move");
const { getMyPossibleMoves } = require("../src/move");

// Applies to all tests in this file
beforeEach(() => {
  boardHeight = 5;
  boardWidth = 5;
});

describe("getMyPossibleMoves", () => {
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

    const moves = getMyPossibleMoves(gameState);
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

    const moves = getMyPossibleMoves(gameState);
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

    const moves = getMyPossibleMoves(gameState);
    const exp = {
      up: true,
      down: true,
      left: false,
      right: true,
    };
    expect(moves).toStrictEqual(exp);
  });
});
describe("applyMove", () => {
  test("applyMove changes right head of other snake", () => {
    setBoardDimensions(8, 8);
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
    setBoardDimensions(8, 8);
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

  test("applyMove snake eats food", () => {
    const me = createBattlesnake("me", [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);

    const gameState = createGameState(me, [me]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const newHead = { x: 0, y: 1 };
    addFood(gameState, newHead);
    addFood(gameState, {x:4, y:4});
    const newGameState = applyMove(gameState, newHead, []);

    expect(isFood(newGameState, newHead)).toBe(false);

    expect(newGameState.board.food.length).toBe(1);
    expect(
      newGameState.board.snakes.filter((s) => s.id == "me")[0].body.length
    ).toBe(4);
  });
});
