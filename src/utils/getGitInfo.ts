import { exec } from "child_process";

/**
 * 获取git信息
 * @param op
 */
export function getGitInfo({
  cwd,
}: {
  cwd?: string;
} = {}) {
  return new Promise<string>((resolve, reject) => {
    exec(
      `git log -1 HEAD --pretty=format:"%h %an %s"`,
      {
        cwd,
      },
      (error, stdout) => {
        error ? reject(stdout) : resolve(stdout);
      }
    );
  }).catch(() => {
    return "";
  });
}
