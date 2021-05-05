import { isObject } from "../../shared"
import { handler } from "./baseHandlers"

export const reactiveMap = new WeakMap()

export function reactive<T extends object>(target: T) {
  return createReactiveObject(target, handler)
}

export function createReactiveObject(target: object, handler: ProxyHandler<any>) {
  if (!isObject(target)) {
    console.warn(`${target} is not object!`)
    return target
  }
  // 已经有了对应的 proxy
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  const observed = new Proxy(target, handler)
  reactiveMap.set(target, observed)
  return observed
}
