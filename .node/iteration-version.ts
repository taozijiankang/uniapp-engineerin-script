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
  let { major = "1", minor = "0" } = options;

  major = parseInt(major.trim()).toString();
  minor = parseInt(minor.trim()).toString();

  const remoteVersions = await getRemoteVersions();

  const remoteMaxVersion = semver.maxSatisfying(remoteVersions, `*`)!;

  console.log("remoteMaxVersion:", remoteMaxVersion);

  if (semver.lt(`${major}.${Number(minor) + 1}.0`, remoteMaxVersion)) {
    throw new Error(`主版本号 ${major} 和次版本号 ${minor} 落后于远程最高版本号 ${remoteMaxVersion}`);
  }

  const newVersion = semver.inc(semver.maxSatisfying([remoteMaxVersion, `${major}.${minor}.0`], `*`)!, "patch")!;

  console.log(`npm 包 ${packageJson.name} 的版本号迭代为 ${newVersion}`);

  packageJson.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}

async function getRemoteVersions() {
  return await new Promise<string>((resolve, reject) => {
    exec(`npm view ${packageJson.name} versions`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.trim());
    });
  })
    .then((versions) => {
      return JSON.parse(versions.replace(/'/g, '"')) as string[];
    })
    .catch((error) => {
      return ["1.0.0"];
    });
}
