const { PriorityQueue } = require("./priorityqueue");

function reconstructPath(cameFrom, current) {
  totalPath = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    totalPath.unshift(current);
  }
  return totalPath;
}

/**
 * A* star algorithm implementation using a priority queue
 * 
 * @param {*} start 
 * @param {*} goal 
 * @param {*} h function h is the heuristic function. h(n, goal) estimates the cost to reach goal from node n
 * @param {*} neighbors function neighbors(current) should return a list of neighbors of current
 * @param {*} d function d(current, neighbor) is the weight of the edge from current to neighbor
 * @returns a list of nodes from start to goal. The list is empty if there is no path.
 */
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

    neighbors(current).forEach(function (neighbor) {
      tentativeGScore = getGScore(current) + d(current, neighbor);
      if (tentativeGScore < getGScore(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + h(neighbor, goal));
        if (!openSet.contains(neighbor)) {
          addToOpenSet(neighbor);
        }
      }
    });
  }
  
  return [];
}

module.exports = {
  aStar,
};
