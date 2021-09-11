const resolvedPromise = Promise.resolve()
let isFlushing = false
const queue: any[] = []

export function nextTick(fn?: () => void): Promise<void> {
  return fn ? resolvedPromise.then(fn) : resolvedPromise
}

export function queueJob(job: any) {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

function queueFlush() {
  if (!isFlushing) {
    resolvedPromise.then(() => {
      isFlushing = true
      try {
        // TODO: 这里用 for-each，queueJob while flushing 测试过不了，不知道为什么
        for (const job of queue) {
          job()
        }
      } finally {
        queue.length = 0
        isFlushing = false
      }
    })
  }
}
