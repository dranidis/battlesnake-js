const { info, start, end } = require("../src/bs_info");

describe("Battlesnake API Version", () => {
  test("should be api version 1", () => {
    const result = info();
    start({game : {id : "ID"}})
    end({game : {id : "ID"}})
    expect(result.apiversion).toBe("1");
  });
});
