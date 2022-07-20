const { floodFillData, testData, goesTowardsFoodWhenShorterSnake, bothDie } = require("./test_json");
const { processMyFill, processOppFill } = require("../src/process_ffdata")

describe("read ff data", () => {
  test("read file test_json", () => {
    const ffData = processMyFill(floodFillData);
    console.log(ffData);
    expect(ffData.down).toBe(3);
    expect(ffData.right).toBe(3);
    expect(ffData.left).toBe(42);
    // expect(allowedMoves).toContain(moveResponse.move);

  });

  test("read file test_json testData", () => {
    const ffData = processMyFill(testData);
    console.log(ffData);
    expect(ffData.right).toBe(0);
    expect(ffData.up).toBe(15);
    // expect(allowedMoves).toContain(moveResponse.move);

  });

  test("read file test_json goesTowardsFoodWhenShorterSnake", () => {
    const ffData = processMyFill(goesTowardsFoodWhenShorterSnake);
    console.log(ffData);
    expect(ffData.up).toBe(21);
    expect(ffData.down).toBe(19);
    expect(ffData.right).toBe(21);
    // expect(allowedMoves).toContain(moveResponse.move);

  });

  test("read file test_json goesTowardsFoodWhenShorterSnake opponent", () => {
    const ffData = processOppFill(goesTowardsFoodWhenShorterSnake);
    console.log(ffData);
    expect(ffData.up).toBe(22);
    expect(ffData.down).toBe(22);
    expect(ffData.right).toBe(21);
    // expect(allowedMoves).toContain(moveResponse.move);

  });

  test("read file test_json bothDie me", () => {
    const ffData = processMyFill(bothDie);
    console.log(ffData);
    expect(ffData.up).toBe(21);
    expect(ffData.down).toBe(0);
    expect(ffData.right).toBe(0);
    // expect(allowedMoves).toContain(moveResponse.move);

  });

  test("read file test_json bothDie opp", () => {
    const ffData = processOppFill(bothDie);
    console.log(ffData);
    expect(ffData.up).toBe(21);
    expect(ffData.down).toBe(21);
    expect(ffData.right).toBe(21);
    // expect(allowedMoves).toContain(moveResponse.move);

  });
});
