import type { ProcessOptions } from "postcss";
import type { ConfigContext, ConfigPlugin } from "postcss-load-config";

interface Config extends ProcessOptions {
  plugins?: Array<ConfigPlugin | false> | Record<string, object | false>;
}

const postcssrc = (ctx: ConfigContext): Config => ({
  from: "./assets/styles/input.css",
  to: "./assets/build/screen.css",
  map: ctx.env === "build" ? { inline: false } : false,
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    ...(ctx.env === "build" ? { autoprefixer: {} } : {}),
    ...(ctx.env === "build" ? { cssnano: {} } : {}),
  },
});

export default postcssrc;
