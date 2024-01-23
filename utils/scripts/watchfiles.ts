/**
 * Script to run postcss and esbuild in watch mode.
 * Watches changes in files matching tailwindConfig.content, .css, .js and .ts files
 */
import EventEmitter from "events";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import * as esbuild from "esbuild";
import type { BuildOptions, BuildContext } from "esbuild";
import tailwindConfig from "../../tailwind.config";
import { compileCss } from "../functions/compile-css";

const fileChangeEmitter = new EventEmitter();
type FileEvents = "change" | "unlink" | "error" | "close";
type EventPayload = {
  path: string;
  errMsg?: string;
};

// function to emit events
const emitEvent = (options: {
  event: FileEvents;
  path: string;
  errMsg?: string;
}) => {
  const { event, path, errMsg } = options;
  fileChangeEmitter.emit(event, {
    path,
    ...(errMsg ? { errMsg } : {}),
  });
};

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

// function to process ts and css files
const processFiles = async (options: {
  esbuildCtx: BuildContext;
  path: string;
}) => {
  const { esbuildCtx, path } = options;
  try {
    // determine the file extension
    const fileExtension = path?.split(".")?.pop()?.toLowerCase();

    await compileCss("watch");

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
    err instanceof Error && emitEvent({ event: "error", path });
  }
};

// function to handle file changes
const handleChange = async (options: {
  esbuildCtx: BuildContext;
  path: string;
  event?: FileEvents;
}) => {
  const { esbuildCtx, path, event } = options;
  await processFiles({ esbuildCtx, path });
  event && emitEvent({ event, path });
};

// function to handle exit
const handleExit = (options: {
  esbuildCtx: BuildContext;
  watcher: FSWatcher;
}) => {
  console.warn("Exiting file watcher...");
  options.esbuildCtx.dispose();
  options.watcher.close();
  emitEvent({ event: "close", path: "" });
  process.exit(0);
};

(async () => {
  const esbuildCtx = await esbuild.context(watchOptions);
  const watcher = chokidar.watch(watchables);

  watcher.on(
    "change",
    async (path) => await handleChange({ esbuildCtx, path, event: "change" }),
  );
  watcher.on(
    "unlink",
    async (path) => await handleChange({ esbuildCtx, path, event: "unlink" }),
  );
  watcher.on("error", (err) => {
    console.error(err.message);
    handleExit({ esbuildCtx, watcher });
  });

  // handle SIGINT (Ctrl+C) and SIGTERM (Ctrl+Z)
  process
    .on("SIGINT", () => handleExit({ esbuildCtx, watcher }))
    .on("SIGTERM", () => handleExit({ esbuildCtx, watcher }));

  console.info("Watching for changes...");
})();

export { fileChangeEmitter };
export type { FileEvents, EventPayload };
