function createMatrix(width, height, data = 0n) {
  return { width: width, height: height, data: data };
}

function set(m, x, y) {
  const i = BigInt(y * m.width + x);
  m.data |= 1n << i;
}

function unset(m, x, y) {
  const i = BigInt(y * m.width + x);
  m.data &= ~(1n << i);
}

function get(m, x, y) {
  const i = BigInt(y * m.width + x);
  return (m.data >> i) & 1n;
}

function and(m1, m2) {
  return createMatrix(m1.width, m1.height, m1.data & m2.data)
}

function toString(m) {
  let s = "";
  for (let r = m.height - 1; r >= 0; r--) {
    for (let c = 0; c < m.width; c++) {
      s += (get(m, c, r) == 1n ? "X" : ".") + " ";
    }
    s += "\n";
  }
  return s;
}
