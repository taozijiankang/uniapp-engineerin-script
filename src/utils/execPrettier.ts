import { runCommand } from "./runCommand.js";

/**
 * 用 prettier 格式化代码
 * @param filePath
 * @param op
 * @returns
 */
export function execPrettier(filePath: string, { cwd = "" }: { cwd?: string } = {}) {
  return runCommand(`npx prettier --write ${filePath}`, {
    cwd,
    stdio: "inherit",
  });
}
