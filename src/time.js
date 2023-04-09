var start

var start ;
function getStartTime() {
  return start;
}

function setStartTime(time) {
  start = time;
}

function getRemainingTime() {
  const now = Date.now();
  const remaining = getStartTime() + 500 - now;
  return remaining;
}

module.exports = {
  getStartTime, setStartTime, getRemainingTime
}
