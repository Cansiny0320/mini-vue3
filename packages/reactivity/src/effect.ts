import { isArray, isIntegerKey } from '../../shared'
import { TrackOpTypes, TriggerOpTypes } from './operations'

// 整个响应式系统的数据结构如下
// 首先是 targetMap 存的是 {target（也就是原对象） -> 其对应的 KeyToDepMap}
// KeyToDepMap 则存放了{target 中被 track 过的 key -> Dep}
// Dep 中就是这个 key 对应的 effects
// 这些 effects 中也存放了它们自己对应的 key
// 形成了 key <-> effect
// 图示：https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1630843079966.png

type Dep = Set<ReactiveEffect>

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export interface ReactiveEffect<T = any> {
  (): T
  deps: Array<Dep>
}

const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined

export const ITERATE_KEY = Symbol('iterate')

export function effect<T = any>(fn: () => T) {
  const effect = createReactiveEffect(fn)
  effect()
  return effect
}

function createReactiveEffect<T = any>(fn: () => T): ReactiveEffect<T> {
  const effect = function reactiveEffect(): unknown {
    cleanup(effect) // 防止 fn() 中含有 if 等条件判断语句导致依赖不同。所以每次执行函数时，都要重新更新一次依赖。
    try {
      effectStack.push(effect) // 将本effect推到effect栈中
      activeEffect = effect
      // 立即执行一遍 fn()
      // fn() 执行过程会完成依赖收集，会用到 track
      return fn()
    } finally {
      // 执行完以后将effect从栈中推出
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1]
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

let shouldTrack = true
const trackStack: boolean[] = []

export function pauseTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

export function resetTracking() {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}

export function track(
  target: object,
  type: TrackOpTypes,
  key: string | symbol
) {
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
    // 将activeEffect add到集合dep中，供 trigger 调用
    dep.add(activeEffect)
    // 并在effect的deps中也push这个effects集合dep 供cleanup清除上一轮的依赖，防止本轮触发多余的依赖
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
        // 不要添加自己当前的 effect，否则遇到 effect(() => foo.value++) 会导致无限循环
        if (effect !== activeEffect) {
          effects.add(effect)
        }
      })
    }
  }
  // SET | ADD
  if (key !== undefined) {
    // 添加key对应的effect
    add(depsMap.get(key))
  }

  // iteration key on ADD | Map.SET
  switch (type) {
    case TriggerOpTypes.ADD:
      // 增加数组元素会改变数组长度
      if (isArray(target) && isIntegerKey(key)) add(depsMap.get('length'))
  }
  // 简化版 scheduleRun，挨个执行 effect
  effects.forEach(effect => {
    effect()
  })
}
