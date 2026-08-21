import nodeResolve from "@rollup/plugin-node-resolve"
import sucrase from "@rollup/plugin-sucrase"
import terser from "@rollup/plugin-terser"
import type {RollupOptions} from "rollup"
import {showFiles} from "./show-files.ts"

const rollupConfig: RollupOptions = {
    input: "../src/cached-fn.ts",

    output: {
        file: "../dist/cached-fn.min.js",
        format: "iife",
        name: "cachedFn",
        exports: "named",
        // The IIFE's auto-`return exports;` would yield
        // `var cachedFn = {cachedFn: <fn>}` (a namespace global). Override
        // with an early `return exports.cachedFn;` so the global is
        // `var cachedFn = <fn>` (callable directly, matching the
        // long-standing browser API). Rollup's auto-return becomes
        // unreachable and terser drops it.
        outro: "return exports.cachedFn;",
        // Make the bundle dual-purpose: as a browser <script>, the
        // global `cachedFn` is the function (set above by the IIFE);
        // when require()-d from CJS, this footer also writes
        // `exports.cachedFn = cachedFn` so consumers can reach the
        // function via `require(...).cachedFn` — the same named-export
        // shape dist/cached-fn.cjs publishes. The gate is on
        // `typeof exports` for consistency with the body that writes
        // to `exports`.
        //
        // `footer` (not `outro`) is used so the line lands AFTER the
        // IIFE assigns its return value to the outer `var cachedFn`.
        footer: "if (typeof exports !== 'undefined') { exports.cachedFn = cachedFn; }",
    },

    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false,
        }),

        sucrase({
            disableESTransforms: true,
            exclude: ["node_modules/**"],
            transforms: ["typescript"],
        }),

        showFiles(),

        terser({
            compress: true,
            ecma: 2020,
            mangle: true,
        }),
    ],
}

export default rollupConfig
