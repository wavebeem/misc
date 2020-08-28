import chalk from "chalk";
import * as fs from "fs";
import { spawnSync, SpawnSyncReturns } from "child_process";
import { sync as rimrafSync } from "rimraf";
import { sync as globSync } from "glob";

/** Like console.log but eslint won't get mad at you */
export function log(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(...args);
}

/** Like console.log but for section headers */
export function header(...args: unknown[]): void {
  log(chalk.cyan.bold("\n", ...args, "\n"));
}

/** Recursively remove the file or directory */
export function remove(file: string): void {
  rimrafSync(file, { glob: false });
}

/** Recursively create the directory */
export function makeDir(file: string): void {
  fs.mkdirSync(file, { recursive: true });
}

/** Reads a file into a string, assuming UTF-8 encoding */
export function readFile(path: string): string {
  return fs.readFileSync(path, { encoding: "utf8" });
}

/** Writes content into a file, using UTF-8 encoding */
export function writeFile(file: string, content: string): void {
  return fs.writeFileSync(file, content, { encoding: "utf8" });
}

/** Append contents to a file, using UTF-8 encoding */
export function appendFile(file: string, content: string): void {
  return fs.appendFileSync(file, content, { encoding: "utf8" });
}

/** Returns a list of filenames in the directory */
export function listDir(path: string): string[] {
  return fs.readdirSync(path, { encoding: "utf8" });
}

/** Returns true if the path exists */
export function exists(path: string): boolean {
  return fs.existsSync(path);
}

/** Returns the current working directory */
export function cwd(): string {
  return process.cwd();
}

/**
 * Returns all files matching the glob pattern starting at dir (or cwd if not
 * passed)
 */
export function glob(pattern: string, dir: string = cwd()): string[] {
  return globSync(pattern, { cwd: dir });
}

/**
 * Returns the environment variable, throwing an error if it doesn't exist
 */
export function getEnv(name: string): string {
  const val = process.env[name];
  if (val === undefined) {
    throw new Error(`environment variable ${name} does not exist`);
  }
  return val;
}

/**
 * Deletes the environment variable
 */
export function deleteEnv(name: string): void {
  delete process.env[name];
}

/**
 * Returns the environment variable, returning the fallback value if it doesn't
 * exist
 */
export function getEnvSafe(name: string, fallback: string): string {
  const val = process.env[name];
  if (val === undefined) {
    return fallback;
  }
  return val;
}

/**
 * Sets the environment variable to the value specified
 */
export function setEnv(name: string, value: string): void {
  process.env[name] = value;
}

/**
 * Change directory only during the supplied callback
 *
 * ```
 * chdir("build", () => {
 *   // inside `build`
 * });
 * // not inside `build`
 * ```
 */
export function changeDir(newDir: string, fn: () => void): void {
  const oldDir = process.cwd();
  try {
    process.chdir(newDir);
    fn();
  } finally {
    process.chdir(oldDir);
  }
}

/**
 * Run a command and print its output to the terminal, throwing an error if the
 * status code is not zero
 *
 * ```
 * run("ls");
 * run('git commit -am "v$version"', { version });
 * run("npx npm-check -u");
 * run('mkdir "$a" "$b"', { a: "folder 1", b: "folder 2" });
 * ```
 */
export function run(
  command: string,
  env?: Record<string, string>
): SpawnSyncReturns<string> {
  const result = runSafe(command, env);
  if (result.status !== 0) {
    throw new Error(`exit ${result.status}: ${command}`);
  }
  return result;
}

/**
 * Run a command and print its output to the terminal
 *
 * ```
 * if (safeRun("git commit").status !== 0) {
 *   // ...
 * }
 * ```
 */
export function runSafe(
  command: string,
  env?: Record<string, string>
): SpawnSyncReturns<string> {
  return spawnSync(command, {
    shell: true,
    encoding: "utf-8",
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
}

/**
 * Run a command and capture its output
 *
 * ```
 * if (runQuiet("some-cmd").status !== 0) {
 *   // ...
 * }
 * if (runQuiet("other-cmd").stdout === "some output") {
 *   // ...
 * }
 * if (runQuiet("another-cmd").stderr === "some error") {
 *   // ...
 * }
 * ```
 */
export function runQuiet(
  command: string,
  env?: Record<string, string>
): SpawnSyncReturns<string> {
  return spawnSync(command, {
    shell: true,
    encoding: "utf-8",
    env: env ? { ...process.env, ...env } : process.env,
  });
}
