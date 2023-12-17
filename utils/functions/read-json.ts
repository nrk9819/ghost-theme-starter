import { readFileSync } from "fs";
import path from "path";
import type { JsonObject } from "type-fest";

type JsonFileType<T extends string> =
  T extends `${infer _}.${infer Ext}` ?
    Ext extends "json" ?
      T
    : never
  : never;

/**
 * Function to read a JSON file.
 * @param filepath - path of the JSON file, must be relative to the project root
 * @returns - an object parsed from the JSON file or null if an error occurs
 */
export function readJson<T extends JsonObject, U extends string>(
  filepath: JsonFileType<U>,
): T | null {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), filepath)).toString(),
    ) as T;
  } catch (err) {
    console.error(err);
    return null;
  }
}
