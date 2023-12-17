import chokidar from "chokidar";
/**
 * Script to run postcss and esbuild in watch mode.
 * Watches changes in files matching tailwindConfig.content, .css, .js and .ts files
 */
import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import tailwindConfig from "../../tailwind.config";
import { compileCss } from "../functions/compile-css";

// esbuild options
const watchOptions: BuildOptions = {
  entryPoints: [
    {
      in: "assets/ts/index.ts",
      out: "index",
    },
  ],
  target: "es2016",
  bundle: true,
  format: "iife",
  outdir: "assets/build",
};

// array of files to watch by chokidar watcher
const watchables: string[] = [
  "./assets/styles/*.{css,js}",
  "./assets/ts/**/*.ts",
  "./tailwind.config.ts",
  "./postcss.config.ts",
];

// add file paths from tailwindConfig.content to watchables array
if (Array.isArray(tailwindConfig.content)) {
  for (const content of tailwindConfig.content) {
    typeof content === "string" && watchables.push(content);
  }
}

(async () => {
  const esbuildCtx = await esbuild.context(watchOptions);

  const watcher = chokidar.watch(watchables);

  watcher.on("change", async (path) => {
    console.info(`Change detected in ${path}`);

    try {
      // determine the file extension
      const fileExtension = path?.split(".")?.pop()?.toLowerCase();

      if (fileExtension === "css" || fileExtension === "js") {
        // compile css in watch mode
        await compileCss("watch");
      }
      if (fileExtension === "ts") {
        // cancel if build is already running
        await esbuildCtx.cancel();

        // run esbuild in rebuild mode
        const result = await esbuildCtx.rebuild();

        // log errors if any
        result.errors.length > 0 &&
          console.error("Build failed with errors", result.errors);

        // log warnings if any
        result.warnings.length > 0 &&
          console.warn("Build completed with warnings", result.warnings);

        // if no errors and no warnings, log success message
        result.errors.length === 0 &&
          result.warnings.length === 0 &&
          console.info("Build completed successfully");
      }
    } catch (err) {
      err instanceof Error && console.error(err.message);
    }
  });

  watcher.on("error", (err) => {
    console.error(err.message);
    handleExit();
  });

  // function to handle exit and perform cleanup
  function handleExit() {
    console.warn("Exiting file watcher...");
    esbuildCtx.dispose();
    watcher.close();
    process.exit(0);
  }

  // handle SIGINT (Ctrl+C)
  process.on("SIGINT", handleExit);

  // handle SIGTERM (Ctrl+Z)
  process.on("SIGTERM", handleExit);

  console.info("Watching for changes...");
})();
