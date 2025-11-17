import { spawn } from "child_process";
import type { StdioOptions } from "node:child_process";

/**
 * @param command
 * @param options
 * @returns
 */
export function runCommand(
  command: string,
  {
    cwd = "",
    env = {},
    stdio,
    handleStdout,
    handleStderr,
  }: {
    cwd?: string;
    env?: Record<string, string>;
    stdio?: StdioOptions;
    handleStdout?: (d: Buffer) => void;
    handleStderr?: (d: Buffer) => void;
  } = {}
) {
  const p = new Promise<{ code: number | null; stdoutData: Buffer; stderrData: Buffer }>((resolve) => {
    let stdoutData = Buffer.from([]);
    let stderrData = Buffer.from([]);

    const child = spawn(command, {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      shell: true,
      stdio,
    });

    child.stdout?.on("data", (d) => {
      stdoutData = Buffer.concat([stdoutData, d]);
      handleStdout?.(d);
    });

    child.stderr?.on("data", (d) => {
      stderrData = Buffer.concat([stderrData, d]);
      handleStderr?.(d);
    });

    child.on("close", (code) => {
      resolve({ code, stdoutData, stderrData });
    });
  });
  return p;
}
