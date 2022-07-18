class PriorityQueue {
  constructor() {
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  add(element, priority) {
    let contain = false;
    const newItem = { item: element, priority: priority };
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > priority) {
        this.items.splice(i, 0, newItem);
        contain = true;
        break;
      }
    }
    if (!contain) {
      this.items.push(newItem);
    }
  }

  dequeue() {
    if (this.items.length > 0) {
      return this.items.shift();
    }
  }

  front() {
    if (this.items.length > 0) {
      return this.items[0].item;
    }
  }

  contains(element) {
    console.log("CONTAINS " + element)
    return this.items.map(i => i.item).includes(element)
  }
}

module.exports = {
  PriorityQueue,
};
