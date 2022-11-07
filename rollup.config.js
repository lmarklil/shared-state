import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";

function createBuildConfig(packageName, external) {
  return {
    input: `packages/${packageName}/src/index.ts`,
    output: [
      {
        file: `packages/${packageName}/dist/index.cjs`,
        format: "cjs",
      },
      {
        file: `packages/${packageName}/dist/index.mjs`,
        format: "es",
      },
    ],
    plugins: [
      commonjs(),
      resolve(),
      typescript({
        emitDeclarationOnly: true,
        declaration: true,
        include: [`packages/${packageName}/src/**/*`],
        outDir: `packages/${packageName}/dist`,
        exclude: [
          `packages/${packageName}/node_modules`,
          `packages/${packageName}/dist`,
        ],
      }),
      babel({
        babelHelpers: "bundled",
        extensions: ["js", "jsx", "ts", "tsx"],
      }),
    ],
    external,
  };
}

/**
 * @type {import('rollup').RollupOptions}
 */
export default [
  createBuildConfig("core"),
  createBuildConfig("react", ["react"]),
  createBuildConfig("vue", ["vue"]),
  createBuildConfig("persist"),
];
