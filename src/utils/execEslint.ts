import { runCommand } from "./runCommand.js";

/**
 * 用 eslint 格式化代码
 * @param filePath
 * @param op
 * @returns
 */
export function execEslint(filePath: string, { cwd = "" }: { cwd?: string } = {}) {
  return runCommand(`npx eslint --fix ${filePath}`, {
    cwd,
  });
}
