import { h } from '../h'
import { createVNode } from '../vnode'

describe('renderer: h', () => {
  test('type only', () => {
    expect(h('div')).toMatchObject(createVNode('div'))
  })

  test('type + props', () => {
    expect(h('div', { id: 'foo' })).toMatchObject(
      createVNode('div', { id: 'foo' })
    )
  })

  test('type + props + children', () => {
    // array
    expect(h('div', {}, ['foo'])).toMatchObject(createVNode('div', {}, ['foo']))
    // single vnode
    const vnode = h('div')
    expect(h('div', {}, vnode)).toMatchObject(createVNode('div', {}, [vnode]))
    // text
    expect(h('div', {}, 'foo')).toMatchObject(createVNode('div', {}, 'foo'))
  })

  test('support variadic children', () => {
    // @ts-ignore
    const vnode = h('div', null, h('span'), h('span'))
    expect(vnode.children).toMatchObject([
      {
        type: 'span',
      },
      {
        type: 'span',
      },
    ])
  })
})
