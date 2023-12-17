import { readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";
import postcssrc from "postcss-load-config";
import type { ConfigContext } from "postcss-load-config";

/**
 * Function to compile and write css into files based on postcss config
 * @param env - type of target environment, default is set to "build"
 */
export async function compileCss(env = "build"): Promise<void> {
  const ctx: ConfigContext = {
    env,
  };

  const start = performance.now();
  try {
    const { plugins, options } = await postcssrc(ctx);
    const css = options.from ? await readFile(options.from, "utf8") : "";
    const result = await postcss(plugins).process(css, options);

    options.to && (await writeFile(options.to, result.css, "utf8"));

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
