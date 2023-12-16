import { readFileSync } from "fs";
import path from "path";

/**
 * Function to read json files and return the data as object.
 * @param {import("../utils").JsonFileType} filepath - path to the json file, must be relative to the project root.
 */
export const readJson = (filepath) =>
  JSON.parse(readFileSync(path.join(process.cwd(), filepath)));
