const { floodFillData } = require("./test_json");
const { process } = require("../src/process_ffdata")

describe("read ff data", () => {
  test("read file test_json", () => {
    const ffData = process(floodFillData);
    console.log(ffData);
    expect(ffData.down).toBe(3);
    expect(ffData.right).toBe(3);
    expect(ffData.left).toBe(42);
    // expect(allowedMoves).toContain(moveResponse.move);

  });
});
