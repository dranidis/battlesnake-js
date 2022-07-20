var snakeColor;

function setSnakeColor(color) {
  snakeColor = color;
}

function info() {
  console.log("INFO");
  const response = {
    apiversion: "1",
    author: "DDmits2",
    color: snakeColor || "#736CCB",
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
  setSnakeColor,
  info: info,
  start: start,
  end: end,
};
