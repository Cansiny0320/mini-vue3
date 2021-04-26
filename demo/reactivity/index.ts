import { reactive, effect } from "../../packages/reactivity/index"
const $inc = document.querySelector(".inc")
const $dec = document.querySelector(".dec")
const $count = document.querySelector(".count")

const state = reactive({ count: 0 })
state.text = "+1"
effect(() => {
  $count.innerHTML = state.count
  $inc.innerHTML = state.text
})
$inc.addEventListener("click", () => {
  state.count++
  state.text = "+2"
})
$dec.addEventListener("click", () => {
  state.count--
})
