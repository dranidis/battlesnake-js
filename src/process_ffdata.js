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
    const other = Object.keys(myMoveValue).filter(k=> k != "you")[0];
    return isMyFill ? myMoveValue.you : myMoveValue[other];
  }

  if (myMoveValue == {}) {
    return isMyFill ? 0 : 0;

  }
  if (!isNaN(myMoveValue)) {
    return myMoveValue;
  }

  const oppMoveValues = Object.values(myMoveValue.data);
  if (oppMoveValues.length == 0) {
    return isMyFill ? 999: 0
  }

  const processed = oppMoveValues.map((mv) => processOppMove(mv, isMyFill));

  return isMyFill ? Math.min(...processed) : Math.max(...processed);
}

function processOppMove(oppMoveValue, isMyFill) {
  const oppMoves = Object.values(oppMoveValue);
  if (oppMoves.length == 0) {
    return isMyFill ? 0: 999
  }
  const processed = oppMoves.map((mv) => processMyMove(mv, isMyFill));

  return isMyFill ? Math.max(...processed) : Math.min(...processed);
}

function processOppFill(floodFillData) {
  return processFill(floodFillData, false);
}

module.exports = {
  processMyFill,
  processOppFill,
};
