const MAX_VALUE = 999;

function processMyFill(floodFillData) {
  return processFill(floodFillData, true);
}

function processOppFill(floodFillData) {
  return processFill(floodFillData, false);
}

function processFill(floodFillData, isMyFill) {
  const myMoves = Object.keys(floodFillData);
  let ffData = {};

  myMoves.forEach((myMove) => {
    ffData[myMove] = processMyMove(floodFillData[myMove], isMyFill);
  });

  return ffData;
}

function processMyMove(myMoveValue, isMyFill) {
  // TODO: change for many opponents
  if (myMoveValue.you != undefined) {
    const other = Object.keys(myMoveValue).filter((k) => k != "you")[0];
    return isMyFill ? myMoveValue.you : myMoveValue[other];
  }

  if (!isNaN(myMoveValue)) {
    return myMoveValue;
  }

  const oppMoveValues = Object.values(myMoveValue.data);
  if (oppMoveValues.length == 0) {
    return isMyFill ? MAX_VALUE : 0;
  }

  const processed = oppMoveValues.map((mv) => processOppMove(mv, isMyFill));

  return isMyFill ? Math.min(...processed) : Math.max(...processed);
}

function processOppMove(oppMoveValue, isMyFill) {
  const oppMoves = Object.values(oppMoveValue);
  if (oppMoves.length == 0) {
    return isMyFill ? 0 : MAX_VALUE;
  }
  const processed = oppMoves.map((mv) => processMyMove(mv, isMyFill));

  return isMyFill ? Math.max(...processed) : Math.min(...processed);
}


module.exports = {
  processMyFill,
  processOppFill,
};
