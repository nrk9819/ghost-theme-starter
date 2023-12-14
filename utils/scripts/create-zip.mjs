import fs from "fs";
import path from "path";
import archiver from "archiver";
import isGlob from "is-glob";
import globToRegex from "glob-to-regexp";

/**
 * Parses a .gitignore file and returns an array of patterns.
 *
 * @param {string} filePath - The path to the .gitignore file to parse.
 * @returns {string[]} An array of patterns from the .gitignore file.
 */
function parseGitignore(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf-8");

		const lines = content.split("\n");

		const patterns = lines.filter((line) => {
			const trimmedLine = line.trim();
			return trimmedLine !== "" && !trimmedLine.startsWith("#");
		});

		return patterns.map((pattern) =>
			pattern.replace(/(\/\r|\r|\\|\/)$/, ""),
		);
	} catch (e) {
		console.error("Error reading .gitignore file:", e);
		return [];
	}
}

/**
 * Function to check if a file should be ignored based on the patterns in the .gitignore file.
 *
 * @param {*} path
 * @param {*} gitignorePatterns
 * @returns
 */
function shouldIgnore(path, gitignorePatterns) {
	return gitignorePatterns.some((pattern) => {
		if (isGlob(pattern)) {
			return globToRegex(pattern).test(path);
		}
		return pattern === path;
	});
}

const sourceDir = "./";
const outputZip = path.resolve(path.dirname(process.cwd()), "output.zip");

const gitignore = parseGitignore(".gitignore");

const output = fs.createWriteStream(outputZip);
const archive = archiver("zip", {
	zlib: { level: 9 },
});

archive.pipe(output);

const files = fs.readdirSync(sourceDir, { withFileTypes: true });
for (const file of files) {
	const filePath = `${file.path}${file.name}`;
	if (!shouldIgnore(file.name, gitignore) && file.name !== ".git") {
		if (file.isFile()) {
			archive.file(filePath, { name: file.name });
		}
		if (file.isDirectory()) {
			archive.directory(filePath, file.name);
		}
	}
}

archive.finalize();

archive.on("end", () => {
	console.info(`Archive "${outputZip}" created successfully.`);
});

archive.on("error", (err) => {
	console.error("Error creating the archive:", err);
});
