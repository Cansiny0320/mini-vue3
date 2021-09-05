export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => Object.prototype.hasOwnProperty.call(val, key)

export const isArray = Array.isArray

export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'

export const objectToString = Object.prototype.toString

export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

export const isString = (val: unknown): val is string => typeof val === 'string'

export const isIntegerKey = (key: unknown) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key

export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

export const toRawType = (value: unknown): string => {
  // 从类似这样的字符串 “[object RawType]” 得到对象类型
  return toTypeString(value).slice(8, -1)
}

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
