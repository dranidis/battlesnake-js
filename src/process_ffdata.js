const FF_MAX_VALUE = 999;

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

function processMyMove(myMoveData, isMyFill) {
  // TODO: change for many opponents
  if (myMoveData.you != undefined) {
    const other = Object.keys(myMoveData).filter((k) => k != "you")[0];
    return isMyFill ? myMoveData.you : myMoveData[other];
  }

  if (!isNaN(myMoveData)) {
    return myMoveData;
  }

  const oppMoveDataList = Object.values(myMoveData.data);
  if (oppMoveDataList.length == 0) {
    return isMyFill ? FF_MAX_VALUE : 0;
  }

  const oppMovesValues = oppMoveDataList.map((mv) => processOppMove(mv, isMyFill));

  return isMyFill ? Math.min(...oppMovesValues) : Math.max(...oppMovesValues);
}

function processOppMove(oppMoveData, isMyFill) {
  const myMoveDataList = Object.values(oppMoveData);
  if (myMoveDataList.length == 0) {
    return isMyFill ? 0 : FF_MAX_VALUE;
  }
  const myMovesValues = myMoveDataList.map((mv) => processMyMove(mv, isMyFill));

  return isMyFill ? Math.max(...myMovesValues) : Math.min(...myMovesValues);
}


module.exports = {
  processMyFill,
  processOppFill,
  FF_MAX_VALUE,
};
