const { bigIntSerializer } = require("./util");

class MinMax {
  constructor(isTerminal, children, heuristic, getPath = (n) => n) {
    this.isTerminal = isTerminal;
    this.children = children;
    this.heuristic = heuristic;
    this.getPath = getPath;
    this.stop = false;
    this.remainingRecursiveCalls = 0;
    this.nodesVisited = 0;
    this.timePerRecursiveCall = 2; // TIME substracted for each remaining rec call
  }

  alphabetaTimed(node, depth, alpha, beta, maximizingPlayer, ms) {
    const start = Date.now();
    const endAt = start + ms;
    this.remainingRecursiveCalls = 0;
    // console.log(`NOW: ${Date.now()} end at: ${endAt}`)
    // console.log("START", start)
    const [result, path] = this.alphabeta(
      node,
      depth,
      alpha,
      beta,
      maximizingPlayer,
      endAt
    );
    console.log(
      `MinMax: nodes: ${this.nodesVisited} time: ${Date.now() - start} ${
        result == undefined ? "TIME OUT" : "Completed"
      }`
    );
    // const isTimedOut = Date.now() > endAt;
    // if (path.length != 0) 
    console.log("PATH: ", path)
    // return isTimedOut ? undefined: result;
    return result;
  }

  alphabeta(node, depth, alpha, beta, maximizingPlayer, endTime, recCalls) {
    // console.log("END TIME at", endTime)
    // const remaining = endTime - (20 * recCalls)  - Date.now();
    // console.log("REM TIME", remaining, "rec calls", recCalls)

    // if (Date.now() > endTime) console.log("TIME OUT!");
    // if (this.isTerminal(node)) console.log("Terminal node reached");
    this.nodesVisited++;
    this.remainingRecursiveCalls++;

    const timeOut = Date.now() >
    endTime - this.timePerRecursiveCall * this.remainingRecursiveCalls;
    if (timeOut) {
      // console.log("TIME OUT !!!!!")
      return [undefined, []]
    }

    if (
      // timeOut ||
      depth === 0 ||
      this.isTerminal(node)
    ) {
      // console.log("depth", depth, "terminal?", this.isTerminal(node));
      this.remainingRecursiveCalls--;
      // console.log("remainingRecursiveCalls", this.remainingRecursiveCalls, "DEPTH", depth);
      const value = this.heuristic(node);
      // console.log(
      //   "H:",
      //   value,
      //   node.mm.path,
      //   depth,
      //   this.isTerminal(node) ? "Terminal" : ""
      // );
      const path = this.getPath(node);
      return [value, path];
    }
    // console.log(node.you.lost, JSON.stringify(node.mm, bigIntSerializer, 4));
    let bestPath;
    if (maximizingPlayer) {
      const nodeChildren = this.children(node); //.sort(n=> -1 * this.heuristic(node));
      for (let i = 0; i < nodeChildren.length; i++) {
        const child = nodeChildren[i];
        const [value, path] = this.alphabeta(
          child,
          depth - 1,
          alpha,
          beta,
          false,
          endTime
        );
        if (value == undefined) {
          return [undefined, []]
        }
        if (value > alpha) {
          alpha = value;
          bestPath = path;
        }
        if (beta <= alpha) {
          return [alpha, bestPath];
        }
      }
      return [alpha, bestPath];
    } else {
      const nodeChildren = this.children(node); //.sort(n=> this.heuristic(node));
      for (let i = 0; i < nodeChildren.length; i++) {
        const child = nodeChildren[i];
        const [value, path] = this.alphabeta(
          child,
          depth - 1,
          alpha,
          beta,
          true,
          endTime
        );
        if (value == undefined) {
          return [undefined, []]
        }
        if (value < beta) {
          beta = value;
          bestPath = path;
        }
        if (beta <= alpha) {
          return [beta, bestPath];
        }
      }
      return [beta, bestPath];
    }
  }
}

module.exports = {
  MinMax,
};
