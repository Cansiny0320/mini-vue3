import { isObject, toRawType } from '../../shared'
import { baseHandlers } from './baseHandlers'

export const reactiveMap = new WeakMap<Target, any>()

export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  RAW = '__v_raw',
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.RAW]?: any
}

const enum TargetType {
  INVALID = 0,
  COMMON = 1,
}

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    default:
      return TargetType.INVALID
  }
}

function getTargetType(value: Target) {
  return value[ReactiveFlags.SKIP]
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}

export function reactive<T extends Object>(target: T) {
  return createReactiveObject(target, baseHandlers)
}

export function createReactiveObject(
  target: Target,
  handler: ProxyHandler<object>
) {
  // target 只能是对象
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`)
    return target
  }

  // target 已经是 proxy
  if (target[ReactiveFlags.RAW]) {
    return target
  }

  // 已经有了对应的 proxy 就直接返回，缓存优化
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 只有白名单的对象类型可以响应式
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }

  const observed = new Proxy(target, handler)
  reactiveMap.set(target, observed)
  return observed
}

export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

export function isProxy(value: unknown): boolean {
  return isReactive(value)
}

// 获取原始对象
export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}
