const { combine } = require("../src/util");

describe("combine ", () => {
  test("no opponents", () => {
    const actual = combine([]);
    const expected = [];
    expect(actual).toStrictEqual(expected);
  });

  test("just one opponent", () => {
    const actual = combine([["up", "down", "right"]]);
    const expected = [["up"], ["down"], ["right"]];
    expect(actual).toStrictEqual(expected);
  });

  test("two opponents", () => {
    const actual = combine([
      ["up", "down", "right"],
      ["up", "down"],
    ]);
    const expected = [
      ["up", "up"],
      ["up", "down"],
      ["down", "up"],
      ["down", "down"],
      ["right", "up"],
      ["right", "down"],
    ];
    expect(actual).toStrictEqual(expected);
  });

  test("three opponents", () => {
    const actual = combine([
      ["1", "2"],
      ["u", "d"],
      ["a", "b"],
    ]);
    const expected = [
      ["1", "u", "a"],
      ["1", "u", "b"],
      ["1", "d", "a"],
      ["1", "d", "b"],
      ["2", "u", "a"],
      ["2", "u", "b"],
      ["2", "d", "a"],
      ["2", "d", "b"],
    ];
    expect(actual).toStrictEqual(expected);
  });
});
