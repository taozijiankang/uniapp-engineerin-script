import { spawn } from "child_process";

/**
 * @param command
 * @param op
 * @returns
 */
export function runCommand(
  command: string,
  { cwd = "", env = {}, handleStdout }: { cwd?: string; env?: Record<string, string>; handleStdout?: (d: string) => void } = {}
) {
  /** @type {Promise<number | null>} */
  const p = new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      shell: true,
      stdio: handleStdout ? undefined : "inherit",
    });

    child.stdout?.setEncoding("utf-8");
    child.stderr?.setEncoding("utf-8");

    child.stdout?.on("data", (data) => {
      handleStdout?.(data);
    });
    child.stderr?.on("data", (data) => {
      handleStdout?.(data);
    });

    child.on("close", (code) => {
      resolve(code);
    });
  });
  return p;
}
