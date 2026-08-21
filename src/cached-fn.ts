/**
 * cachedFn - Lightweight and lazy cached function with TTL, negative TTL, and item limit controls.
 */

// Self-reference via the package name so `tsc --noEmit` resolves these
// types through `package.json` `exports` — the same path an external
// consumer would take. If the `exports.types` mapping ever breaks, the
// build fails here.
import type * as declared from "cached-fn"

type N = [unknown, number?] // Cached result and expiration timestamp
type O = Record<string, N>  // Maps argument key to cached result
type P = O[]                // Array of cache entry objects (with maxItems limit)
type Q = Record<number, P>  // Maps index to cache entries
type R = Record<number, Q>  // Maps cycle start timestamp to caches
type S = Record<number, R>  // Maps cycle size (ms) to all caches in that window

const isPromise = <T>(value: any): value is Promise<T> => (value && "function" === typeof value.then)

// Storage
let S: S = {}

// Index counter
let Index = 0

// Array.prototype.slice
const slice = [].slice

const factory = ((options, fn) => {
    const idx = ++Index
    const fnLen = fn.length

    /**
     * Time-window size in milliseconds for cache grouping.
     * All caches in the same window are cleared together at window end.
     * This is a fixed time slot, not a duration from completion.
     */
    const cycle = +options.cycle! || 0

    /**
     * Cache duration in milliseconds when resolved.
     * -1: no expiration. 0: do not cache.
     * @default -1
     */
    let positiveCache = options.cache
    if (positiveCache !== 0) positiveCache = +positiveCache! || -1

    /**
     * Cache duration in milliseconds when rejected.
     * -1: no expiration. 0: do not cache.
     * @default 0
     */
    const negativeCache = +options.negativeCache! || 0

    /**
     * Maximum number of items in the cache.
     * @default 0 - unlimited.
     */
    const maxItems = +options.maxItems! || 0

    return function <T>(this: unknown): T {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments as ArrayLike<unknown> as Parameters<typeof fn>
        const slot = +cycle && Math.floor(Date.now() / cycle)

        let R = S[cycle]
        let Q = R && R[slot]
        if (!Q) {
            R = S[cycle] = {}
            Q = R[slot] = {}
        }

        const P = Q[idx] || (Q[idx] = [])

        const argLen = args.length
        let key: string
        if (!fnLen && !argLen) {
            key = "[]"
        } else {
            const array: unknown[] = slice.call(args)
            if (argLen < fnLen) array.length = fnLen
            key = JSON.stringify(array)
        }

        const O = maxItems ? (P.find(p => p[key]) || (P[P.length] = {})) : (P[0] || (P[0] = {}))

        // cached result
        const cached = O[key] as [T, number]
        if (cached) {
            const expires = cached[1]
            if (expires < 0 || Date.now() < expires) {
                return cached[0]
            }
        }

        // new result
        const packed = O[key] = [fn.apply(this, args) as unknown as T, -1] as [T, number]

        if (maxItems) {
            // remove the previous item from list
            const position = P.findIndex(p => p === O)
            if (position !== -1) {
                P.splice(position, 1)
            }

            // add the new item to the end of list
            P.push(O)

            // remove the oldest item when the cache exceeds maxItems
            if (P.length > maxItems) {
                P.shift()
            }
        }

        const result = packed[0]

        if (isPromise(result)) {
            return result.then((resolved) => {
                updateExpiry(positiveCache)
                return resolved
            }, (rejected) => {
                updateExpiry(negativeCache)
                return Promise.reject(rejected) // pass through
            }) as T
        } else {
            updateExpiry(positiveCache)
            return result
        }

        function updateExpiry(duration: number) {
            // update expiration date
            const expiry = packed[1] = (duration > 0 ? (Date.now() + duration) : duration)

            // remove from cache when cache disabled
            if (!expiry) {
                delete O[key]
            }
        }
    }
}) as declared.cachedFn

// cachedFn(fn)
// cachedFn(options, fn)
export const cachedFn = ((options, fn) => {
    if ("function" === typeof options && !fn) {
        fn = options
        options = {}
    }
    return factory(options, fn)
}) as declared.cachedFn

// cachedFn.cycle(ms, fn)
cachedFn.cycle = (ms, fn) => factory({cycle: ms}, fn)

// cachedFn.flush()
cachedFn.flush = () => (S = {})
