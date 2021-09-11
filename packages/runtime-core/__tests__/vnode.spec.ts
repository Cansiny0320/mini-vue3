import { ShapeFlags } from 'packages/shared/shapeFlags'
import { createVNode } from '../vnode'

describe('vnode', () => {
  test('create with tag, props and children', () => {
    const vnode = createVNode('p', { id: 'foo' }, ['foo'])
    expect(vnode.type).toBe('p')
    expect(vnode.props).toMatchObject({ id: 'foo' })
    expect(vnode.children).toMatchObject(['foo'])
    expect(vnode.shapeFlag).toBe(ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN)
  })

  test('create from an existing vnode', () => {
    const vnode1 = createVNode('p', { id: 'foo' })
    const vnode2 = createVNode(vnode1, { class: 'bar' }, 'baz')
    expect(vnode2).toMatchObject({
      type: 'p',
      props: {
        id: 'foo',
        class: 'bar',
      },
      children: 'baz',
      shapeFlag: ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN,
    })
  })

  test('vnode keys', () => {
    for (const key of ['', 'a', 0, 1, NaN]) {
      expect(createVNode('div', { key }).key).toBe(key)
    }
  })

  test('string', () => {
    const vnode = createVNode('p', { class: 'foo baz' })
    expect(vnode.props).toMatchObject({ class: 'foo baz' })
  })
})
