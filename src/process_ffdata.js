function processMyFill(floodFillData) {
  const myMoves = Object.keys(floodFillData);
  let ffData = {};

  myMoves.forEach((myMove) => {
    ffData[myMove] = processMyMove(floodFillData[myMove]);
  });

  return ffData;
}

function processMyMove(myMoveValue) {
  if (myMoveValue.you != undefined) {
    return myMoveValue.you;
  }

  if (!isNaN(myMoveValue)) {
    return myMoveValue;
  }

  const oppMoveValues = Object.values(myMoveValue.data);

  return Math.min(...oppMoveValues.map(processOppMove));
}

function processOppMove(oppMoveValue) {
  const myMoves = Object.values(oppMoveValue);

  return Math.max(...myMoves.map(processMyMove));
}

module.exports = {
  processMyFill
};
