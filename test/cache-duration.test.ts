import {cachedFn} from "cached-fn"
import {strict as assert} from "node:assert"
import {it} from "node:test"

const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms))
const FAIL = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(ms), ms))

{
    const opt = {cache: 150}

    it(JSON.stringify(opt), {timeout: 1000}, async () => {
        const wait = cachedFn(opt, WAIT)
        const timer = createTimer(100)

        // execute first time
        assert.equal(await wait(100), 100)
        assert.equal(timer(), 100, "1. first execution")

        // return cache
        assert.equal(await wait(100), 100)
        assert.equal(timer(), 0, "2. cached")

        // execute second time
        assert.equal(await wait(200), 200)
        assert.equal(timer(), 200, "3. second execution")

        // execute third time
        assert.equal(await wait(100), 100)
        assert.equal(timer(), 100, "4. third execution")
    })
}

{
    const opt = {cache: 200}

    it(JSON.stringify(opt), {timeout: 1000}, async () => {
        const timer = createTimer(100)

        let count = 0
        const fn = (ms: number) => new Promise(resolve => setTimeout(() => resolve(count += ms), ms))
        const COUNT = cachedFn(opt, fn)

        await Promise.all([
            COUNT(100),
            COUNT(100),
            COUNT(100),
            COUNT(100),
        ])

        assert.equal(timer(), 100)
        assert.equal(count, 100)
    })
}

{
    const opt = {cache: 250}

    it(JSON.stringify(opt), {timeout: 1000}, async () => {
        const fail = cachedFn(opt, FAIL)
        const timer = createTimer(100)

        // fail
        assert.equal(await fail(100).catch(e => e + 1), 101)
        assert.equal(timer(), 100)

        // fail again without cache
        assert.equal(await fail(100).catch(e => e + 2), 102)
        assert.equal(timer(), 100)
    })
}

{
    const opt = {cache: 100, negativeCache: 150}

    it(JSON.stringify(opt), {timeout: 1000}, async () => {
        const fail = cachedFn(opt, FAIL)
        const timer = createTimer(100)

        // fail
        assert.equal(await fail(100).catch(e => e + 1), 101)
        assert.equal(timer(), 100)

        // fail with cache
        assert.equal(await fail(100).catch(e => e + 2), 102)
        assert.equal(timer(), 0)
    })
}

{
    const opt = {cache: -1, negativeCache: -1}
    it(JSON.stringify(opt), {timeout: 1000}, async () => {
        let okCount = 0
        const okFn = (inc: number): Promise<number> => new Promise(resolve => resolve(okCount += inc))
        const OK = cachedFn(opt, okFn)

        let ngCount = 0
        const ngFn = (inc: number): Promise<number> => new Promise((_, reject) => reject(ngCount += inc))
        const NG = cachedFn(opt, ngFn)

        assert.equal(await OK(100).then(e => e + 1), 101)
        assert.equal(await OK(100).then(e => e + 2), 102)
        cachedFn.flush()

        assert.equal(await OK(100).then(e => e + 3), 203)
        assert.equal(await OK(100).then(e => e + 4), 204)
        cachedFn.flush()

        assert.equal(await NG(200).catch(e => e + 5), 205)
        assert.equal(await NG(200).catch(e => e + 6), 206)
        cachedFn.flush()

        assert.equal(await NG(200).catch(e => e + 7), 407)
        assert.equal(await NG(200).catch(e => e + 8), 408)
    })
}

{
    it("cache separation", {timeout: 1000}, async () => {
        const q1Fn = async (v: number) => "Q1:" + v
        const Q1 = cachedFn({cache: -1}, q1Fn)

        const q2Fn = async (v: number) => "Q2:" + v
        const Q2 = cachedFn({cache: -1}, q2Fn)

        assert.equal(await Q1(100), "Q1:100")
        assert.equal(await Q2(200), "Q2:200")
        assert.equal(await Q1(200), "Q1:200")
        assert.equal(await Q2(100), "Q2:100")
    })
}

function createTimer(ms?: number) {
    let prev = Date.now()

    return () => {
        const now = Date.now()
        const diff = now - prev
        prev = now
        return ms ? Math.round(diff / ms) * ms : diff
    }
}
