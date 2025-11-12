import { spawn } from "child_process";

/**
 * @param command
 * @param op
 * @returns
 */
export function runCommand(
  command: string,
  { cwd = "", env = {}, handleStdout }: { cwd?: string; env?: Record<string, string>; handleStdout?: (d: Buffer) => void } = {}
) {
  const p = new Promise<number | null>((resolve) => {
    const child = spawn(command, {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      shell: true,
      stdio: handleStdout ? undefined : "inherit",
    });

    child.stdout?.on("data", (data) => {
      handleStdout?.(data);
    });

    child.on("close", (code) => {
      resolve(code);
    });
  });
  return p;
}
