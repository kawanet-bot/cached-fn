import {strict as assert} from "node:assert"
import {createRequire} from "node:module"
import {test} from "node:test"

const require = createRequire(import.meta.url)

test("require entry (.cjs)", () => {
    const m = require("cached-fn")
    assert.equal(typeof m.cachedFn, "function")
})

test("minified entry (.min.js)", () => {
    const cjs = require.resolve("cached-fn")
    const m = require(cjs.replace(/\.cjs$/, ".min.js"))
    assert.equal(typeof m.cachedFn, "function")
})
