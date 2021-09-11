import { isProxy, ReactiveFlags } from '../reactivity/src/reactive'
import { isArray, isObject, isString } from '../shared'
import { ShapeFlags } from 'packages/shared/shapeFlags'
import { RendererNode } from './compat/renderer'
import { Data } from './component'

type VNodeChildAtom =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void

export type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>

export type VNodeNormalizedChildren = string | VNodeArrayChildren | null

export interface VNode {
  __v_isVNode: true // 判断是否是 VNode 的标志
  [ReactiveFlags.SKIP]: true // 避免 reactive 收集
  type: VNodeTypes
  props: VNodeProps | null
  key: string | number | null
  children: VNodeNormalizedChildren
  el: RendererNode | null
  shapeFlag: number
  patchFlag: number
}

export type VNodeProps = {
  key?: string | number
  [prop: string]: any
}

export type VNodeTypes = string | VNode

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

export function createVNode(
  type: VNodeTypes,
  props: VNodeProps | null = null,
  children: unknown = null,
  patchFlag: number = 0
): VNode {
  if (isVNode(type)) {
    return createBaseVNode(
      type.type,
      { ...type.props, ...props },
      type.children || children,
      patchFlag,
      ShapeFlags.ELEMENT
    )
  }

  // props 的处理
  if (props) {
    // 如果是 reactive 或 proxy 对象
    if (isProxy(props)) {
      props = { ...props }
    }
    let { style } = props
    // style 的处理
    if (isObject(style)) {
      if (isProxy(style) && !isArray(style)) {
        props.style = { ...style }
      }
    }
  }

  // 使用 bitmap 来表示 vnode 的类型
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0

  return createBaseVNode(type, props, children, patchFlag, shapeFlag)
}

function createBaseVNode(
  type: VNodeTypes,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag = 0,
  shapeFlag = ShapeFlags.ELEMENT
) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props?.key != null ? props.key : null,
    children,
    el: null,
    shapeFlag,
    patchFlag,
  } as VNode

  if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}
