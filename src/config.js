var configuration = {
  CHECK_FOOD_CLOSER_TO_OTHERS: false,
  CHECK_DEADLY_ATTACK: true,
  CHECK_DEADLY_DEFENCE: true,
  BFS_DEPTH: 8, // max with Heroku
  MINMAX_DEPTH: 2,
  /**
   * number of extra squares in the area for the snake 
  // to safely enter. 1.5 * length
   */
  // FLOOD_FILL_FACTOR: 1.5,
  FLOOD_FILL_FACTOR: 1.5,//1.5,
  DISTANCE_TO_FOOD_WHILE_ATTACKING: 1, // may pick up food next to it while attacking
  debug: false,
};

module.exports = {
  configuration
}
