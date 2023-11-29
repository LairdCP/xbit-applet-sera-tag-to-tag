export class MovingAverage {
  size
  head = 0
  windowSum = 0
  count = 0
  queue = []

  constructor (size) {
    this.size = size
    for (let i = 0; i < size; i++) {
      this.queue.push(0)
    }
  }

  next (val) {
    ++this.count
    // calculate the new sum by shifting the window
    const tail = (this.head + 1) % this.size
    this.windowSum = this.windowSum - this.queue[tail] + val
    // move on to the next head
    this.head = (this.head + 1) % this.size
    this.queue[this.head] = val
    return this.windowSum * 1.0 / Math.min(this.size, this.count)
  }
}
