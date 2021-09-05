import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isSymbol,
} from '../../shared'
import {
  ITERATE_KEY,
  pauseTracking,
  resetTracking,
  track,
  trigger,
} from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { reactive, ReactiveFlags, reactiveMap, toRaw } from './reactive'

const isNonTrackableKeys = ['__proto__', '__v_isRef', '__isVue']

// 内置方法集合
const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => (Symbol as any)[key])
    .filter(isSymbol)
)

const get = createGetter()

const arrayInstrumentations = createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  // 下列方法需要使用原始对象作为参数
  // values
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      // 收集数组所有元素依赖
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, TrackOpTypes.GET, i + '')
      }
      // 首先使用原本的参数执行函数 (这些参数可能会是 reactive 的)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // 如果没有成功，再用原始对象试一试
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })
  // 使用这些会改变数组长度的方法的时候，不去收集长度依赖
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetTracking()
      return res
    }
  })
  return instrumentations
}

function createGetter() {
  return function get(
    target: object,
    key: string | symbol,
    receiver: object
  ): any {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    } else if (
      key === ReactiveFlags.RAW &&
      receiver === reactiveMap.get(target)
    ) {
      return target
    }

    const targetIsArray = isArray(target)

    // 对数组的一些特殊属性进行特殊操作
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }

    const res = Reflect.get(target, key, receiver)

    // 对内置的 Symbol 和一些特殊的 key 不做依赖收集
    if (
      isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys.includes(key)
    ) {
      return res
    }

    // 依赖收集
    track(target, TrackOpTypes.GET, key)

    // 如果访问的 key 对应的也是一个对象，那么递归调用 reactive，实现了惰性依赖收集
    return isObject(res) ? reactive(res) : res
  }
}

const set = createSetter()

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    value = toRaw(value)
    oldValue = toRaw(oldValue)

    // 这里是判断 target 有无 set 的这个 key，进而判断是修改操作，还是新增操作
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)

    // 这里一定要先执行 set 后再 trigger，effect 中可能有操作依赖于 set 后的对象，先 set 能保证 effect 中的函数执行出正确的结果
    const result = Reflect.set(target, key, value, receiver)
    if (!hadKey) {
      trigger(target, TriggerOpTypes.ADD, key)
    } else if (hasChanged(value, oldValue)) {
      trigger(target, TriggerOpTypes.SET, key)
    }
    return result
  }
}

function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key)
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key)
  }
  return result
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key)
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, TrackOpTypes.HAS, key)
  }
  return result
}

function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}

export const baseHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys,
}
