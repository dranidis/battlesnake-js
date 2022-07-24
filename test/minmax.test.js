const { MinMax } = require("../src/minmax");

describe("Alpha beta", () => {
  test("example", () => {
    // https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning#/media/File:AB_pruning.svg
    const root = "0";
    const children = (node) => {
      switch (node) {
        case "0":
          return ["1", "2", "3"];
        case "1":
          return ["11", "12"];
        case "2":
          return ["21", "22"];
        case "3":
          return ["31", "32"];
        case "11":
          return ["111", "112"];
        case "12":
          return ["121"];
        case "21":
          return ["211", "212"];
        case "22":
          return ["221"];
        case "31":
          return ["311"];
        case "32":  throw `should cut of ${node}`
          return ["321", "322"];
        case "111":
          return ["1111", "1112"];
        case "112":
          return ["1121", "1122", "1123"];
        case "121":
          return ["1211"];
        case "211":
          return ["2111"];
        case "212":
          return ["2121", "2122"];
        case "221":
          return ["2211"];
        case "311":
          return ["3111"];
        case "321":
          return ["3211", "3212"];
        case "322":
          return ["3221"];
      }
      throw 'Should not reach here, no node for children'

    };
    const isTerminal = (node) => false;
    const heuristic = (node) => {
      switch (node) {
        case "1111":
          return 5;
        case "1112":
          return 6;
        case "1121":
          return 7;
        case "1122":
          return 4;
        case "1123": throw `should cut of ${node}`
          // return 5;
        case "1211":
          return 3;
        case "2111":
          return 6;
        case "2121":
          return 6;
        case "2122":
          return 9;
        case "2211":
          return 7;
        case "3111":
          return 5;
        case "3211":  throw `should cut of ${node}`
          // return 9;
        case "3212":
          return 8;
        case "3221":
          return 6;
      }
      throw `Should not reach here ${node}` 
    };
    const minmax = new MinMax(isTerminal, children, heuristic);
    const act = minmax.alphabeta(root, 4, -Infinity, Infinity, true);
    expect(act).toBe(6);
  });
});
