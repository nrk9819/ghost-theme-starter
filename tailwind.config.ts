import type { Config } from "tailwindcss";

const twConfig: Config = {
  content: ["./**/*.hbs", "./assets/ts/**/*.ts"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default twConfig;
