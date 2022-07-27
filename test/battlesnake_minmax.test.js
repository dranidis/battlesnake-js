const { createBattlesnake, createGameState, addFood } = require("./test_util");
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

    // give endless time
    const val = bsMinMax(gameState, 5, Infinity);
    console.log(val);
    const exp = { down: 2, left: 53, right: 50 };
    expect(val.left).toBeGreaterThan(40);
    expect(val.right).toBeGreaterThan(40);
    expect(val.down).toBeLessThan(40);
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

    const val = bsMinMax(gameState, 7, Infinity);
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
    const val = bsMinMax(gameState, 7, Infinity);
    console.log("VAL", val);
    expect(val.right).toBe(0);
  });
});

describe("bsMinMax 11x11", () => {
  test("bsMinMax 11x11 small", () => {
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
    const gameState = createGameState(me, [me, other], 11, 11);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 7, Infinity);
    console.log("VAL", val);
    expect(val.right).toBe(0);
  });

  test("bsMinMax 11x11 2", () => {
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 6 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
      { x: 2, y: 8 },
    ]);
    const gameState = createGameState(me, [me, other], 11, 11);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 8, Infinity);
    console.log("VAL", val);
    expect(val.right).toBe(val.left);
  });

  test("bsMinMax 11x11 2 limited time", () => {
    const me = createBattlesnake("me", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const other = createBattlesnake("other", [
      { x: 3, y: 6 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
      { x: 2, y: 8 },
    ]);
    const gameState = createGameState(me, [me, other], 11, 11);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 5, Infinity, 2);
    console.log("VAL", val);
    expect(val.right).toBeGreaterThan(100);
    expect(val.left).toBeGreaterThan(100);
  });


  test("bsMinMax 11x11 2 limited time (trapped)", () => {
    const me = createBattlesnake("me", [
      { x: 0, y: 9 },
      { x: 1, y: 9 },
      { x: 2, y: 9 },
      { x: 3, y: 9 },
      { x: 4, y: 9 },
      { x: 5, y: 9 },
      { x: 6, y: 9 },
      { x: 7, y: 9 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
      { x: 10, y: 9 },
    ]);
    const other = createBattlesnake("other", [
      { x: 2, y: 6 },
      { x: 2, y: 7 },
      { x: 2, y: 8 },
      { x: 3, y: 8 },
      { x: 4, y: 8 },
      { x: 5, y: 8 },
      { x: 6, y: 8 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
      { x: 9, y: 8 },
      { x: 9, y: 7 },
    ]);
    const gameState = createGameState(me, [me, other], 11, 11);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 7, Infinity, 2.5);
    console.log("VAL", val);
    expect(val.down).toBe(0);
  });

  test("bsMinMax 11x11 2 limited time (trapped in 1)", () => {
    const me = createBattlesnake("me", [
      { x: 0, y: 9 },
      { x: 1, y: 9 },
      { x: 2, y: 9 },
      { x: 3, y: 9 },
      { x: 4, y: 9 },
      { x: 5, y: 9 },
      { x: 6, y: 9 },
      { x: 7, y: 9 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
    ]);
    const other = createBattlesnake("other", [
      { x:1, y: 6 },
      { x: 2, y: 6 },
      { x: 2, y: 7 },
      { x: 2, y: 8 },
      { x: 3, y: 8 },
      { x: 4, y: 8 },
      { x: 5, y: 8 },
      { x: 6, y: 8 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
    ]);
    const gameState = createGameState(me, [me, other], 11, 11);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 5,Infinity, 2.5);
    console.log("VAL", val);
    expect(val.down).toBe(0);
  });

  test("bsMinMax loses in two moves (head to head)", () => {
    // TODO 
    // works only with depth 3 or 5 
    // higher depths give wrong evaluatoins for down
    const me = createBattlesnake("me", [
      { x: 4, y: 8 },
      { x: 3, y: 8 },
      { x: 3, y: 7 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 7 },
    ]);
    const other = createBattlesnake("other", [
      { x: 6, y: 6 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
      { x: 8, y: 6 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
      
    ]);
    const gameState = createGameState(me, [me, other], 11, 11);
    preprocess(gameState);
    console.log(gameState.blocks.toString());
    const val = bsMinMax(gameState, 6, Infinity, 2.5);
    console.log("VAL", val);
    expect(val.down).toBe(0);
  });



});
