import {strict as assert} from "node:assert"
import {it} from "node:test"
import {cachedFn} from "../src/cached-fn.ts"

it("cachedFn.cycle()", async () => {
    const cycle = 100
    const slotOf = () => Math.floor(Date.now() / cycle)

    // Sleeping into the next window lands just after a boundary, which
    // leaves nearly the whole window before the next one: the margin
    // matters, as the calls below must run within a single window.
    const nextWindow = () => new Promise(resolve => setTimeout(resolve, cycle - (Date.now() % cycle)))

    // A batch of calls straddling a cycle boundary recomputes once more
    // than expected. Slot guards detect that case and retry with a fresh
    // counter, so scheduling stalls on busy CI runners cannot turn into
    // false failures.
    for (let retry = 3; ; retry--) {
        let count = 0
        const counter = cachedFn.cycle(cycle, (_: string) => ++count)

        await nextWindow()

        const slot1 = slotOf()
        const first = [counter("a"), counter("a"), counter("b"), counter("b")].join()
        const inWindow1 = (slotOf() === slot1)

        await nextWindow()

        const slot2 = slotOf()
        const second = [counter("b"), counter("b"), counter("a"), counter("a")].join()
        const inWindow2 = (slotOf() === slot2)

        if (retry > 0 && !(inWindow1 && inWindow2)) continue

        assert.ok(inWindow1, "cycle boundary crossed during first batch")
        assert.ok(inWindow2, "cycle boundary crossed during second batch")
        assert.ok(slot1 < slot2, "second batch should run in a later window")
        assert.equal(first, "1,1,2,2")
        assert.equal(second, "3,3,4,4")
        break
    }
})
