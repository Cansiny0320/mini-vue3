const p = Promise.resolve()
export function nextTick(fn?: () => void): Promise<void> {
  return fn ? p.then(fn) : p
}
