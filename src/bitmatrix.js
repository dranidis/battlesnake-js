class Matrix {
  constructor(width, height, data = 0n) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  set(x, y) {
    const i = BigInt(y * this.width + x);
    this.data |= 1n << i;
    return this;
  }

  unset(x, y) {
    const i = BigInt(y * this.width + x);
    this.data &= ~(1n << i);
    return this;
  }

  get(x, y) {
    const i = BigInt(y * this.width + x);
    return (this.data >> i) & 1n;
  }

  and(m2) {
    this.data &= BigInt(m2.data);
    return this;
  }

  toString() {
    let s = "\n";
    for (let r = this.height - 1; r >= 0; r--) {
      for (let c = 0; c < this.width; c++) {
        s += (this.get(c, r) == 1n ? "X" : ".") + " ";
      }
      s += "\n";
    }
    return s;
  }
}


module.exports = {
  Matrix,
};
