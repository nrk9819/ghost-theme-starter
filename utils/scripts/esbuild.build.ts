import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";

const buildOptions: BuildOptions = {
  entryPoints: ["assets/ts/index.ts"],
  target: "es2016",
  format: "iife",
  outfile: "assets/build/index.js",
  bundle: true,
  minify: true,
  sourcemap: true,
};

(async () => {
  try {
    console.info("Building javascript...");
    await esbuild.build(buildOptions);
    console.info(
      `Build completed successfully. Output file at ${buildOptions.outfile}`,
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    }
  }
})();
