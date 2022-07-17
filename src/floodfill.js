class FloodFill {
  constructor(strategy) {
    this.strategy = strategy;
  }

  floodfill(coord) {
    if (!this.strategy.inside(coord)) return;
    if (this.strategy.isSet(coord)) return;
    this.strategy.set(coord);

    this.floodfill({ x: coord.x + 1, y: coord.y });
    this.floodfill({ x: coord.x - 1, y: coord.y });
    this.floodfill({ x: coord.x, y: coord.y + 1 });
    this.floodfill({ x: coord.x, y: coord.y - 1 });
  }
}


module.exports = {
  FloodFill,
};
