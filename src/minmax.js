const { bigIntSerializer } = require("./util");

class MinMax {
  constructor(isTerminal, children, heuristic) {
    this.isTerminal = isTerminal;
    this.children = children;
    this.heuristic = heuristic;
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
    const result = this.alphabeta(node, depth, alpha, beta, maximizingPlayer, endAt);
    console.log(`MinMax: nodes: ${this.nodesVisited} time: ${Date.now() - start}`)
    return result;  }

  alphabeta(node, depth, alpha, beta, maximizingPlayer, endTime, recCalls) {
    // console.log("END TIME at", endTime)
    // const remaining = endTime - (20 * recCalls)  - Date.now();
    // console.log("REM TIME", remaining, "rec calls", recCalls)

    // if (Date.now() > endTime) console.log("TIME OUT!");
    // if (this.isTerminal(node)) console.log("Terminal node reached");

    this.nodesVisited++;
    this.remainingRecursiveCalls++;

    if (
      Date.now() >
        endTime - this.timePerRecursiveCall * this.remainingRecursiveCalls ||
      depth === 0 ||
      this.isTerminal(node)
    ) {
      // console.log("depth", depth, "terminal?", this.isTerminal(node));
      this.remainingRecursiveCalls--;
      // console.log("remainingRecursiveCalls", this.remainingRecursiveCalls, "DEPTH", depth);
      return this.heuristic(node);
    }
    if (maximizingPlayer) {
      let value = -Infinity;
      const nodeChildren = this.children(node);
      for (let i = 0; i < nodeChildren.length; i++) {
        const child = nodeChildren[i];
        value = Math.max(
          value,
          this.alphabeta(child, depth - 1, alpha, beta, false, endTime)
        );
        // console.log(
        //   "MY TURN CHILD",
        //   JSON.stringify(child, bigIntSerializer, 2)
        // );
        // console.log("MY TURN VALUE MM", value);
        if (value >= beta) {
          break;
        }
        alpha = Math.max(alpha, value);
      }
      return value;
    } else {
      let value = Infinity;
      const nodeChildren = this.children(node);
      // console.log("CHILDREN LEN", nodeChildren.length)
      for (let i = 0; i < nodeChildren.length; i++) {
        const child = nodeChildren[i];
        value = Math.min(
          value,
          this.alphabeta(child, depth - 1, alpha, beta, true, endTime)
        );

        // console.log(
        //   "OPP TURN CHILD",
        //   JSON.stringify(
        //     child,
        //     bigIntSerializer,
        //     2
        //   )
        // );
        // console.log("OPP TURN VALUE MM", value);
        if (value <= alpha) {
          break;
        }
        beta = Math.min(beta, value);
      }
      return value;
    }
  }
}

module.exports = {
  MinMax,
};
