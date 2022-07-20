function info() {
  console.log("INFO");
  const response = {
    apiversion: "1",
    author: "DDmits2",
    color: "#736CCB",
    // color: "#ff0000",
    head: "tongue",
    tail: "freckled",
  };
  return response;
}

function start(gameState) {
  console.log(`${gameState.game.id} START`);
}

function end(gameState) {
  console.log(`${gameState.game.id} END\n`);
}

module.exports = {
  info: info,
  start: start,
  end: end,
};
