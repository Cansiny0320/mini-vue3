import { reactive, effect } from '../../packages/reactivity/index'
const input = document.querySelector('input')
const p = document.querySelector('p')

const state = reactive({ text: '' })
effect(() => {
  p.textContent = state.text
  input.value = state.text
})
input.addEventListener('input', () => {
  state.text = input.value
})

setTimeout(() => {
  state.text = '123'
}, 1000)
