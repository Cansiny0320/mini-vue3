import { hasOwn, isObject } from "../../shared"
import { track, trigger } from "./effect"
import { TrackOpTypes, TriggerOpTypes } from "./operations"
import { reactive } from "./reactive"

const get = createGetter()
const set = createSetter()

export const handler = {
  get,
  set,
}

function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver)
    track(target, TrackOpTypes.GET, key)
    return isObject(res) ? reactive(res) : res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    // 这里一定要先执行 set 后再 trigger，effect 中可能有操作依赖于 set 后的对象，先 set 能保证 effect 中的函数执行出正确的结果
    const result = Reflect.set(target, key, value, receiver)
    if (!hadKey) {
      trigger(target, TriggerOpTypes.ADD, key)
    } else if (value !== oldValue) {
      trigger(target, TriggerOpTypes.SET, key)
    }
    return result
  }
}

console.log(isObject(0))
