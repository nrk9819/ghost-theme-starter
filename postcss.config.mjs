export default ({ env }) => ({
	from: "./assets/styles/input.css",
	to: "./assets/build/styles.css",
	map: env === "build" ? { inline: false } : false,
	plugins: {
		"postcss-import": {},
		tailwindcss: {},
		...(env === "build" ? { autoprefixer: {} } : {}),
		...(env === "build" ? { cssnano: {} } : {}),
	},
});
