import typescript from "rollup-plugin-typescript2"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import pkg from "./package.json" assert {type: "json"}

const extensions = [".js", ".jsx", ".ts", ".tsx"]
const input = "src/Dustel.ts"

export default [
  {
    input: "build/js/Dustel.js",
    output: {
      file: pkg.module,
      format: "esm",
      sourcemap: false,
    },
    plugins: [typescript()],
  },
  // Browser-loadable file
  {
    input: "build/js/Dustel.js",
    output: {
      file: "dist/index.js",
      name: "Dustel",
      format: "iife",
      sourcemap: true,
    },
    plugins: [typescript(), resolve()],
  },
]
