const { createBattlesnake, createGameState, addFood } = require("./test_util");
const { isTrapped, isTrappedClose, isTrappeCloseForSnake } = require("../src/traps");
const { preprocess } = require("../src/board")


describe("isTrapped ", () => {
  test("isTrapped top", () => {
    const me = createBattlesnake("me", [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ]);
    const gameState = createGameState(me, [me, other]);
    addFood(gameState, { x: 0, y: 3 });

    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrapped(gameState)).toBe(true);
  });

  test("isTrapped bottom", () => {
    const me = createBattlesnake("me", [
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrapped(gameState)).toBe(true);
  });

  test("isTrapped left", () => {
    const me = createBattlesnake("me", [
      { y: 2, x: 0 },
      { y: 3, x: 0 },
    ]);
    const other = createBattlesnake("other", [
      { y: 2, x: 2 },
      { y: 2, x: 3 },
      { y: 2, x: 4 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrapped(gameState)).toBe(true);
  });

  test("isTrapped right", () => {
    const me = createBattlesnake("me", [
      { y: 2, x: 4 },
      { y: 3, x: 4 },
    ]);
    const other = createBattlesnake("other", [
      { y: 2, x: 2 },
      { y: 2, x: 1 },
      { y: 2, x: 0 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrapped(gameState)).toBe(true);
  });

  test("isTrapped right false (there is food)", () => {
    // happened in a game
    const me = createBattlesnake("me", [
      { x: 4, y: 1 },
      { x: 4, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 0, y: 3 },
    ]);
    const gameState = createGameState(me, [me, other]);
    addFood(gameState, { x: 4, y: 3 });
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrapped(gameState)).toBe(false);
  });

  test("isTrapped top false", () => {
    const me = createBattlesnake("me", [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ]);
    const blocking = createBattlesnake("blocking", [
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ]);
    const gameState = createGameState(me, [me, other, blocking]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrapped(gameState)).toBe(false);
  });
});

describe("isTrappedClose ", () => {
  test("isTrappedClose top", () => {
    // happened in a game
    const me = createBattlesnake("me", [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ]);
    const other = createBattlesnake("other", [
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrappedClose(gameState)).toBe(true);
  });

  test("isTrappedClose bottom", () => {
    // happened in a game
    const me = createBattlesnake("me", [
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    const other = createBattlesnake("other", [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrappedClose(gameState)).toBe(true);
  });

  test("isTrappeCloseForSnake bottom", () => {
    // happened in a game
    const other = createBattlesnake("me", [
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    const me = createBattlesnake("other", [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    expect(isTrappeCloseForSnake(gameState, other)).toBe(true);
  });

});
