import { isArray, isObject } from '../shared'
import { createVNode, isVNode } from './vnode'

export function h(type: any, propsOrChildren?: any, children?: any) {
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 单独的 vnode 无 props
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      return createVNode(type, propsOrChildren)
    } else {
      // 无 props
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = [...arguments].slice(2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}
