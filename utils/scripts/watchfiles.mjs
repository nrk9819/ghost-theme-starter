/**
 * Script to run postcss and esbuild in watch mode.
 * Watches changes in files matching tailwindConfig.content, .css, .js and .ts files
 */
import * as esbuild from "esbuild";
import chokidar from "chokidar";
import { compileCss } from "../functions/compile-css.mjs";
import tailwindConfig from "../../tailwind.config.mjs";

/** @type {esbuild.BuildOptions}*/
const watchOptions = {
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

const esbuildCtx = await esbuild.context(watchOptions);

const watcher = chokidar.watch([
	...tailwindConfig.content,
	"./assets/styles/*.{css,js}",
	"./assets/ts/**/*.ts",
	"./tailwind.config.mjs",
	"./postcss.config.mjs",
]);

watcher.on("change", async (path) => {
	console.info(`Change detected in ${path}`);

	try {
		// determine the file extension
		const fileExtension = path.split(".").pop().toLowerCase();

		if (fileExtension === "css" || fileExtension === "js") {
			// compile css in watch mode
			await compileCss("watch");
		}
		if (fileExtension === "ts") {
			// cancel if build is already running
			await esbuildCtx.cancel();

			// run esbuild in rebuild mode
			const result = await esbuildCtx.rebuild();
			console.info(result);
		}
	} catch (err) {
		console.error(err.message);
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
