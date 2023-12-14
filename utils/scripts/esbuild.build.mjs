import * as esbuild from "esbuild";

/** @type {esbuild.BuildOptions}*/
const buildOptions = {
	entryPoints: ["assets/ts/index.ts"],
	target: "es2016",
	format: "iife",
	outfile: "assets/build/index.js",
	bundle: true,
	minify: true,
	sourcemap: true,
};

// run esbuild in build mode
try {
	console.info("Building javascript...");
	await esbuild.build(buildOptions);
	console.info(
		`Build completed successfully. Output file at ${buildOptions.outfile}`,
	);
} catch (err) {
	console.error(err.message);
}
