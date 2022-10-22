import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json" assert { type: "json" };

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es",
    },
  ],
  plugins: [
    commonjs(),
    resolve(),
    typescript({
      emitDeclarationOnly: true,
      declaration: true,
      declarationDir: "dist/types",
      exclude: ["tests"],
    }),
    babel({
      babelHelpers: "bundled",
      extensions: ["js", "ts"],
    }),
  ],
  external: Object.keys(pkg.peerDependencies),
};
