const { createBattlesnake, createGameState } = require("./test_util");
const { preprocess } = require("../src/board");
const { bsMinMax } = require("../src/minmax_floodfill");

describe("min max", () => {
  test("min max", () => {
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

    const val = bsMinMax(gameState, 5, 200);
    const exp = { down: 2, left: 53, right: 50 };
    expect(val).toStrictEqual(exp);
  });
});

describe("bsMinMax", () => {
  test("bsMinMax", () => {
    const me = createBattlesnake("me", [
      { x: 4, y: 3 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other]);
    preprocess(gameState);
    console.log(gameState.blocks.toString());

    const val = bsMinMax(gameState, 50, 200);
    console.log(val);
    expect(val.down).toBe(0);
  });
});

describe("bsMinMax 2", () => {
  test("bsMinMax 2", () => {
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 1 },
      { x: 4, y: 0 },
    ]);
    const gameState = createGameState(me, [me, other], 8, 8);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 100, 500);
    console.log("VAL", val);
    expect(val.right).toBe(0);
  });
});
