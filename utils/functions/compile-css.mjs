import { readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";
import postcssrc from "postcss-load-config";

/**
 * Function to compile css based on postcss config.
 *
 * @param {string} env - environment to run the function (build, ci etc). Default is set to "build"
 */
export async function compileCss(env = "build") {
	const ctx = {
		env,
	};

	const start = performance.now();
	try {
		const { plugins, options } = await postcssrc(ctx);
		const css = await readFile(options.from, "utf8");
		const result = await postcss(plugins).process(css, options);

		await writeFile(options.to, result.css, "utf8");

		// write sourcemap if generated
		if (result.map) {
			await writeFile(`${options.to}.map`, result.map.toString(), "utf8");
		}

		const end = performance.now();
		const duration = (end - start).toFixed(2);
		console.info(`CSS compiled in ${duration} ms\n`);
	} catch (e) {
		console.error(e);
	}
}
