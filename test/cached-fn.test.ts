import {strict as assert} from "node:assert"
import {it} from "node:test"
import {cachedFn} from "../src/cached-fn.ts"

it("cached-fn", async () => {
    let count = 0
    const counter = cachedFn(() => ++count)
    assert.equal(counter(), 1)
    assert.equal(counter(), 1)
    assert.equal(counter(), 1)

    const number = cachedFn((v: number) => +v)
    assert.equal(number(1), 1)
    assert.equal(number(1), 1)
    assert.equal(number(2), 2)
    assert.equal(typeof number(2), "number")

    const string = cachedFn((v: string) => String(v))
    assert.equal(string("a"), "a")
    assert.equal(string("a"), "a")
    assert.equal(string("b"), "b")
    assert.equal(typeof string("b"), "string")

    const object = cachedFn(() => [] as any[])
    assert.equal(object(), object())
})
