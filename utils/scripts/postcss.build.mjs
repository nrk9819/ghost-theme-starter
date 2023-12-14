import { compileCss } from "../functions/compile-css.mjs";

// compile css in build mode
try {
	console.info("Building CSS...");
	await compileCss("build");
} catch (e) {
	console.error(e);
}
