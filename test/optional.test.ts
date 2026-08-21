import {cachedFn} from "cached-fn"
import {strict as assert} from "node:assert"
import {it} from "node:test"

it("single argument", async () => {
    let count = 0
    const fn = cachedFn((_a?: string | null) => ++count)
    assert.equal(fn(), 1)

    assert.equal(fn("a"), 2)
    assert.equal(fn("a"), 2)

    assert.equal(fn("b"), 3)
    assert.equal(fn("b"), 3)

    assert.equal(fn(null), 1)
    assert.equal(fn(null), 1)
    assert.equal(fn(undefined), 1)
    assert.equal(fn(undefined), 1)
})

it("two arguments", async () => {
    let count = 0
    const fn = cachedFn((_a?: string | null, _b?: string | null) => ++count)
    assert.equal(fn(), 1)

    assert.equal(fn("a"), 2)
    assert.equal(fn("a", null), 2)
    assert.equal(fn("a", undefined), 2)

    assert.equal(fn(null, "b"), 3)
    assert.equal(fn(undefined, "b"), 3)

    assert.equal(fn(null), 1)
    assert.equal(fn(undefined), 1)
    assert.equal(fn(null, null), 1)
    assert.equal(fn(undefined, undefined), 1)
})

it("three arguments", async () => {
    let count = 0
    const fn = cachedFn((_a?: string | null, _b?: string | null, _c?: string | null) => ++count)
    assert.equal(fn(), 1)

    assert.equal(fn("a"), 2)
    assert.equal(fn("a", null), 2)
    assert.equal(fn("a", null, null), 2)

    assert.equal(fn(null, "b"), 3)
    assert.equal(fn(undefined, "b"), 3)
    assert.equal(fn(null, "b", null), 3)

    assert.equal(fn(undefined, null, "c"), 4)
    assert.equal(fn(null, undefined, "c"), 4)

    assert.equal(fn(null, null, null), 1)
    assert.equal(fn(undefined, undefined, undefined), 1)
})
