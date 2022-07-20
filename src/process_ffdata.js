function processFill(floodFillData, isMyFill) {
  const myMoves = Object.keys(floodFillData);
  let ffData = {};

  myMoves.forEach((myMove) => {
    ffData[myMove] = processMyMove(floodFillData[myMove], isMyFill);
  });

  return ffData;
}

function processMyFill(floodFillData) {
  return processFill(floodFillData, true);
}

function processMyMove(myMoveValue, isMyFill) {
  if (myMoveValue.you != undefined) {
    return isMyFill ? myMoveValue.you : myMoveValue.other;
  }

  if (!isNaN(myMoveValue)) {
    return myMoveValue;
  }

  const oppMoveValues = Object.values(myMoveValue.data);
  const processed = oppMoveValues.map((mv) => processOppMove(mv, isMyFill));

  return isMyFill ? Math.min(...processed) : Math.max(...processed);
}

function processOppMove(oppMoveValue, isMyFill) {
  const myMoves = Object.values(oppMoveValue);
  const processed = myMoves.map((mv) => processMyMove(mv, isMyFill));

  return isMyFill ? Math.max(...processed) : Math.min(...processed);
}

function processOppFill(floodFillData) {
  return processFill(floodFillData, false);
}

module.exports = {
  processMyFill,
  processOppFill,
};
