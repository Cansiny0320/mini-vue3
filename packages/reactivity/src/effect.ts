import { isArray, isMap } from "../../shared"
import { TrackOpTypes, TriggerOpTypes } from "./operations"
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export interface ReactiveEffect<T = any> {
  (): T
  deps: Array<Dep>
}

const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined

export const ITERATE_KEY = Symbol("")

export function effect<T = any>(fn: () => T) {
  const effect = createReactiveEffect(fn)
  effect()
  return effect
}

function createReactiveEffect<T = any>(fn: () => T): ReactiveEffect<T> {
  const effect = function reactiveEffect(): unknown {
    if (!effectStack.includes(effect)) {
      cleanup(effect) // effect 调用时会清除上一轮的依赖，防止本轮触发多余的依赖
      try {
        effectStack.push(effect) // 可能有 effect 中调用另一个 effect 的情况，模拟一个栈来处理
        activeEffect = effect
        // 立即执行一遍 fn()
        // fn() 执行过程会完成依赖收集，会用到 track
        return fn()
      } finally {
        // 完成依赖收集后从池子中扔掉这个 effect
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  effect.deps = [] // 收集对应的 dep，cleanup 时以找到 dep，从 dep 中清除 effect
  return effect
}

function cleanup(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    deps.forEach(dep => dep.delete(effect)) // deps 中的 dep 清 effect
    deps.length = 0 // 清空 effect 的 deps
  }
}

export function track(target: object, type: TrackOpTypes, key: string | symbol) {
  if (activeEffect === undefined) {
    return
  }

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  if (!dep.has(activeEffect)) {
    /*
    dep 到 effect 是为了 trigger 使用，
    而 effect 到 dep 是为了 effect 调用时找到依赖于这个 effect 所有 dep，
    从 dep 中删除这个调用过的 effect，用来清除上一轮的依赖，防止本轮触发多余的依赖 
    */
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger(target: object, type: TriggerOpTypes, key?: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  // 需要新建一个 set，如果直接 const effect = depsMap.get(key)
  // effect 函数执行时 track 的依赖就也会在这一轮 trigger 执行，导致无限循环
  const effects = new Set<ReactiveEffect>()
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        // 不要添加自己当前的 effect，否则之后 run（mutate）的时候
        // 遇到 effect(() => foo.value++) 会导致无限循环
        if (effect !== activeEffect) {
          effects.add(effect)
        }
      })
    }
  }
  // SET | ADD
  if (key !== undefined) {
    add(depsMap.get(key))
  }

  // iteration key on ADD | Map.SET
  switch (type) {
    case TriggerOpTypes.ADD:
      add(depsMap.get(isArray(target) ? "length" : ITERATE_KEY))
      break
    case TriggerOpTypes.SET:
      if (isMap(target)) {
        add(depsMap.get(ITERATE_KEY))
      }
      break
  }
  // 简化版 scheduleRun，挨个执行 effect
  effects.forEach(effect => {
    effect()
  })
}
