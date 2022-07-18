const { PriorityQueue } = require("./priorityqueue");

function reconstructPath(cameFrom, current) {
  totalPath = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    totalPath.unshift(current);
  }
  return totalPath;
}

function aStar(start, goal, h, neighbors, d) {
  openSet = new PriorityQueue();
  cameFrom = new Map();
  gScore = new Map(); // default value inf
  gScore.set(start, 0);
  fScore = new Map(); // default value inf
  fScore.set(start, h(start, goal));

  const getGScore = (n) => (gScore.has(n) ? gScore.get(n) : Infinity);
  const getFScore = (n) => (fScore.has(n) ? fScore.get(n) : Infinity);
  const addToOpenSet = (n) => openSet.add(n, getFScore(n));

  addToOpenSet(start);

  while (openSet.size() > 0) {
    current = openSet.front();

    if (current == goal) {
      return reconstructPath(cameFrom, current);
    }
    openSet.dequeue();

    // console.log("Current " + JSON.stringify(current));
    // console.log("Neighbors " + JSON.stringify(neighbors(current)));

    neighbors(current).forEach(function (neighbor) {
      // console.log("Neighbor: " + JSON.stringify(neighbor));
      tentativeGScore = getGScore(current) + d(current, neighbor);
      // console.log("tentativeGScore" + tentativeGScore)
      if (tentativeGScore < getGScore(neighbor)) {
        // console.log("Updating")
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + h(neighbor, goal));
        if (!openSet.contains(neighbor)) {
          // console.log("ADD neighbor")
          addToOpenSet(neighbor);
        }
      }
    });
    // console.log("OPEN SET: " + JSON.stringify(openSet))
  }
  return [];
}

// function neighbors(current) should return a list of neighbors
// function d(current, neighbor) is the weight of the edge from current to neighbor

// function h is the heuristic function. h(n, goal) estimates the cost to reach goal from node n

module.exports = {
  aStar,
};
