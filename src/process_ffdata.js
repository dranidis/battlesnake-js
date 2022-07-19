function process(floodFillData) {
  const myMoves = Object.keys(floodFillData);

  let ffData = {};

  for (let m = 0; m < myMoves.length; m++) {
    ffData[myMoves[m]] = processMyMove(floodFillData[myMoves[m]]);
  }

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
  process,
};
