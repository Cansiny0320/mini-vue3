export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object"

export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val =>
  Object.prototype.hasOwnProperty.call(val, key)

export const isArray = Array.isArray

export const isMap = (val: unknown): val is Map<any, any> => toTypeString(val) === "[object Map]"

export const objectToString = Object.prototype.toString

export const toTypeString = (value: unknown): string => objectToString.call(value)
