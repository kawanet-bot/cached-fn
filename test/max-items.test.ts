import {cachedFn} from "cached-fn"
import {strict as assert} from "node:assert"
import {it} from "node:test"

const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms))

it("maxItems", async () => {
    let counter = 0
    const fn = (key: string): string => `${key}:${++counter}`
    const COUNT = cachedFn({maxItems: 5}, fn)

    assert.equal(COUNT("foo"), "foo:1")
    assert.equal(COUNT("bar"), "bar:2")
    assert.equal(COUNT("buz"), "buz:3")
    assert.equal(COUNT("qux"), "qux:4")
    assert.equal(COUNT("quux"), "quux:5")

    // check cached values
    assert.equal(COUNT("foo"), "foo:1") // cached
    assert.equal(COUNT("bar"), "bar:2")
    assert.equal(COUNT("buz"), "buz:3")
    assert.equal(COUNT("qux"), "qux:4")
    assert.equal(COUNT("quux"), "quux:5")

    // this exceeds maxItems limit and removes "foo" then
    assert.equal(COUNT("corge"), "corge:6")
    assert.equal(COUNT("corge"), "corge:6") // cached

    // wait a moment for garbage collection completed
    await WAIT(1001)

    // this refreshes "foo" and removes "bar" then
    assert.equal(COUNT("foo"), "foo:7") // refreshed
    assert.equal(COUNT("foo"), "foo:7") // cached

    // assert.equal(COUNT("bar"), "bar:8"); // removed
    assert.equal(COUNT("buz"), "buz:3")

    assert.equal(COUNT("buz"), "buz:3")
    assert.equal(COUNT("qux"), "qux:4")
    assert.equal(COUNT("quux"), "quux:5")
})
