const { PriorityQueue } = require("../src/priorityqueue");

describe("Priority Queue", () => {
  test("empty queue", () => {
    const pq = new PriorityQueue();
    expect(pq.size()).toBe(0);
  });

  test("add", () => {
    const pq = new PriorityQueue();
    pq.add(3, 12)
    expect(pq.size()).toBe(1);
    expect(pq.contains(3)).toBe(true);
    expect(pq.front()).toBe(3);
    expect(pq.size()).toBe(1);
    pq.dequeue();
    expect(pq.size()).toBe(0);
  });
});
