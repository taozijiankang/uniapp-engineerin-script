import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { program } from "commander";
import semver from "semver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "../package.json");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

interface IterationVersionOptions {
  major?: string;
  minor?: string;
}

/**
 * 指定主版本号和次版本号，自动迭代修订版本号
 */

program
  .version(packageJson.version)
  .description("迭代版本号")
  .option("-m, --major <major>", "主版本号")
  .option("-n, --minor <minor>", "次版本号")
  .action(() => {
    iterationVersion(program.opts());
  })
  .parse(process.argv);

async function iterationVersion(options: IterationVersionOptions) {
  const { major = "1", minor = "0" } = options;

  const remoteVersion = await new Promise<string>((resolve, reject) => {
    exec(`npm view ${packageJson.name} version`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.trim());
    });
  }).catch((error) => {
    return "1.0.0";
  });

  let remotePatch = semver.patch(remoteVersion);

  /**
   * 当小版本号相同时
   * 比较主版本号和次版本号
   * 如果整体大于远程版本号，则重置修订版本号为 0
   * 如果整体小于远程版本号，则抛出错误
   */
  const compareResult = semver.compare(`${major}.${minor}.${remotePatch}`, remoteVersion);
  if (compareResult === 1) {
    remotePatch = 0;
  } else if (compareResult === -1) {
    throw new Error(`新版本号 ${major}.${minor}.${remotePatch} 落后于 ${packageJson.name} 的当前版本号 ${remoteVersion}`);
  }

  let newVersion = `${major}.${minor}.${remotePatch + 1}`;

  console.log(`${packageJson.name} 的版本号从 ${remoteVersion} 迭代为 ${newVersion}`);

  return;

  packageJson.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}
